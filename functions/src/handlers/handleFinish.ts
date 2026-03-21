import type { Response } from 'express'
import { twimlReply } from '../webhook/twilioHelper'
import { advanceState } from '../webhook/sessionManager'
import type { WhatsAppSession } from '../types'

/**
 * Handles the "FINISH" command while in the 'collecting' state.
 *
 * Validates that some content exists, then kicks off the metadata
 * collection flow (title → location → tags → visibility).
 */
export async function handleFinish(
  phoneNumber: string,
  session: WhatsAppSession,
  res: Response,
): Promise<void> {
  // Guard: must be in the collecting state
  if (session.state !== 'collecting') {
    twimlReply(
      res,
      'You\'re already in the middle of adding details. ' +
        'Reply to the current question or send SKIP to continue.',
    )
    return
  }

  // Guard: must have some content
  const hasContent =
    session.textContent.trim().length > 0 ||
    session.audioUrl !== null ||
    session.mediaUrls.length > 0 ||
    session.videoUrl !== null

  if (!hasContent) {
    twimlReply(
      res,
      'Your story is empty — please send some content first (text, voice, or media), then FINISH.',
    )
    return
  }

  await advanceState(phoneNumber, 'awaiting_title')

  twimlReply(
    res,
    `Nice! Let's add a few details before publishing.\n\n` +
      `*What's the title of your story?*\n(or reply SKIP)`,
  )
}
