"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMedia = handleMedia;
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
const mediaProcessor_1 = require("../media/mediaProcessor");
/** MIME type prefixes considered "audio" (WhatsApp voice notes and audio files). */
const AUDIO_MIME_PREFIXES = ['audio/'];
/** MIME type prefixes considered "video". */
const VIDEO_MIME_PREFIXES = ['video/'];
/** MIME type prefixes considered "image". */
const IMAGE_MIME_PREFIXES = ['image/'];
function isAudio(ct) {
    return AUDIO_MIME_PREFIXES.some((p) => ct.startsWith(p));
}
function isVideo(ct) {
    return VIDEO_MIME_PREFIXES.some((p) => ct.startsWith(p));
}
function isImage(ct) {
    return IMAGE_MIME_PREFIXES.some((p) => ct.startsWith(p));
}
/**
 * Handles incoming media (images, video, voice messages) while in the
 * 'collecting' state.
 *
 * Logic gate (audio):
 *   - If the session already has text and the user sends audio → reject.
 *   - If the session already has audio and the user sends text (via caption) → reject caption.
 *   - Images/video are always accepted alongside either content type.
 */
async function handleMedia(phoneNumber, session, msg, res) {
    const replies = [];
    for (let i = 0; i < msg.NumMedia; i++) {
        const url = msg.mediaUrls[i];
        const contentType = msg.mediaContentTypes[i];
        if (!url || !contentType)
            continue;
        if (isAudio(contentType)) {
            // Logic gate: can't add audio if text already exists
            if (session.contentType === 'text') {
                (0, twilioHelper_1.twimlReply)(res, '⛔ This story already contains text. ' +
                    'You can\'t add a voice message to a text story.\n\n' +
                    'Send FINISH to publish your text story, or send "START STORY" to begin a new one.');
                return;
            }
            if (session.audioUrl) {
                (0, twilioHelper_1.twimlReply)(res, '⛔ A voice message is already attached to this story. ' +
                    'Only one audio clip is supported per story.\n\n' +
                    'Send FINISH to publish, or "START STORY" to begin a new one.');
                return;
            }
            const storedUrl = await (0, mediaProcessor_1.processAndUploadMedia)(url, contentType, phoneNumber, 'audio');
            await (0, sessionManager_1.updateSession)(phoneNumber, {
                audioUrl: storedUrl,
                contentType: 'audio',
            });
            replies.push('🎤 Voice message received!');
        }
        else if (isImage(contentType)) {
            const storedUrl = await (0, mediaProcessor_1.processAndUploadMedia)(url, contentType, phoneNumber, 'image');
            await (0, sessionManager_1.appendMediaUrl)(phoneNumber, storedUrl);
            replies.push('🖼 Image received!');
        }
        else if (isVideo(contentType)) {
            if (session.videoUrl) {
                replies.push('ℹ️ Only one video is supported per story — extra video skipped.');
                continue;
            }
            const storedUrl = await (0, mediaProcessor_1.processAndUploadMedia)(url, contentType, phoneNumber, 'video');
            await (0, sessionManager_1.updateSession)(phoneNumber, { videoUrl: storedUrl });
            replies.push('🎬 Video received!');
        }
        else {
            replies.push(`ℹ️ Unsupported file type (${contentType}) — skipped.`);
        }
    }
    // Handle a text caption sent alongside media (only if content type allows it).
    // We check the *original* session.contentType — if audio was set during
    // this request, audioUrl is null in session but we handled it above.
    if (msg.Body && session.contentType !== 'audio') {
        await (0, sessionManager_1.appendText)(phoneNumber, msg.Body);
        replies.push('📝 Caption added.');
    }
    const summary = replies.length > 0 ? replies.join('\n') : '✅ Media received!';
    (0, twilioHelper_1.twimlReply)(res, `${summary}\n\nKeep sending content or send FINISH when done.`);
}
