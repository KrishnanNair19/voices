"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleContent = handleContent;
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
/**
 * Handles a plain-text message while in the 'collecting' state.
 *
 * Enforces the logic gate: if audio has already been received, text is rejected.
 */
async function handleContent(phoneNumber, session, msg, res) {
    // Logic gate: text + audio cannot coexist
    if (session.contentType === 'audio') {
        (0, twilioHelper_1.twimlReply)(res, '⛔ This story already contains a voice message. ' +
            'You can\'t add text to an audio story.\n\n' +
            'Send FINISH to publish, or send "START STORY" to begin a new one.');
        return;
    }
    await (0, sessionManager_1.appendText)(phoneNumber, msg.Body);
    const isFirstChunk = !session.textContent.trim();
    (0, twilioHelper_1.twimlReply)(res, isFirstChunk
        ? '✅ Got it! Keep writing — send more messages to continue your story, or FINISH when done.'
        : '✅ Added! Keep going or send FINISH when you\'re done.');
}
