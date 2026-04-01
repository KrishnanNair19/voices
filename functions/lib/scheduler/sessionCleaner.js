"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSessionCleaner = runSessionCleaner;
const firestore_1 = require("firebase-admin/firestore");
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
const config_1 = require("../config");
const SESSIONS_COLLECTION = 'whatsapp_sessions';
/**
 * Runs on a schedule (every 30 minutes) to:
 *
 * 1. Send a reminder to users whose session has been inactive for ≥ 1 hour
 *    and hasn't been reminded yet.
 * 2. Delete sessions that have been inactive for ≥ 24 hours (regardless of
 *    reminder status).
 */
async function runSessionCleaner() {
    const db = (0, firestore_1.getFirestore)();
    const now = Date.now();
    const reminderThresholdMs = config_1.config.limits.reminderAfterMinutes * 60 * 1000;
    const deleteThresholdMs = config_1.config.limits.deleteAfterMinutes * 60 * 1000;
    const reminderCutoff = firestore_1.Timestamp.fromMillis(now - reminderThresholdMs);
    const deleteCutoff = firestore_1.Timestamp.fromMillis(now - deleteThresholdMs);
    const snap = await db
        .collection(SESSIONS_COLLECTION)
        .where('lastActivityAt', '<=', reminderCutoff)
        .get();
    if (snap.empty) {
        console.info('[sessionCleaner] No stale sessions found.');
        return;
    }
    const reminders = [];
    const deletions = [];
    for (const doc of snap.docs) {
        const session = doc.data();
        const lastActivity = session.lastActivityAt.toMillis();
        const isExpired = lastActivity <= deleteCutoff.toMillis();
        const needsReminder = !session.reminderSentAt && !isExpired;
        if (isExpired) {
            console.info(`[sessionCleaner] Deleting expired session for ${session.phoneNumber}`);
            deletions.push(sendExpiredNotice(session.phoneNumber).then(() => (0, sessionManager_1.deleteSession)(session.phoneNumber)));
        }
        else if (needsReminder) {
            console.info(`[sessionCleaner] Sending reminder to ${session.phoneNumber}`);
            reminders.push(sendReminderAndMark(db, session));
        }
    }
    await Promise.allSettled([...reminders, ...deletions]);
    console.info(`[sessionCleaner] Done. Reminders: ${reminders.length}, Deletions: ${deletions.length}`);
}
// ── Helper: send reminder + mark session ─────────────────────────────────────
async function sendReminderAndMark(db, session) {
    await (0, twilioHelper_1.sendOutboundMessage)(session.phoneNumber, `👋 Don't forget about your story-in-progress on Voices!\n\n` +
        `Send FINISH to publish it, or keep adding content.\n\n` +
        `_(Your story will be automatically deleted in 23 hours if not finished.)_`);
    await db
        .collection(SESSIONS_COLLECTION)
        .doc(session.phoneNumber)
        .update({ reminderSentAt: firestore_1.Timestamp.now() });
}
// ── Helper: expired notice ────────────────────────────────────────────────────
async function sendExpiredNotice(phoneNumber) {
    try {
        await (0, twilioHelper_1.sendOutboundMessage)(phoneNumber, `🗑 Your unfinished Voices story has been deleted after 24 hours of inactivity.\n\n` +
            `Send "START STORY" any time to begin a new one.`);
    }
    catch (err) {
        // Don't let a failed notification block the deletion
        console.warn(`[sessionCleaner] Failed to send expiry notice to ${phoneNumber}:`, err);
    }
}
