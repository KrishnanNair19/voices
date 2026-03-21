import express from 'express'
import { routeMessage } from './messageRouter'

/**
 * Express app mounted as a Firebase Cloud Function.
 *
 * Twilio must be configured to POST inbound WhatsApp messages to:
 *   https://<region>-<project>.cloudfunctions.net/whatsappWebhook
 */
export const webhookApp = express()

// Twilio sends application/x-www-form-urlencoded
webhookApp.use(express.urlencoded({ extended: false }))

webhookApp.post('/', async (req, res) => {
  await routeMessage(req, res)
})

// Health check — useful during setup
webhookApp.get('/', (_req, res) => {
  res.status(200).send('Voices WhatsApp webhook is running.')
})
