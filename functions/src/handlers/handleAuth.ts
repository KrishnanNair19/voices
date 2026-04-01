import type { Response } from 'express'
import { Timestamp } from 'firebase-admin/firestore'
import { twimlReply } from '../webhook/twilioHelper'
import {
  updateSession,
  deleteSession,
  findUserByEmail,
  linkPhoneToUser,
} from '../webhook/sessionManager'
import type { WhatsAppSession, TwilioInboundMessage } from '../types'
import { config } from '../config'

// ── OTP helpers ───────────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString()
}

// ── Auth email step ───────────────────────────────────────────────────────────

/**
 * Called when session.state === 'awaiting_auth_email'.
 *
 * Looks up the user by the email they sent. If found:
 *   - Generates a 6-digit OTP and stores it in the session
 *   - Sends the OTP back via the same WhatsApp message (proves phone ownership)
 *   - Advances state to 'awaiting_auth_otp'
 *
 * If no Voices account exists for that email, guides them to sign up.
 *
 * Security note: the OTP is delivered to the same WhatsApp number initiating
 * the request, which proves the user controls the phone. Future enhancement:
 * send the OTP to the email address for stronger account-ownership proof.
 */
async function handleAuthEmail(
  phoneNumber: string,
  msg: TwilioInboundMessage,
  res: Response,
): Promise<void> {
  const email = msg.Body.trim().toLowerCase()

  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    twimlReply(
      res,
      `That doesn't look like a valid email address. Please try again.\n\n` +
        `Send your Voices account email to sign in.`,
    )
    return
  }

  const user = await findUserByEmail(email)
  if (!user) {
    twimlReply(
      res,
      `No Voices account found for *${email}*.\n\n` +
        `Sign up first at ${config.app.webUrl}, then come back here to link your WhatsApp.`,
    )
    return
  }

  // Generate OTP and store in session
  const otp = generateOtp()
  const expiresAt = Timestamp.fromMillis(
    Date.now() + config.limits.otpExpiryMinutes * 60 * 1000,
  )

  await updateSession(phoneNumber, {
    pendingAuthEmail: email,
    authOtpCode: otp,
    authOtpExpiresAt: expiresAt,
    authOtpAttempts: 0,
    state: 'awaiting_auth_otp',
  })

  twimlReply(
    res,
    `✅ Found your account, ${user.displayName}!\n\n` +
      `Your sign-in code is:\n\n` +
      `*${otp}*\n\n` +
      `Reply with this code to complete sign-in. (Valid for ${config.limits.otpExpiryMinutes} minutes.)`,
  )
}

// ── Auth OTP step ─────────────────────────────────────────────────────────────

/**
 * Called when session.state === 'awaiting_auth_otp'.
 *
 * Verifies the OTP. On success:
 *   - Links the phone number to the user's Voices profile
 *   - Clears the session (auth complete — user can now START STORY)
 *
 * On failure: increments attempt counter. After max attempts, resets the
 * auth flow so the user can start over with a different email.
 */
async function handleAuthOtp(
  phoneNumber: string,
  session: WhatsAppSession,
  msg: TwilioInboundMessage,
  res: Response,
): Promise<void> {
  const entered = msg.Body.trim()

  // Check expiry
  if (
    session.authOtpExpiresAt &&
    session.authOtpExpiresAt.toMillis() < Date.now()
  ) {
    await updateSession(phoneNumber, {
      state: 'awaiting_auth_email',
      pendingAuthEmail: null,
      authOtpCode: null,
      authOtpExpiresAt: null,
      authOtpAttempts: 0,
    })
    twimlReply(
      res,
      `⏱ That code has expired. Please send your email address again to get a new one.`,
    )
    return
  }

  // Check code
  if (entered !== session.authOtpCode) {
    const attempts = (session.authOtpAttempts ?? 0) + 1
    const remaining = config.limits.maxOtpAttempts - attempts

    if (remaining <= 0) {
      // Reset to email step
      await updateSession(phoneNumber, {
        state: 'awaiting_auth_email',
        pendingAuthEmail: null,
        authOtpCode: null,
        authOtpExpiresAt: null,
        authOtpAttempts: 0,
      })
      twimlReply(
        res,
        `❌ Too many incorrect attempts. Please send your email address again to restart sign-in.`,
      )
    } else {
      await updateSession(phoneNumber, { authOtpAttempts: attempts })
      twimlReply(
        res,
        `❌ Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.\n\nTry again:`,
      )
    }
    return
  }

  // ✅ Code matches — look up the user and link the phone
  const user = await findUserByEmail(session.pendingAuthEmail ?? '')
  if (!user) {
    // Shouldn't happen, but handle gracefully
    await deleteSession(phoneNumber)
    twimlReply(res, `Something went wrong. Please start over by sending your email.`)
    return
  }

  await linkPhoneToUser(user.uid, phoneNumber)
  await deleteSession(phoneNumber)

  twimlReply(
    res,
    `🎉 Signed in as *${user.displayName}*!\n\n` +
      `Your WhatsApp is now linked to your Voices account.\n\n` +
      `Send *START STORY* to create your first story.`,
  )
}

// ── Public dispatcher ────────────────────────────────────────────────────────

export async function handleAuth(
  phoneNumber: string,
  session: WhatsAppSession,
  msg: TwilioInboundMessage,
  res: Response,
): Promise<void> {
  if (session.state === 'awaiting_auth_email') {
    await handleAuthEmail(phoneNumber, msg, res)
  } else {
    await handleAuthOtp(phoneNumber, session, msg, res)
  }
}
