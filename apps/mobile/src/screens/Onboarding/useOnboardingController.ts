/**
 * Controller for the Onboarding wizard screens.
 *
 * Each submit method writes the minimum data to Firestore and advances
 * the local step counter. The final step sets onboardingCompleted: true
 * and manually sets the auth store to 'authenticated' (since onAuthStateChanged
 * won't re-fire just because a Firestore document field changed).
 */

import { useState, useRef, useCallback } from 'react'
import { doc, updateDoc, writeBatch, getDoc, serverTimestamp } from 'firebase/firestore'
import { getDb, useAuthStore, useOnboardingStore } from '@voices/core'

// ── Types ─────────────────────────────────────────────────────────────────────

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

// ── Controller ────────────────────────────────────────────────────────────────

export function useOnboardingController() {
  const user = useAuthStore((s) => s.user)
  const store = useOnboardingStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')

  const uid = user?.uid ?? ''

  // ── Step 1: Display Name ────────────────────────────────────────────────────

  const submitDisplayName = async (displayName: string) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await updateDoc(doc(db, 'users', uid), {
        displayName: displayName.trim(),
        onboardingStep: 1,
        updatedAt: serverTimestamp(),
      })
      store.updateDraft({ displayName: displayName.trim() })
      store.nextStep()
    } catch {
      setError('Failed to save. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: Username ────────────────────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Debounced uniqueness check — call on every keystroke. */
  const checkUsernameAvailable = useCallback((username: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const lower = username.toLowerCase()
    if (!lower || lower.length < 3 || !/^[a-z0-9_]+$/.test(lower)) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const db = getDb()
        const snap = await getDoc(doc(db, 'usernames', lower))
        setUsernameStatus(snap.exists() ? 'taken' : 'available')
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
  }, [])

  const submitUsername = async (username: string) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const lower = username.toLowerCase()
      const db = getDb()

      // Atomic: reserve the username AND update the user doc
      const batch = writeBatch(db)
      batch.update(doc(db, 'users', uid), {
        username: lower,
        onboardingStep: 2,
        updatedAt: serverTimestamp(),
      })
      batch.set(doc(db, 'usernames', lower), { uid })
      await batch.commit()

      store.updateDraft({ username: lower })
      store.nextStep()
    } catch {
      setError('Failed to save username. It may have just been taken — try another.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 3: Profile (bio + avatar) ─────────────────────────────────────────

  const submitProfile = async (bio: string, profileImageUrl: string | null) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await updateDoc(doc(db, 'users', uid), {
        bio: bio.trim(),
        ...(profileImageUrl !== null && {
          profileImageUrl,
          avatarProvider: 'google',
        }),
        onboardingStep: 3,
        updatedAt: serverTimestamp(),
      })
      store.updateDraft({ bio: bio.trim(), profileImageUrl })
      store.nextStep()
    } catch {
      setError('Failed to save. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 4: Interests + completion ─────────────────────────────────────────

  const finishOnboarding = async (preferredTags: string[]) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await updateDoc(doc(db, 'users', uid), {
        preferredTags,
        onboardingCompleted: true,
        onboardingStep: 4,
        updatedAt: serverTimestamp(),
      })
      store.updateDraft({ preferredTags })
      // onAuthStateChanged won't re-fire just from a Firestore write, so
      // manually advance the navigator by setting status to 'authenticated'.
      useAuthStore.getState()._setStatus('authenticated')
    } catch {
      setError('Failed to save. Please check your connection and try again.')
      setIsSubmitting(false)
    }
  }

  // ── Skip handlers ───────────────────────────────────────────────────────────

  const skipProfile = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await updateDoc(doc(db, 'users', uid), {
        onboardingStep: 3,
        updatedAt: serverTimestamp(),
      })
      store.nextStep()
    } catch {
      setError('Failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipInterests = () => finishOnboarding([])

  return {
    store,
    user,
    isSubmitting,
    error,
    usernameStatus,
    submitDisplayName,
    checkUsernameAvailable,
    submitUsername,
    submitProfile,
    skipProfile,
    finishOnboarding,
    skipInterests,
  }
}
