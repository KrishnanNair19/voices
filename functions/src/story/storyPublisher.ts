import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import type { WhatsAppSession } from '../types'

// Mirror the StoryContentType from @voices/core (no dependency on client package)
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

  const wordCount =
    session.textContent.trim().length > 0
      ? session.textContent.trim().split(/\s+/).length
      : null

  const coverImageUrl = session.mediaUrls.length > 0 ? (session.mediaUrls[0] ?? null) : null

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
    // Use geocoded coordinates if available, otherwise default to 0,0
    location: {
      lat: session.draftLocationLat,
      lng: session.draftLocationLng,
    },
    locationName: session.draftLocation,
    locationRegion: deriveRegion(session.draftLocation),
    tags: session.draftTags,
    authorId: session.userId!, // guaranteed non-null; router enforces auth before publish
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

function deriveRegion(locationName: string | null): string | null {
  if (!locationName) return null
  const parts = locationName.split(',').map((p) => p.trim())
  return parts.length > 1 ? (parts[parts.length - 1] ?? null) : (parts[0] ?? null)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates the Firestore story document and returns the new story ID.
 * Throws if the session has no linked userId (should never reach here
 * after auth is enforced in the router, but guards against bugs).
 */
export async function publishStory(session: WhatsAppSession): Promise<string> {
  if (!session.userId) {
    throw new Error('Cannot publish story: session has no authenticated userId')
  }

  const db = getFirestore()
  const storyRef = db.collection('stories').doc()
  const doc = buildStoryDocument(storyRef.id, session)

  await storyRef.set(doc)

  // Increment the user's story count
  await db
    .collection('users')
    .doc(session.userId)
    .update({ storyCount: FieldValue.increment(1) })

  console.info(`[storyPublisher] Published story ${storyRef.id} for user ${session.userId}`)
  return storyRef.id
}
