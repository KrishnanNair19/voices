import type { Request, Response } from 'express'
import { twimlReply, validateTwilioSignature } from './twilioHelper'
import { getSession } from './sessionManager'
import type { TwilioInboundMessage } from '../types'

import { handleStartStory } from '../handlers/handleStartStory'
import { handleFinish } from '../handlers/handleFinish'
import { handleContent } from '../handlers/handleContent'
import { handleMedia } from '../handlers/handleMedia'
import { handleMetadata } from '../handlers/handleMetadata'

// ── Parse Twilio POST body ────────────────────────────────────────────────────

function parseInbound(body: Record<string, string>): TwilioInboundMessage {
  const numMedia = parseInt(body['NumMedia'] ?? '0', 10)
  const mediaUrls: string[] = []
  const mediaContentTypes: string[] = []
  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`]
    const ct = body[`MediaContentType${i}`]
    if (url) mediaUrls.push(url)
    if (ct) mediaContentTypes.push(ct)
  }
  return {
    From: body['From'] ?? '',
    To: body['To'] ?? '',
    Body: (body['Body'] ?? '').trim(),
    MessageSid: body['MessageSid'] ?? '',
    NumMedia: numMedia,
    mediaUrls,
    mediaContentTypes,
  }
}

/** Strips the "whatsapp:" prefix and returns a plain E.164 number. */
function normalizePhone(from: string): string {
  return from.replace(/^whatsapp:/i, '')
}

// ── Main router ───────────────────────────────────────────────────────────────

export async function routeMessage(req: Request, res: Response): Promise<void> {
  // 1. Validate Twilio signature
  const signature = (req.headers['x-twilio-signature'] as string) ?? ''
  const url = `${req.protocol}://${req.hostname}${req.originalUrl}`
  if (!validateTwilioSignature(signature, url, req.body as Record<string, string>)) {
    res.status(403).send('Forbidden')
    return
  }

  const msg = parseInbound(req.body as Record<string, string>)
  const phoneNumber = normalizePhone(msg.From)
  const command = msg.Body.toUpperCase().trim()

  try {
    // 2. Global command: START STORY — always wins, even mid-session
    if (command === 'START STORY') {
      await handleStartStory(phoneNumber, res)
      return
    }

    // 3. Load session
    const session = await getSession(phoneNumber)

    // 4. No active session — guide the user
    if (!session) {
      twimlReply(
        res,
        'Hi! Send "START STORY" to begin recording a story for Voices.',
      )
      return
    }

    // 5. FINISH command — only valid while collecting content
    if (command === 'FINISH') {
      await handleFinish(phoneNumber, session, res)
      return
    }

    // 6. Route by session state
    if (
      session.state === 'awaiting_title' ||
      session.state === 'awaiting_location' ||
      session.state === 'awaiting_tags' ||
      session.state === 'awaiting_visibility'
    ) {
      await handleMetadata(phoneNumber, session, msg, res)
      return
    }

    // 7. Collecting state — media takes priority over plain text
    if (msg.NumMedia > 0) {
      await handleMedia(phoneNumber, session, msg, res)
      return
    }

    // 8. Plain text content
    if (msg.Body) {
      await handleContent(phoneNumber, session, msg, res)
      return
    }

    // 9. Empty message (sticker, reaction, etc.)
    twimlReply(res, 'Got it! Keep sending content, or send FINISH when you\'re done.')
  } catch (err) {
    console.error('[routeMessage] Unhandled error:', err)
    twimlReply(
      res,
      'Something went wrong on our end. Please try again in a moment.',
    )
  }
}
