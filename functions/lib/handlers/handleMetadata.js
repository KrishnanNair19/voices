"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMetadata = handleMetadata;
const twilioHelper_1 = require("../webhook/twilioHelper");
const sessionManager_1 = require("../webhook/sessionManager");
const storyPublisher_1 = require("../story/storyPublisher");
const geocoder_1 = require("../utils/geocoder");
const config_1 = require("../config");
const SKIP = 'SKIP';
const YES = 'YES';
const NO = 'NO';
/**
 * Handles responses during the post-FINISH metadata collection flow.
 *
 * State machine:
 *   awaiting_title             → awaiting_location
 *   awaiting_location          → awaiting_location_confirm  (geocoded)
 *                              → awaiting_tags              (skip / no API key / no results)
 *   awaiting_location_confirm  → awaiting_tags              (YES confirms, NO skips)
 *                              → awaiting_location_confirm  (new query, re-geocode)
 *   awaiting_tags              → awaiting_visibility
 *   awaiting_visibility        → publish → send link
 */
async function handleMetadata(phoneNumber, session, msg, res) {
    const body = msg.Body.trim();
    const upper = body.toUpperCase();
    const isSkip = upper === SKIP;
    switch (session.state) {
        // ── Title ──────────────────────────────────────────────────────────────
        case 'awaiting_title': {
            await (0, sessionManager_1.updateSession)(phoneNumber, {
                draftTitle: isSkip ? null : body,
                state: 'awaiting_location',
            });
            (0, twilioHelper_1.twimlReply)(res, `📍 *Where did this story take place?*\n` +
                `Enter a location (e.g. "Hanoi, Vietnam") or SKIP.`);
            break;
        }
        // ── Location — geocode and show candidate for confirmation ─────────────
        case 'awaiting_location': {
            if (isSkip) {
                await (0, sessionManager_1.updateSession)(phoneNumber, {
                    draftLocation: null,
                    draftLocationLat: 0,
                    draftLocationLng: 0,
                    state: 'awaiting_tags',
                });
                (0, twilioHelper_1.twimlReply)(res, tagsPrompt());
                break;
            }
            const result = await (0, geocoder_1.geocodeAddress)(body);
            if (!result) {
                // No API key or no results — store the raw text and move on
                await (0, sessionManager_1.updateSession)(phoneNumber, {
                    draftLocation: body,
                    draftLocationLat: 0,
                    draftLocationLng: 0,
                    state: 'awaiting_tags',
                });
                (0, twilioHelper_1.twimlReply)(res, tagsPrompt());
                break;
            }
            // Store candidate and ask user to confirm
            await (0, sessionManager_1.updateSession)(phoneNumber, {
                pendingLocationName: result.formattedAddress,
                pendingLocationLat: result.lat,
                pendingLocationLng: result.lng,
                state: 'awaiting_location_confirm',
            });
            (0, twilioHelper_1.twimlReply)(res, `📍 Did you mean:\n*${result.formattedAddress}*\n\n` +
                `Reply *YES* to confirm, *NO* to skip location, or send a different location.`);
            break;
        }
        // ── Location confirmation ──────────────────────────────────────────────
        case 'awaiting_location_confirm': {
            if (upper === YES) {
                // Confirm the pending candidate
                await (0, sessionManager_1.updateSession)(phoneNumber, {
                    draftLocation: session.pendingLocationName,
                    draftLocationLat: session.pendingLocationLat ?? 0,
                    draftLocationLng: session.pendingLocationLng ?? 0,
                    pendingLocationName: null,
                    pendingLocationLat: null,
                    pendingLocationLng: null,
                    state: 'awaiting_tags',
                });
                (0, twilioHelper_1.twimlReply)(res, `✅ Location set to *${session.pendingLocationName}*.\n\n` + tagsPrompt());
                break;
            }
            if (upper === NO || isSkip) {
                // Skip location entirely
                await (0, sessionManager_1.updateSession)(phoneNumber, {
                    draftLocation: null,
                    draftLocationLat: 0,
                    draftLocationLng: 0,
                    pendingLocationName: null,
                    pendingLocationLat: null,
                    pendingLocationLng: null,
                    state: 'awaiting_tags',
                });
                (0, twilioHelper_1.twimlReply)(res, tagsPrompt());
                break;
            }
            // User sent a different location query — re-geocode
            const result = await (0, geocoder_1.geocodeAddress)(body);
            if (!result) {
                (0, twilioHelper_1.twimlReply)(res, `Couldn't find that location. Try a different search, reply *YES* to keep the previous suggestion, or *NO* to skip.`);
                break;
            }
            await (0, sessionManager_1.updateSession)(phoneNumber, {
                pendingLocationName: result.formattedAddress,
                pendingLocationLat: result.lat,
                pendingLocationLng: result.lng,
            });
            (0, twilioHelper_1.twimlReply)(res, `📍 Did you mean:\n*${result.formattedAddress}*\n\n` +
                `Reply *YES* to confirm, *NO* to skip, or send a different location.`);
            break;
        }
        // ── Tags ───────────────────────────────────────────────────────────────
        case 'awaiting_tags': {
            const tags = isSkip
                ? []
                : body
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean);
            await (0, sessionManager_1.updateSession)(phoneNumber, {
                draftTags: tags,
                state: 'awaiting_visibility',
            });
            (0, twilioHelper_1.twimlReply)(res, `🌐 *Should this story be public?*\n` +
                `Reply *yes* to share with everyone, or *no* to keep it private.\n` +
                `(Default: yes)`);
            break;
        }
        // ── Visibility → publish ───────────────────────────────────────────────
        case 'awaiting_visibility': {
            const lc = body.toLowerCase();
            const isPublic = lc !== 'no' && lc !== 'n' && lc !== 'private';
            // session already has all the updated fields from prior steps (loaded
            // fresh by messageRouter at the start of this request)
            const freshSession = { ...session, isPublic };
            try {
                const storyId = await (0, storyPublisher_1.publishStory)(freshSession);
                await (0, sessionManager_1.deleteSession)(phoneNumber);
                const storyUrl = `${config_1.config.app.webUrl}/story/${storyId}`;
                (0, twilioHelper_1.twimlReply)(res, `🎉 Your story is live!\n\n` +
                    `${storyUrl}\n\n` +
                    `Visibility: ${isPublic ? 'public' : 'private'}\n\n` +
                    `Send *START STORY* any time to create another.`);
            }
            catch (err) {
                console.error('[handleMetadata] publishStory failed:', err);
                (0, twilioHelper_1.twimlReply)(res, `❌ Something went wrong while publishing. Please try again by replying to the visibility question.`);
            }
            break;
        }
        default: {
            (0, twilioHelper_1.twimlReply)(res, `Unexpected state. Send *START STORY* to begin a new story.`);
        }
    }
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function tagsPrompt() {
    return (`🏷 *Add some tags* to help others find your story.\n` +
        `Enter comma-separated tags (e.g. "travel, food, vietnam") or SKIP.`);
}
