import type { Request, Response } from 'express'
import { twimlReply, validateTwilioSignature } from './twilioHelper'
import {
  getSession,
  findUserByPhone,
  createAuthSession,
} from './sessionManager'
import type { TwilioInboundMessage } from '../types'

import { handleStartStory } from '../handlers/handleStartStory'
import { handleFinish } from '../handlers/handleFinish'
import { handleContent } from '../handlers/handleContent'
import { handleMedia } from '../handlers/handleMedia'
import { handleMetadata } from '../handlers/handleMetadata'
import { handleAuth } from '../handlers/handleAuth'
import { handleSignOut } from '../handlers/handleSignOut'

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

const INSTRUCTIONS =
  `👋 Welcome to *Voices* — share stories from wherever you are.\n\n` +
  `Here's how it works:\n\n` +
  `1️⃣ *START STORY* — begins a new story session\n` +
  `2️⃣ Send your content — text messages, a voice note, or photos/video\n` +
  `   _(text and audio can't be mixed in the same story)_\n` +
  `3️⃣ *FINISH* — when you're done adding content\n` +
  `4️⃣ Follow the prompts to add a title, location, and tags\n` +
  `   _(reply *SKIP* to any prompt you'd like to omit)_\n` +
  `5️⃣ Choose public or private — your story is published instantly\n\n` +
  `You'll receive a link to your story when it goes live. 🎙\n\n` +
  `To sign out: send *SIGN OUT*\n\n` +
  `Ready? Send *START STORY* to begin.`

// ── Main router ───────────────────────────────────────────────────────────────

export async function routeMessage(req: Request, res: Response): Promise<void> {
  // 1. Validate Twilio signature
  // DEV_SKIP_TWILIO_SIGNATURE=true bypasses this in local emulator testing
  // because ngrok's public URL ≠ req.hostname (127.0.0.1), causing HMAC mismatches.
  const skipValidation = process.env['DEV_SKIP_TWILIO_SIGNATURE'] === 'true'
  if (!skipValidation) {
    const signature = (req.headers['x-twilio-signature'] as string) ?? ''
    const url = `${req.protocol}://${req.hostname}${req.originalUrl}`
    if (!validateTwilioSignature(signature, url, req.body as Record<string, string>)) {
      res.status(403).send('Forbidden')
      return
    }
  }

  const msg = parseInbound(req.body as Record<string, string>)
  const phoneNumber = normalizePhone(msg.From)
  const command = msg.Body.toUpperCase().trim()

  try {
    // 2. Load session and resolve userId in parallel
    const [session, userId] = await Promise.all([
      getSession(phoneNumber),
      findUserByPhone(phoneNumber),
    ])

    // 3. SIGN OUT — global command, works at any state
    if (command === 'SIGN OUT') {
      await handleSignOut(phoneNumber, session !== null, res)
      return
    }

    // 4. START STORY — global command; passes session for cleanup / auth-gate check
    if (command === 'START STORY') {
      await handleStartStory(phoneNumber, session, userId, res)
      return
    }

    // 5. No session
    if (!session) {
      if (!userId) {
        // Unknown number — start auth flow
        await createAuthSession(phoneNumber)
        twimlReply(
          res,
          `👋 Welcome to Voices!\n\n` +
            `To get started, please send your Voices account email address to sign in.\n\n` +
            `Don't have an account? Sign up at ${process.env['VOICES_WEB_URL'] ?? 'voices.app'}.`,
        )
      } else {
        // Known number, no active session — show instructions
        twimlReply(res, INSTRUCTIONS)
      }
      return
    }

    // 6. Auth states — must complete sign-in before anything else
    if (session.state === 'awaiting_auth_email' || session.state === 'awaiting_auth_otp') {
      await handleAuth(phoneNumber, session, msg, res)
      return
    }

    // 7. FINISH — only valid while collecting content
    if (command === 'FINISH') {
      await handleFinish(phoneNumber, session, res)
      return
    }

    // 8. Metadata states (title / location / location_confirm / tags / visibility)
    if (
      session.state === 'awaiting_title' ||
      session.state === 'awaiting_location' ||
      session.state === 'awaiting_location_confirm' ||
      session.state === 'awaiting_tags' ||
      session.state === 'awaiting_visibility'
    ) {
      await handleMetadata(phoneNumber, session, msg, res)
      return
    }

    // 9. Collecting state — media takes priority over plain text
    if (msg.NumMedia > 0) {
      await handleMedia(phoneNumber, session, msg, res)
      return
    }

    // 10. Plain text content
    if (msg.Body) {
      await handleContent(phoneNumber, session, msg, res)
      return
    }

    // 11. Empty message (sticker, reaction, etc.)
    twimlReply(res, `Got it! Keep sending content, or send FINISH when you're done.`)
  } catch (err) {
    console.error('[routeMessage] Unhandled error:', err)
    twimlReply(res, `Something went wrong on our end. Please try again in a moment.`)
  }
}
