/**
 * Auth form controller for Login and Sign Up pages.
 *
 * Wraps Firebase email/password and Google sign-in helpers from packages/core.
 * The auth state listener in App.tsx automatically advances the router once
 * Firebase resolves the new user — no manual navigation needed here.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFirebaseAuth,
  signUpWithEmail,
  signInWithEmail,
  getAuthErrorMessage,
  signInWithGooglePopup,
  useAuthStore,
} from '@voices/core'
import {
  validateLoginForm,
  validateSignUpForm,
  isValid,
  type FieldError,
} from '../validation'

/** Navigate away from auth pages once the auth listener resolves a signed-in user. */
function useAuthRedirect() {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    if (status === 'onboarding') navigate('/onboarding', { replace: true })
    else if (status === 'authenticated') navigate('/', { replace: true })
  }, [status, navigate])
}

// ── Login ──────────────────────────────────────────────────────────────────────

export function useLoginController() {
  const navigate = useNavigate()
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Advance the router once initAuthListener resolves a signed-in user
  useAuthRedirect()

  const handleEmailLogin = async (email: string, password: string) => {
    const errors = validateLoginForm(email, password)
    setFieldErrors(errors)
    if (!isValid(errors)) return

    setServerError(null)
    setIsLoading(true)
    try {
      const auth = getFirebaseAuth()
      await signInWithEmail(auth, email, password)
      // useAuthRedirect above will fire when initAuthListener updates the status
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setServerError(getAuthErrorMessage(code))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setServerError(null)
    setIsLoading(true)
    try {
      await signInWithGooglePopup()
      // useAuthRedirect fires when the popup resolves and onAuthStateChanged updates the store
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setServerError(getAuthErrorMessage(code))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => navigate('/forgot-password')

  return {
    fieldErrors,
    serverError,
    isLoading,
    handleEmailLogin,
    handleGoogleLogin,
    handleForgotPassword,
  }
}

// ── Sign Up ────────────────────────────────────────────────────────────────────

export function useSignUpController() {
  const navigate = useNavigate()
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Google sign-up resolves directly to onboarding/home — advance automatically
  useAuthRedirect()

  const handleEmailSignUp = async (
    email: string,
    password: string,
    confirmPassword: string,
  ) => {
    const errors = validateSignUpForm(email, password, confirmPassword)
    setFieldErrors(errors)
    if (!isValid(errors)) return

    setServerError(null)
    setIsLoading(true)
    try {
      const auth = getFirebaseAuth()
      await signUpWithEmail(auth, email, password)
      // Email accounts land on status='unauthenticated' (email not yet verified).
      // useAuthRedirect won't fire for unauthenticated, so navigate manually.
      navigate('/verify-email', { replace: true })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setServerError(getAuthErrorMessage(code))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setServerError(null)
    setIsLoading(true)
    try {
      await signInWithGooglePopup()
      // useAuthRedirect fires when the popup resolves
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setServerError(getAuthErrorMessage(code))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    fieldErrors,
    serverError,
    isLoading,
    handleEmailSignUp,
    handleGoogleSignUp,
  }
}
