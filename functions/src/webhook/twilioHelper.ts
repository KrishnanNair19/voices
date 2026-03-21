import twilio from 'twilio'
import type { Response } from 'express'
import { config } from '../config'

// ── TwiML response (synchronous reply to an inbound message) ─────────────────

/**
 * Writes a TwiML <Message> response to the HTTP response object.
 * Twilio expects Content-Type: text/xml with a <Response><Message> body.
 */
export function twimlReply(res: Response, message: string): void {
  const twiml = new twilio.twiml.MessagingResponse()
  twiml.message(message)
  res.set('Content-Type', 'text/xml')
  res.send(twiml.toString())
}

// ── Outbound message (for proactive sends from the scheduler) ────────────────

let _client: twilio.Twilio | null = null

function getClient(): twilio.Twilio {
  if (!_client) {
    _client = twilio(config.twilio.accountSid, config.twilio.authToken)
  }
  return _client
}

/**
 * Sends a proactive WhatsApp message from the scheduler (not a TwiML reply).
 * @param to  E.164 phone number WITHOUT "whatsapp:" prefix, e.g. "+15551234567"
 */
export async function sendOutboundMessage(to: string, body: string): Promise<void> {
  await getClient().messages.create({
    from: config.twilio.whatsappNumber,
    to: `whatsapp:${to}`,
    body,
  })
}

// ── Signature validation ─────────────────────────────────────────────────────

/**
 * Returns true if the X-Twilio-Signature header is valid for this request.
 * Should be called before processing any inbound message.
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  return twilio.validateRequest(config.twilio.authToken, signature, url, params)
}
