/**
 * Auth form controller for Login and Sign Up pages.
 *
 * Wraps Firebase email/password and Google sign-in helpers from packages/core.
 * The auth state listener in App.tsx automatically advances the router once
 * Firebase resolves the new user — no manual navigation needed here.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFirebaseAuth,
  signUpWithEmail,
  signInWithEmail,
  getAuthErrorMessage,
  signInWithGooglePopup,
} from '@voices/core'
import {
  validateLoginForm,
  validateSignUpForm,
  isValid,
  type FieldError,
} from '../validation'

// ── Login ──────────────────────────────────────────────────────────────────────

export function useLoginController() {
  const navigate = useNavigate()
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailLogin = async (email: string, password: string) => {
    const errors = validateLoginForm(email, password)
    setFieldErrors(errors)
    if (!isValid(errors)) return

    setServerError(null)
    setIsLoading(true)
    try {
      const auth = getFirebaseAuth()
      await signInWithEmail(auth, email, password)
      // initAuthListener in App.tsx handles navigation
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
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      // User closing the popup is not an error worth showing
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
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      // initAuthListener → status='unauthenticated' (email not verified yet)
      // App.tsx router will land on /verify-email because authStore sets status
      // to 'unauthenticated' for unverified email accounts; the router redirects
      // unauthenticated users to /login, so we manually navigate to verify-email.
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
