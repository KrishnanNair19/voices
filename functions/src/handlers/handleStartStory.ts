import type { Response } from 'express'
import { twimlReply } from '../webhook/twilioHelper'
import {
  getSession,
  createSession,
  deleteSession,
  findUserByPhone,
} from '../webhook/sessionManager'

/**
 * Handles the "START STORY" command.
 *
 * - If a session already exists, it is silently discarded so the user can
 *   start fresh without having to explicitly cancel.
 * - Looks up the Voices user ID linked to this phone number (if any).
 */
export async function handleStartStory(
  phoneNumber: string,
  res: Response,
): Promise<void> {
  // Discard any in-progress session
  const existing = await getSession(phoneNumber)
  if (existing) {
    await deleteSession(phoneNumber)
  }

  // Attempt to link to a Voices account
  const userId = await findUserByPhone(phoneNumber)

  await createSession(phoneNumber, userId)

  const accountNotice = userId
    ? ''
    : '\n\n_Tip: add your phone number to your Voices profile to link stories to your account._'

  twimlReply(
    res,
    `🎙 Story started! Send your content — text or a voice message.\n\n` +
      `You can also attach photos or video at any time.\n\n` +
      `⚠️ You can use text OR audio, but not both in the same story.\n\n` +
      `Send FINISH when you're ready to publish.` +
      accountNotice,
  )
}
