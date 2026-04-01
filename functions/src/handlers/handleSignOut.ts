import type { Response } from 'express'
import { twimlReply } from '../webhook/twilioHelper'
import {
  findUserByPhone,
  unlinkPhoneFromUser,
  deleteSession,
} from '../webhook/sessionManager'

/**
 * Handles the "SIGN OUT" command.
 *
 * - Removes the whatsappPhone field from the user's Voices profile.
 * - Deletes any active session (discarding an in-progress story if one exists).
 * - After sign-out the phone is unknown again; the next message will restart
 *   the auth flow.
 */
export async function handleSignOut(
  phoneNumber: string,
  hasActiveSession: boolean,
  res: Response,
): Promise<void> {
  const userId = await findUserByPhone(phoneNumber)

  if (!userId) {
    twimlReply(
      res,
      `You're not currently signed in to any Voices account.\n\n` +
        `Send any message to begin sign-in.`,
    )
    return
  }

  await unlinkPhoneFromUser(userId)
  await deleteSession(phoneNumber)

  const storyNote = hasActiveSession
    ? '\n\n⚠️ Your in-progress story has been discarded.'
    : ''

  twimlReply(
    res,
    `✅ Signed out successfully.${storyNote}\n\n` +
      `Send any message to sign in with a different account.`,
  )
}
