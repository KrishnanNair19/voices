import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { sendOutboundMessage } from '../webhook/twilioHelper'
import { deleteSession } from '../webhook/sessionManager'
import type { WhatsAppSession } from '../types'
import { config } from '../config'

const SESSIONS_COLLECTION = 'whatsapp_sessions'

/**
 * Runs on a schedule (every 30 minutes) to:
 *
 * 1. Send a reminder to users whose session has been inactive for ≥ 1 hour
 *    and hasn't been reminded yet.
 * 2. Delete sessions that have been inactive for ≥ 24 hours (regardless of
 *    reminder status).
 */
export async function runSessionCleaner(): Promise<void> {
  const db = getFirestore()
  const now = Date.now()

  const reminderThresholdMs = config.limits.reminderAfterMinutes * 60 * 1000
  const deleteThresholdMs = config.limits.deleteAfterMinutes * 60 * 1000

  const reminderCutoff = Timestamp.fromMillis(now - reminderThresholdMs)
  const deleteCutoff = Timestamp.fromMillis(now - deleteThresholdMs)

  const snap = await db
    .collection(SESSIONS_COLLECTION)
    .where('lastActivityAt', '<=', reminderCutoff)
    .get()

  if (snap.empty) {
    console.info('[sessionCleaner] No stale sessions found.')
    return
  }

  const reminders: Promise<void>[] = []
  const deletions: Promise<void>[] = []

  for (const doc of snap.docs) {
    const session = doc.data() as WhatsAppSession

    const lastActivity = session.lastActivityAt.toMillis()
    const isExpired = lastActivity <= deleteCutoff.toMillis()
    const needsReminder = !session.reminderSentAt && !isExpired

    if (isExpired) {
      console.info(`[sessionCleaner] Deleting expired session for ${session.phoneNumber}`)
      deletions.push(
        sendExpiredNotice(session.phoneNumber).then(() =>
          deleteSession(session.phoneNumber),
        ),
      )
    } else if (needsReminder) {
      console.info(`[sessionCleaner] Sending reminder to ${session.phoneNumber}`)
      reminders.push(sendReminderAndMark(db, session))
    }
  }

  await Promise.allSettled([...reminders, ...deletions])
  console.info(
    `[sessionCleaner] Done. Reminders: ${reminders.length}, Deletions: ${deletions.length}`,
  )
}

// ── Helper: send reminder + mark session ─────────────────────────────────────

async function sendReminderAndMark(
  db: FirebaseFirestore.Firestore,
  session: WhatsAppSession,
): Promise<void> {
  await sendOutboundMessage(
    session.phoneNumber,
    `👋 Don't forget about your story-in-progress on Voices!\n\n` +
      `Send FINISH to publish it, or keep adding content.\n\n` +
      `_(Your story will be automatically deleted in 23 hours if not finished.)_`,
  )
  await db
    .collection(SESSIONS_COLLECTION)
    .doc(session.phoneNumber)
    .update({ reminderSentAt: Timestamp.now() })
}

// ── Helper: expired notice ────────────────────────────────────────────────────

async function sendExpiredNotice(phoneNumber: string): Promise<void> {
  try {
    await sendOutboundMessage(
      phoneNumber,
      `🗑 Your unfinished Voices story has been deleted after 24 hours of inactivity.\n\n` +
        `Send "START STORY" any time to begin a new one.`,
    )
  } catch (err) {
    // Don't let a failed notification block the deletion
    console.warn(`[sessionCleaner] Failed to send expiry notice to ${phoneNumber}:`, err)
  }
}
