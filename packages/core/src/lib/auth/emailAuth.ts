/**
 * Email/password authentication helpers.
 *
 * All functions accept an Auth instance so this module works in both
 * apps/mobile (initializeAuth with AsyncStorage) and apps/web (default).
 * Callers pass getFirebaseAuth() from packages/core/src/lib/firebase.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  type Auth,
  type UserCredential,
} from 'firebase/auth'

/**
 * Create a new email/password account and immediately send a verification email.
 * The verification email is fire-and-forget — a send failure does not reject the promise.
 */
export async function signUpWithEmail(
  auth: Auth,
  email: string,
  password: string,
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // Non-blocking — don't await; a verification failure shouldn't break sign-up
  sendEmailVerification(cred.user).catch(() => {
    // Will be retried via the "Resend email" button in EmailVerificationPendingScreen
  })
  return cred
}

/** Sign in with email and password. */
export function signInWithEmail(
  auth: Auth,
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Send a password reset email.
 * Resolves on success; rejects with Firebase AuthError on failure.
 */
export function requestPasswordReset(auth: Auth, email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}

/**
 * Re-send the verification email to the current user.
 * Used by the "Resend email" button in EmailVerificationPendingScreen.
 */
export function resendVerificationEmail(auth: Auth): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    return Promise.reject(new Error('No signed-in user found.'))
  }
  return sendEmailVerification(user)
}

// ── Firebase error code → user-facing message map ─────────────────────────────

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'An account with this email already exists. Try logging in.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 8 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Forgot your password?',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
  'auth/network-request-failed':
    'No internet connection. Check your network and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
}

/**
 * Maps a Firebase Auth error code to a user-facing string.
 * Falls back to a generic message for unknown codes.
 */
export function getAuthErrorMessage(code: string): string {
  return (
    AUTH_ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.'
  )
}
