/**
 * Controller for all Auth stack screens.
 *
 * Centralises loading state, error messages, and Firebase calls so each
 * screen stays as a thin presentation layer.
 */

import { useState, useRef, useEffect } from 'react'
import {
  signUpWithEmail,
  signInWithEmail,
  requestPasswordReset,
  resendVerificationEmail,
  getAuthErrorMessage,
  getFirebaseAuth,
  useAuthStore,
} from '@voices/core'
import {
  signInWithGoogle,
  getGoogleSignInErrorMessage,
  GoogleSignInCancelledError,
} from '@/lib/auth/googleSignIn'

function getFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code
  }
  return 'unknown'
}

export function useAuthController() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  // ── Google Sign-In ──────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // initAuthListener picks up the auth state change and routes automatically
    } catch (e) {
      if (e instanceof GoogleSignInCancelledError) {
        // User dismissed the picker — not an error
      } else {
        const msg = getGoogleSignInErrorMessage(e)
        if (msg) setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Email Sign-Up ───────────────────────────────────────────────────────────

  /**
   * Creates a new email/password account and returns the verified email so
   * the caller can navigate to EmailVerificationPendingScreen.
   * Returns null if the operation fails (error state is set instead).
   */
  const handleEmailSignUp = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await signUpWithEmail(auth, email, password)
      // initAuthListener fires but sees emailVerified == false → keeps status
      // as 'unauthenticated' so the Auth stack stays mounted. The caller then
      // navigates within the Auth stack to EmailVerificationPendingScreen.
      return email
    } catch (e) {
      setError(getAuthErrorMessage(getFirebaseErrorCode(e)))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // ── Email Sign-In ───────────────────────────────────────────────────────────

  const handleEmailSignIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await signInWithEmail(auth, email, password)
      // initAuthListener routes automatically
    } catch (e) {
      setError(getAuthErrorMessage(getFirebaseErrorCode(e)))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Password Reset ──────────────────────────────────────────────────────────

  /**
   * Sends a password reset email. Returns true on success.
   */
  const handlePasswordReset = async (email: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await requestPasswordReset(auth, email)
      return true
    } catch (e) {
      setError(getAuthErrorMessage(getFirebaseErrorCode(e)))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // ── Email Verification Polling ──────────────────────────────────────────────

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recheckStatus = useAuthStore((s) => s.recheckStatus)

  /**
   * Starts polling user.reload() every 3 seconds.
   * When emailVerified becomes true, recheckStatus() advances the navigator
   * to the Onboarding stack automatically.
   * Returns a cleanup function to stop polling.
   */
  const startVerificationPolling = () => {
    if (pollingRef.current) return

    pollingRef.current = setInterval(async () => {
      await recheckStatus()
    }, 3000)

    return () => stopVerificationPolling()
  }

  const stopVerificationPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    return () => stopVerificationPolling()
  }, [])

  // ── Resend Verification Email ───────────────────────────────────────────────

  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await resendVerificationEmail(auth)
      // Start 60-second cooldown
      setResendCooldown(60)
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (e) {
      setError(getAuthErrorMessage(getFirebaseErrorCode(e)))
    }
  }

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  return {
    isLoading,
    error,
    clearError,
    resendCooldown,
    handleGoogleSignIn,
    handleEmailSignUp,
    handleEmailSignIn,
    handlePasswordReset,
    handleResendVerification,
    startVerificationPolling,
    stopVerificationPolling,
  }
}
