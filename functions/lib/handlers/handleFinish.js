"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFinish = handleFinish;
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
/**
 * Handles the "FINISH" command while in the 'collecting' state.
 *
 * Validates that some content exists, then kicks off the metadata
 * collection flow (title → location → tags → visibility).
 */
async function handleFinish(phoneNumber, session, res) {
    // Guard: must be in the collecting state
    if (session.state !== 'collecting') {
        (0, twilioHelper_1.twimlReply)(res, 'You\'re already in the middle of adding details. ' +
            'Reply to the current question or send SKIP to continue.');
        return;
    }
    // Guard: must have some content
    const hasContent = session.textContent.trim().length > 0 ||
        session.audioUrl !== null ||
        session.mediaUrls.length > 0 ||
        session.videoUrl !== null;
    if (!hasContent) {
        (0, twilioHelper_1.twimlReply)(res, 'Your story is empty — please send some content first (text, voice, or media), then FINISH.');
        return;
    }
    await (0, sessionManager_1.advanceState)(phoneNumber, 'awaiting_title');
    (0, twilioHelper_1.twimlReply)(res, `Nice! Let's add a few details before publishing.\n\n` +
        `*What's the title of your story?*\n(or reply SKIP)`);
}
