"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStartStory = handleStartStory;
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
/**
 * Handles the "START STORY" command.
 *
 * Requires the phone number to be linked to a Voices account.
 * If not linked, starts the auth flow instead of creating a story session.
 *
 * @param existingSession  The current session, if any (may be auth or story state).
 * @param userId           The Voices uid linked to this phone, or null if unlinked.
 */
async function handleStartStory(phoneNumber, existingSession, userId, res) {
    // Block if user is mid-auth — they need to finish signing in first
    if (existingSession?.state === 'awaiting_auth_email' ||
        existingSession?.state === 'awaiting_auth_otp') {
        (0, twilioHelper_1.twimlReply)(res, `Please finish signing in first.\n\n` +
            (existingSession.state === 'awaiting_auth_email'
                ? `Send your Voices account email address.`
                : `Send the sign-in code that was just sent to you.`));
        return;
    }
    // Discard any in-progress story session
    if (existingSession) {
        await (0, sessionManager_1.deleteSession)(phoneNumber);
    }
    // Not linked — start auth flow
    if (!userId) {
        await (0, sessionManager_1.createAuthSession)(phoneNumber);
        (0, twilioHelper_1.twimlReply)(res, `👋 To create stories you need to sign in to your Voices account.\n\n` +
            `Please send your Voices account email address.`);
        return;
    }
    // Linked — create story session
    await (0, sessionManager_1.createSession)(phoneNumber, userId);
    (0, twilioHelper_1.twimlReply)(res, `🎙 Story started! Send your content — text or a voice message.\n\n` +
        `You can also attach photos or video at any time.\n\n` +
        `⚠️ You can use text OR audio, but not both in the same story.\n\n` +
        `Send FINISH when you're ready to publish.`);
}
