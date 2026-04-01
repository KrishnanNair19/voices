"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMessage = routeMessage;
const twilioHelper_1 = require("./twilioHelper");
const sessionManager_1 = require("./sessionManager");
const handleStartStory_1 = require("../handlers/handleStartStory");
const handleFinish_1 = require("../handlers/handleFinish");
const handleContent_1 = require("../handlers/handleContent");
const handleMedia_1 = require("../handlers/handleMedia");
const handleMetadata_1 = require("../handlers/handleMetadata");
const handleAuth_1 = require("../handlers/handleAuth");
const handleSignOut_1 = require("../handlers/handleSignOut");
// ── Parse Twilio POST body ────────────────────────────────────────────────────
function parseInbound(body) {
    const numMedia = parseInt(body['NumMedia'] ?? '0', 10);
    const mediaUrls = [];
    const mediaContentTypes = [];
    for (let i = 0; i < numMedia; i++) {
        const url = body[`MediaUrl${i}`];
        const ct = body[`MediaContentType${i}`];
        if (url)
            mediaUrls.push(url);
        if (ct)
            mediaContentTypes.push(ct);
    }
    return {
        From: body['From'] ?? '',
        To: body['To'] ?? '',
        Body: (body['Body'] ?? '').trim(),
        MessageSid: body['MessageSid'] ?? '',
        NumMedia: numMedia,
        mediaUrls,
        mediaContentTypes,
    };
}
/** Strips the "whatsapp:" prefix and returns a plain E.164 number. */
function normalizePhone(from) {
    return from.replace(/^whatsapp:/i, '');
}
const INSTRUCTIONS = `👋 Welcome to *Voices* — share stories from wherever you are.\n\n` +
    `Here's how it works:\n\n` +
    `1️⃣ *START STORY* — begins a new story session\n` +
    `2️⃣ Send your content — text messages, a voice note, or photos/video\n` +
    `   _(text and audio can't be mixed in the same story)_\n` +
    `3️⃣ *FINISH* — when you're done adding content\n` +
    `4️⃣ Follow the prompts to add a title, location, and tags\n` +
    `   _(reply *SKIP* to any prompt you'd like to omit)_\n` +
    `5️⃣ Choose public or private — your story is published instantly\n\n` +
    `You'll receive a link to your story when it goes live. 🎙\n\n` +
    `To sign out: send *SIGN OUT*\n\n` +
    `Ready? Send *START STORY* to begin.`;
// ── Main router ───────────────────────────────────────────────────────────────
async function routeMessage(req, res) {
    // 1. Validate Twilio signature
    // DEV_SKIP_TWILIO_SIGNATURE=true bypasses this in local emulator testing
    // because ngrok's public URL ≠ req.hostname (127.0.0.1), causing HMAC mismatches.
    const skipValidation = process.env['DEV_SKIP_TWILIO_SIGNATURE'] === 'true';
    if (!skipValidation) {
        const signature = req.headers['x-twilio-signature'] ?? '';
        const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
        if (!(0, twilioHelper_1.validateTwilioSignature)(signature, url, req.body)) {
            res.status(403).send('Forbidden');
            return;
        }
    }
    const msg = parseInbound(req.body);
    const phoneNumber = normalizePhone(msg.From);
    const command = msg.Body.toUpperCase().trim();
    try {
        // 2. Load session and resolve userId in parallel
        const [session, userId] = await Promise.all([
            (0, sessionManager_1.getSession)(phoneNumber),
            (0, sessionManager_1.findUserByPhone)(phoneNumber),
        ]);
        // 3. SIGN OUT — global command, works at any state
        if (command === 'SIGN OUT') {
            await (0, handleSignOut_1.handleSignOut)(phoneNumber, session !== null, res);
            return;
        }
        // 4. START STORY — global command; passes session for cleanup / auth-gate check
        if (command === 'START STORY') {
            await (0, handleStartStory_1.handleStartStory)(phoneNumber, session, userId, res);
            return;
        }
        // 5. No session
        if (!session) {
            if (!userId) {
                // Unknown number — start auth flow
                await (0, sessionManager_1.createAuthSession)(phoneNumber);
                (0, twilioHelper_1.twimlReply)(res, `👋 Welcome to Voices!\n\n` +
                    `To get started, please send your Voices account email address to sign in.\n\n` +
                    `Don't have an account? Sign up at ${process.env['VOICES_WEB_URL'] ?? 'voices.app'}.`);
            }
            else {
                // Known number, no active session — show instructions
                (0, twilioHelper_1.twimlReply)(res, INSTRUCTIONS);
            }
            return;
        }
        // 6. Auth states — must complete sign-in before anything else
        if (session.state === 'awaiting_auth_email' || session.state === 'awaiting_auth_otp') {
            await (0, handleAuth_1.handleAuth)(phoneNumber, session, msg, res);
            return;
        }
        // 7. FINISH — only valid while collecting content
        if (command === 'FINISH') {
            await (0, handleFinish_1.handleFinish)(phoneNumber, session, res);
            return;
        }
        // 8. Metadata states (title / location / location_confirm / tags / visibility)
        if (session.state === 'awaiting_title' ||
            session.state === 'awaiting_location' ||
            session.state === 'awaiting_location_confirm' ||
            session.state === 'awaiting_tags' ||
            session.state === 'awaiting_visibility') {
            await (0, handleMetadata_1.handleMetadata)(phoneNumber, session, msg, res);
            return;
        }
        // 9. Collecting state — media takes priority over plain text
        if (msg.NumMedia > 0) {
            await (0, handleMedia_1.handleMedia)(phoneNumber, session, msg, res);
            return;
        }
        // 10. Plain text content
        if (msg.Body) {
            await (0, handleContent_1.handleContent)(phoneNumber, session, msg, res);
            return;
        }
        // 11. Empty message (sticker, reaction, etc.)
        (0, twilioHelper_1.twimlReply)(res, `Got it! Keep sending content, or send FINISH when you're done.`);
    }
    catch (err) {
        console.error('[routeMessage] Unhandled error:', err);
        (0, twilioHelper_1.twimlReply)(res, `Something went wrong on our end. Please try again in a moment.`);
    }
}
