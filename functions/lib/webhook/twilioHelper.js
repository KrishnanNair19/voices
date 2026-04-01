"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twimlReply = twimlReply;
exports.sendOutboundMessage = sendOutboundMessage;
exports.validateTwilioSignature = validateTwilioSignature;
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../config");
// ── TwiML response (synchronous reply to an inbound message) ─────────────────
/**
 * Writes a TwiML <Message> response to the HTTP response object.
 * Twilio expects Content-Type: text/xml with a <Response><Message> body.
 */
function twimlReply(res, message) {
    const twiml = new twilio_1.default.twiml.MessagingResponse();
    twiml.message(message);
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
}
// ── Outbound message (for proactive sends from the scheduler) ────────────────
let _client = null;
function getClient() {
    if (!_client) {
        _client = (0, twilio_1.default)(config_1.config.twilio.accountSid, config_1.config.twilio.authToken);
    }
    return _client;
}
/**
 * Sends a proactive WhatsApp message from the scheduler (not a TwiML reply).
 * @param to  E.164 phone number WITHOUT "whatsapp:" prefix, e.g. "+15551234567"
 */
async function sendOutboundMessage(to, body) {
    await getClient().messages.create({
        from: config_1.config.twilio.whatsappNumber,
        to: `whatsapp:${to}`,
        body,
    });
}
// ── Signature validation ─────────────────────────────────────────────────────
/**
 * Returns true if the X-Twilio-Signature header is valid for this request.
 * Should be called before processing any inbound message.
 */
function validateTwilioSignature(signature, url, params) {
    return twilio_1.default.validateRequest(config_1.config.twilio.authToken, signature, url, params);
}
