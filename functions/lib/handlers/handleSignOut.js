"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignOut = handleSignOut;
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
/**
 * Handles the "SIGN OUT" command.
 *
 * - Removes the whatsappPhone field from the user's Voices profile.
 * - Deletes any active session (discarding an in-progress story if one exists).
 * - After sign-out the phone is unknown again; the next message will restart
 *   the auth flow.
 */
async function handleSignOut(phoneNumber, hasActiveSession, res) {
    const userId = await (0, sessionManager_1.findUserByPhone)(phoneNumber);
    if (!userId) {
        (0, twilioHelper_1.twimlReply)(res, `You're not currently signed in to any Voices account.\n\n` +
            `Send any message to begin sign-in.`);
        return;
    }
    await (0, sessionManager_1.unlinkPhoneFromUser)(userId);
    await (0, sessionManager_1.deleteSession)(phoneNumber);
    const storyNote = hasActiveSession
        ? '\n\n⚠️ Your in-progress story has been discarded.'
        : '';
    (0, twilioHelper_1.twimlReply)(res, `✅ Signed out successfully.${storyNote}\n\n` +
        `Send any message to sign in with a different account.`);
}
