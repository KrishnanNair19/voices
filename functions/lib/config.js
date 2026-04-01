"use strict";
/**
 * Runtime configuration.
 *
 * Firebase Functions v2 loads .env files from the functions/ directory.
 * Sensitive values (SID, token) should be set via Firebase Secret Manager
 * in production — see TEXT_SERVICE.md for deploy instructions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
function required(key) {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required environment variable: ${key}`);
    return val;
}
function optional(key) {
    return process.env[key] ?? null;
}
exports.config = {
    twilio: {
        accountSid: required('TWILIO_ACCOUNT_SID'),
        authToken: required('TWILIO_AUTH_TOKEN'),
        /** Full Twilio-format WhatsApp number, e.g. "whatsapp:+14155238886" */
        whatsappNumber: required('TWILIO_WHATSAPP_NUMBER'),
    },
    firebase: {
        storageBucket: required('STORAGE_BUCKET'),
    },
    google: {
        /**
         * Google Maps Geocoding API key.
         * Optional — if absent, location is stored as free text without coordinates.
         * Get a key at: https://console.cloud.google.com → APIs → Geocoding API
         */
        mapsApiKey: optional('GOOGLE_MAPS_API_KEY'),
    },
    app: {
        webUrl: process.env['VOICES_WEB_URL'] ?? 'https://voices.app',
    },
    limits: {
        /** Images above this size (bytes) are compressed before upload. */
        maxImageBytes: 5 * 1024 * 1024, // 5 MB
        /** Minutes of inactivity before a reminder is sent. */
        reminderAfterMinutes: 60,
        /** Minutes of inactivity before a session is deleted. */
        deleteAfterMinutes: 60 * 24, // 24 hours
        /** Maximum failed OTP attempts before the session is reset. */
        maxOtpAttempts: 3,
        /** OTP validity window in minutes. */
        otpExpiryMinutes: 10,
    },
};
