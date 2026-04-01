import { initializeApp } from 'firebase-admin/app'
import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

// Declare secrets so Firebase mounts them as env vars at runtime.
// Values are stored in GCP Secret Manager — never in source code.
// Set them once with: firebase functions:secrets:set <NAME>
const SECRETS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'GOOGLE_MAPS_API_KEY']

// Initialise firebase-admin once at cold-start
initializeApp()

// ── Lazy imports (keeps cold-start fast) ─────────────────────────────────────
// Functions are loaded on first invocation, not at module evaluation time.

/**
 * HTTP trigger: receives all inbound WhatsApp messages from Twilio.
 *
 * Configure your Twilio WhatsApp Sandbox / number's "A MESSAGE COMES IN"
 * webhook to:
 *   POST https://<region>-<project>.cloudfunctions.net/whatsappWebhook
 */
export const whatsappWebhook = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    memory: '512MiB',
    invoker: 'public',
    secrets: SECRETS,
  },
  async (req, res) => {
    const { webhookApp } = await import('./webhook/whatsappWebhook')
    return webhookApp(req, res)
  },
)

/**
 * Scheduled trigger: runs every 30 minutes to send reminders and delete
 * sessions that have been inactive for 24+ hours.
 */
export const sessionCleaner = onSchedule(
  {
    schedule: 'every 30 minutes',
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '256MiB',
    secrets: SECRETS,
  },
  async () => {
    const { runSessionCleaner } = await import('./scheduler/sessionCleaner')
    await runSessionCleaner()
  },
)
