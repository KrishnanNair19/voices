import { initializeApp } from 'firebase-admin/app'
import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

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
    // Twilio retries on 5xx — keep timeouts generous
    timeoutSeconds: 60,
    memory: '512MiB',
    // Allow unauthenticated invocations (Twilio calls this from the internet)
    invoker: 'public',
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
  },
  async () => {
    const { runSessionCleaner } = await import('./scheduler/sessionCleaner')
    await runSessionCleaner()
  },
)
