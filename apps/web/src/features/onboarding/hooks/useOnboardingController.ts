/**
 * Onboarding wizard controller for the web app.
 * Identical business logic to apps/mobile's useOnboardingController —
 * kept in the app layer (not core) because it has no React Native deps.
 */

import { useState, useRef, useCallback } from 'react'
import { doc, updateDoc, writeBatch, getDoc, serverTimestamp } from 'firebase/firestore'
import { getDb, useAuthStore, useOnboardingStore } from '@voices/core'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const DB_TIMEOUT = 5_000

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), DB_TIMEOUT),
    ),
  ])
}

export function useOnboardingController() {
  const user = useAuthStore((s) => s.user)
  const store = useOnboardingStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')

  const uid = user?.uid ?? ''

  // ── Step 1: Display Name ──────────────────────────────────────────────────

  const submitDisplayName = async (displayName: string): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await withTimeout(
        updateDoc(doc(db, 'users', uid), {
          displayName: displayName.trim(),
          onboardingStep: 1,
          updatedAt: serverTimestamp(),
        }),
      )
      store.updateDraft({ displayName: displayName.trim() })
      store.nextStep()
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg === 'TIMEOUT' ? 'Connection timed out.' : 'Failed to save name.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: Username ──────────────────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkUsernameAvailable = useCallback((username: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const lower = username.toLowerCase()
    if (!lower || lower.length < 3 || !/^[a-z0-9_]+$/.test(lower)) {
      setUsernameStatus(lower.length > 0 ? 'invalid' : 'idle')
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

  const submitUsername = async (username: string): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const lower = username.toLowerCase()
      const db = getDb()
      const batch = writeBatch(db)
      batch.update(doc(db, 'users', uid), {
        username: lower,
        onboardingStep: 2,
        updatedAt: serverTimestamp(),
      })
      batch.set(doc(db, 'usernames', lower), { uid })
      await withTimeout(batch.commit())
      store.updateDraft({ username: lower })
      store.nextStep()
      return true
    } catch {
      setError('This username might already be taken.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 3: Profile (bio + avatar URL) ───────────────────────────────────

  const submitProfile = async (bio: string, profileImageUrl: string | null): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await withTimeout(
        updateDoc(doc(db, 'users', uid), {
          bio: bio.trim(),
          ...(profileImageUrl !== null && {
            profileImageUrl,
            avatarProvider: 'google',
          }),
          onboardingStep: 3,
          updatedAt: serverTimestamp(),
        }),
      )
      store.updateDraft({ bio: bio.trim(), profileImageUrl })
      store.nextStep()
      return true
    } catch {
      setError('Failed to save profile info.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipProfile = async (): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await withTimeout(
        updateDoc(doc(db, 'users', uid), {
          onboardingStep: 3,
          updatedAt: serverTimestamp(),
        }),
      )
      store.nextStep()
      return true
    } catch {
      setError('Failed to skip.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 4: Interests + completion ───────────────────────────────────────

  const finishOnboarding = async (preferredTags: string[]): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)
    try {
      const db = getDb()
      await withTimeout(
        updateDoc(doc(db, 'users', uid), {
          preferredTags,
          onboardingCompleted: true,
          onboardingStep: 4,
          updatedAt: serverTimestamp(),
        }),
      )
      store.updateDraft({ preferredTags })
      useAuthStore.getState()._setStatus('authenticated')
      return true
    } catch {
      setError('Failed to finalize onboarding.')
      return false
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
