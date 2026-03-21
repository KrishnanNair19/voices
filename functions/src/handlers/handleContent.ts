import type { Response } from 'express'
import { twimlReply } from '../webhook/twilioHelper'
import { appendText } from '../webhook/sessionManager'
import type { WhatsAppSession, TwilioInboundMessage } from '../types'

/**
 * Handles a plain-text message while in the 'collecting' state.
 *
 * Enforces the logic gate: if audio has already been received, text is rejected.
 */
export async function handleContent(
  phoneNumber: string,
  session: WhatsAppSession,
  msg: TwilioInboundMessage,
  res: Response,
): Promise<void> {
  // Logic gate: text + audio cannot coexist
  if (session.contentType === 'audio') {
    twimlReply(
      res,
      '⛔ This story already contains a voice message. ' +
        'You can\'t add text to an audio story.\n\n' +
        'Send FINISH to publish, or send "START STORY" to begin a new one.',
    )
    return
  }

  await appendText(phoneNumber, msg.Body)

  const isFirstChunk = !session.textContent.trim()
  twimlReply(
    res,
    isFirstChunk
      ? '✅ Got it! Keep writing — send more messages to continue your story, or FINISH when done.'
      : '✅ Added! Keep going or send FINISH when you\'re done.',
  )
}
