"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCleaner = exports.whatsappWebhook = void 0;
const app_1 = require("firebase-admin/app");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
// Initialise firebase-admin once at cold-start
(0, app_1.initializeApp)();
// ── Lazy imports (keeps cold-start fast) ─────────────────────────────────────
// Functions are loaded on first invocation, not at module evaluation time.
/**
 * HTTP trigger: receives all inbound WhatsApp messages from Twilio.
 *
 * Configure your Twilio WhatsApp Sandbox / number's "A MESSAGE COMES IN"
 * webhook to:
 *   POST https://<region>-<project>.cloudfunctions.net/whatsappWebhook
 */
exports.whatsappWebhook = (0, https_1.onRequest)({
    region: 'us-central1',
    // Twilio retries on 5xx — keep timeouts generous
    timeoutSeconds: 60,
    memory: '512MiB',
    // Allow unauthenticated invocations (Twilio calls this from the internet)
    invoker: 'public',
}, async (req, res) => {
    const { webhookApp } = await Promise.resolve().then(() => __importStar(require('./webhook/whatsappWebhook')));
    return webhookApp(req, res);
});
/**
 * Scheduled trigger: runs every 30 minutes to send reminders and delete
 * sessions that have been inactive for 24+ hours.
 */
exports.sessionCleaner = (0, scheduler_1.onSchedule)({
    schedule: 'every 30 minutes',
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '256MiB',
}, async () => {
    const { runSessionCleaner } = await Promise.resolve().then(() => __importStar(require('./scheduler/sessionCleaner')));
    await runSessionCleaner();
});
