import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { WhatsAppSession } from '../types'

// Mirror the StoryContentType from @voices/core (can't import it here — no
// dependency on the client package from functions)
type StoryContentType = 'audio' | 'text' | 'image' | 'video' | 'mixed'

// ── Content-type resolver ─────────────────────────────────────────────────────

function resolveContentType(session: WhatsAppSession): StoryContentType {
  const hasAudio = session.audioUrl !== null
  const hasText = session.textContent.trim().length > 0
  const hasImage = session.mediaUrls.length > 0
  const hasVideo = session.videoUrl !== null

  if (hasAudio && hasImage) return 'mixed'
  if (hasText && hasImage) return 'mixed'
  if (hasAudio) return 'audio'
  if (hasText) return 'text'
  if (hasVideo) return 'video'
  if (hasImage) return 'image'
  // Fallback — should never reach here after handleFinish guard
  return 'text'
}

// ── Firestore document builder ────────────────────────────────────────────────

interface StoryDocument {
  id: string
  title: string
  description: string
  contentType: StoryContentType
  audioUrl: string | null
  textContent: string | null
  mediaUrls: string[]
  videoUrl: string | null
  thumbnailUrl: string | null
  transcriptUrl: string | null
  coverImageUrl: string | null
  location: { lat: number; lng: number }
  locationName: string | null
  locationRegion: string | null
  tags: string[]
  authorId: string
  durationMs: number | null
  wordCount: number | null
  isPublic: boolean
  playCount: number
  likeCount: number
  commentCount: number
  source: 'whatsapp'
  createdAt: FirebaseFirestore.FieldValue
  updatedAt: FirebaseFirestore.FieldValue
}

function buildStoryDocument(id: string, session: WhatsAppSession): StoryDocument {
  const contentType = resolveContentType(session)

  // Estimate word count for text stories
  const wordCount =
    session.textContent.trim().length > 0
      ? session.textContent.trim().split(/\s+/).length
      : null

  // Use the first uploaded image as cover if available
  const coverImageUrl =
    session.mediaUrls.length > 0 ? (session.mediaUrls[0] ?? null) : null

  return {
    id,
    title: session.draftTitle ?? 'Untitled Story',
    description: '',
    contentType,
    audioUrl: session.audioUrl,
    textContent: session.textContent.trim() || null,
    mediaUrls: session.mediaUrls,
    videoUrl: session.videoUrl,
    thumbnailUrl: null,
    transcriptUrl: null,
    coverImageUrl,
    location: { lat: 0, lng: 0 }, // coordinates unknown from WhatsApp text
    locationName: session.draftLocation,
    locationRegion: deriveRegion(session.draftLocation),
    tags: session.draftTags,
    authorId: session.userId ?? `whatsapp_${session.phoneNumber.replace(/\+/g, '')}`,
    durationMs: null,
    wordCount,
    isPublic: session.isPublic,
    playCount: 0,
    likeCount: 0,
    commentCount: 0,
    source: 'whatsapp',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
}

/**
 * Extracts a rough region from a free-text location string.
 * e.g. "Hanoi, Vietnam" → "Vietnam"
 * Returns null when nothing useful can be inferred.
 */
function deriveRegion(locationName: string | null): string | null {
  if (!locationName) return null
  const parts = locationName.split(',').map((p) => p.trim())
  return parts.length > 1 ? (parts[parts.length - 1] ?? null) : (parts[0] ?? null)
}

// ── Increment user story count ────────────────────────────────────────────────

async function incrementUserStoryCount(userId: string): Promise<void> {
  const db = getFirestore()
  // Only increment if this is a real Voices user (not a fallback phone ID)
  if (userId.startsWith('whatsapp_')) return
  await db
    .collection('users')
    .doc(userId)
    .update({ storyCount: FieldValue.increment(1) })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates the Firestore story document and returns the new story ID.
 */
export async function publishStory(session: WhatsAppSession): Promise<string> {
  const db = getFirestore()
  const storyRef = db.collection('stories').doc()
  const doc = buildStoryDocument(storyRef.id, session)

  await storyRef.set(doc)

  if (session.userId) {
    await incrementUserStoryCount(session.userId)
  }

  console.info(`[storyPublisher] Published story ${storyRef.id} for ${session.phoneNumber}`)
  return storyRef.id
}
