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

/** Creates a story-collection session for an already-authenticated user. */
export async function createSession(
  phoneNumber: string,
  userId: string,
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
    draftLocationLat: 0,
    draftLocationLng: 0,
    pendingLocationName: null,
    pendingLocationLat: null,
    pendingLocationLng: null,
    draftTags: [],
    isPublic: true,
    pendingAuthEmail: null,
    authOtpCode: null,
    authOtpExpiresAt: null,
    authOtpAttempts: 0,
    userId,
    createdAt: now,
    lastActivityAt: now,
    reminderSentAt: null,
  }
  await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).set(session)
  return session
}

/** Creates a sign-in session for an unknown (unlinked) phone number. */
export async function createAuthSession(phoneNumber: string): Promise<WhatsAppSession> {
  const now = Timestamp.now()
  const session: WhatsAppSession = {
    phoneNumber,
    state: 'awaiting_auth_email',
    contentType: null,
    textContent: '',
    audioUrl: null,
    mediaUrls: [],
    videoUrl: null,
    draftTitle: null,
    draftLocation: null,
    draftLocationLat: 0,
    draftLocationLng: 0,
    pendingLocationName: null,
    pendingLocationLat: null,
    pendingLocationLng: null,
    draftTags: [],
    isPublic: true,
    pendingAuthEmail: null,
    authOtpCode: null,
    authOtpExpiresAt: null,
    authOtpAttempts: 0,
    userId: null,
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

// ── User ↔ phone linking ──────────────────────────────────────────────────────

/**
 * Finds a Voices user whose `whatsappPhone` field matches the given E.164 number.
 * Returns the uid or null if no match.
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

/**
 * Finds a Voices user by their account email address.
 * Returns the uid or null if no match.
 */
export async function findUserByEmail(
  email: string,
): Promise<{ uid: string; displayName: string } | null> {
  const snap = await db()
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get()
  if (snap.empty) return null
  const data = snap.docs[0]!.data()
  return {
    uid: snap.docs[0]!.id,
    displayName: (data['displayName'] as string) || 'there',
  }
}

/**
 * Writes the user's WhatsApp phone number to their Firestore profile.
 * This is what `findUserByPhone` queries on subsequent messages.
 */
export async function linkPhoneToUser(
  userId: string,
  phoneNumber: string,
): Promise<void> {
  await db().collection('users').doc(userId).update({ whatsappPhone: phoneNumber })
}

/**
 * Removes the WhatsApp phone link from a user's profile.
 * Called on SIGN OUT.
 */
export async function unlinkPhoneFromUser(userId: string): Promise<void> {
  await db()
    .collection('users')
    .doc(userId)
    .update({ whatsappPhone: FieldValue.delete() })
}
