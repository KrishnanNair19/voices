/**
 * Runtime configuration.
 *
 * Firebase Functions v2 loads .env files from the functions/ directory.
 * Sensitive values (SID, token) should be set via Firebase Secret Manager
 * in production — see deploy instructions in README.
 */

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required environment variable: ${key}`)
  return val
}

export const config = {
  twilio: {
    accountSid: required('TWILIO_ACCOUNT_SID'),
    authToken: required('TWILIO_AUTH_TOKEN'),
    /** Full Twilio-format WhatsApp number, e.g. "whatsapp:+14155238886" */
    whatsappNumber: required('TWILIO_WHATSAPP_NUMBER'),
  },
  firebase: {
    storageBucket: required('FIREBASE_STORAGE_BUCKET'),
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
  },
} as const
