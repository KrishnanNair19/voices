import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { WhatsAppSession, SessionState, ContentType } from '../types'

const SESSIONS_COLLECTION = 'whatsapp_sessions'

function db() {
  return getFirestore()
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getSession(phoneNumber: string): Promise<WhatsAppSession | null> {
  const snap = await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).get()
  if (!snap.exists) return null
  return snap.data() as WhatsAppSession
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createSession(
  phoneNumber: string,
  userId: string | null,
): Promise<WhatsAppSession> {
  const now = Timestamp.now()
  const session: WhatsAppSession = {
    phoneNumber,
    state: 'collecting',
    contentType: null,
    textContent: '',
    audioUrl: null,
    mediaUrls: [],
    videoUrl: null,
    draftTitle: null,
    draftLocation: null,
    draftTags: [],
    isPublic: true,
    userId,
    createdAt: now,
    lastActivityAt: now,
    reminderSentAt: null,
  }
  await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).set(session)
  return session
}

// ── Update ───────────────────────────────────────────────────────────────────

type SessionUpdate = Partial<
  Omit<WhatsAppSession, 'phoneNumber' | 'createdAt' | 'lastActivityAt'>
>

export async function updateSession(
  phoneNumber: string,
  updates: SessionUpdate,
): Promise<void> {
  await db()
    .collection(SESSIONS_COLLECTION)
    .doc(phoneNumber)
    .update({
      ...updates,
      lastActivityAt: FieldValue.serverTimestamp(),
    })
}

/** Convenience: just advance the state machine without changing content. */
export async function advanceState(
  phoneNumber: string,
  state: SessionState,
): Promise<void> {
  return updateSession(phoneNumber, { state })
}

/** Append a text chunk to an existing session (newline-delimited). */
export async function appendText(phoneNumber: string, chunk: string): Promise<void> {
  // Use a transaction to safely read-modify-write the string field.
  await db().runTransaction(async (tx) => {
    const ref = db().collection(SESSIONS_COLLECTION).doc(phoneNumber)
    const snap = await tx.get(ref)
    const existing = (snap.data() as WhatsAppSession).textContent
    const newText = existing ? `${existing}\n\n${chunk}` : chunk
    tx.update(ref, {
      textContent: newText,
      contentType: 'text' as ContentType,
      lastActivityAt: FieldValue.serverTimestamp(),
    })
  })
}

/** Append a media URL to the session's mediaUrls array. */
export async function appendMediaUrl(phoneNumber: string, url: string): Promise<void> {
  await db()
    .collection(SESSIONS_COLLECTION)
    .doc(phoneNumber)
    .update({
      mediaUrls: FieldValue.arrayUnion(url),
      lastActivityAt: FieldValue.serverTimestamp(),
    })
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteSession(phoneNumber: string): Promise<void> {
  await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).delete()
}

// ── Lookup user by WhatsApp phone ─────────────────────────────────────────────

/**
 * Finds a Voices user whose `whatsappPhone` field matches the given E.164 number.
 * Returns the uid string or null if no match.
 */
export async function findUserByPhone(phoneNumber: string): Promise<string | null> {
  const snap = await db()
    .collection('users')
    .where('whatsappPhone', '==', phoneNumber)
    .limit(1)
    .get()
  if (snap.empty) return null
  return snap.docs[0]!.id
}
