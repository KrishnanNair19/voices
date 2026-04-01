"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = getSession;
exports.createSession = createSession;
exports.createAuthSession = createAuthSession;
exports.updateSession = updateSession;
exports.advanceState = advanceState;
exports.appendText = appendText;
exports.appendMediaUrl = appendMediaUrl;
exports.deleteSession = deleteSession;
exports.findUserByPhone = findUserByPhone;
exports.findUserByEmail = findUserByEmail;
exports.linkPhoneToUser = linkPhoneToUser;
exports.unlinkPhoneFromUser = unlinkPhoneFromUser;
const firestore_1 = require("firebase-admin/firestore");
const SESSIONS_COLLECTION = 'whatsapp_sessions';
function db() {
    return (0, firestore_1.getFirestore)();
}
// ── Read ─────────────────────────────────────────────────────────────────────
async function getSession(phoneNumber) {
    const snap = await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).get();
    if (!snap.exists)
        return null;
    return snap.data();
}
// ── Create ───────────────────────────────────────────────────────────────────
/** Creates a story-collection session for an already-authenticated user. */
async function createSession(phoneNumber, userId) {
    const now = firestore_1.Timestamp.now();
    const session = {
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
    };
    await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).set(session);
    return session;
}
/** Creates a sign-in session for an unknown (unlinked) phone number. */
async function createAuthSession(phoneNumber) {
    const now = firestore_1.Timestamp.now();
    const session = {
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
    };
    await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).set(session);
    return session;
}
async function updateSession(phoneNumber, updates) {
    await db()
        .collection(SESSIONS_COLLECTION)
        .doc(phoneNumber)
        .update({
        ...updates,
        lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
/** Convenience: just advance the state machine without changing content. */
async function advanceState(phoneNumber, state) {
    return updateSession(phoneNumber, { state });
}
/** Append a text chunk to an existing session (newline-delimited). */
async function appendText(phoneNumber, chunk) {
    await db().runTransaction(async (tx) => {
        const ref = db().collection(SESSIONS_COLLECTION).doc(phoneNumber);
        const snap = await tx.get(ref);
        const existing = snap.data().textContent;
        const newText = existing ? `${existing}\n\n${chunk}` : chunk;
        tx.update(ref, {
            textContent: newText,
            contentType: 'text',
            lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
        });
    });
}
/** Append a media URL to the session's mediaUrls array. */
async function appendMediaUrl(phoneNumber, url) {
    await db()
        .collection(SESSIONS_COLLECTION)
        .doc(phoneNumber)
        .update({
        mediaUrls: firestore_1.FieldValue.arrayUnion(url),
        lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
// ── Delete ───────────────────────────────────────────────────────────────────
async function deleteSession(phoneNumber) {
    await db().collection(SESSIONS_COLLECTION).doc(phoneNumber).delete();
}
// ── User ↔ phone linking ──────────────────────────────────────────────────────
/**
 * Finds a Voices user whose `whatsappPhone` field matches the given E.164 number.
 * Returns the uid or null if no match.
 */
async function findUserByPhone(phoneNumber) {
    const snap = await db()
        .collection('users')
        .where('whatsappPhone', '==', phoneNumber)
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    return snap.docs[0].id;
}
/**
 * Finds a Voices user by their account email address.
 * Returns the uid or null if no match.
 */
async function findUserByEmail(email) {
    const snap = await db()
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const data = snap.docs[0].data();
    return {
        uid: snap.docs[0].id,
        displayName: data['displayName'] || 'there',
    };
}
/**
 * Writes the user's WhatsApp phone number to their Firestore profile.
 * This is what `findUserByPhone` queries on subsequent messages.
 */
async function linkPhoneToUser(userId, phoneNumber) {
    await db().collection('users').doc(userId).update({ whatsappPhone: phoneNumber });
}
/**
 * Removes the WhatsApp phone link from a user's profile.
 * Called on SIGN OUT.
 */
async function unlinkPhoneFromUser(userId) {
    await db()
        .collection('users')
        .doc(userId)
        .update({ whatsappPhone: firestore_1.FieldValue.delete() });
}
