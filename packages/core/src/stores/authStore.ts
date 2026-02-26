/**
 * Global auth state store.
 *
 * Holds the Firebase User object and a derived navigation status that
 * RootNavigator uses to decide which stack to render.
 *
 * Usage in apps/mobile entry point:
 *   1. Call initFirebase(config)
 *   2. Call initializeAuth(getFirebaseApp(), { persistence: ... })  ← mobile only
 *   3. Call initAuthListener() and store the returned unsubscribe fn
 *   4. RootNavigator reads useAuthStore((s) => s.status)
 */

import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getDb } from '../lib/firebase'
import { createUserStub, updateLastSeen } from '../lib/auth/createUserDocument'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * loading     — Firebase hasn't resolved the initial auth state yet (show splash)
 * unauthenticated — No signed-in user (show Auth stack)
 * onboarding  — User is authenticated but hasn't completed onboarding (show Onboarding stack)
 * authenticated — User is authenticated and onboarding is done (show Main App)
 */
export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'onboarding'
  | 'authenticated'

interface AuthStore {
  user: User | null
  status: AuthStatus

  // Internal setters — use initAuthListener() to drive these
  _setUser: (user: User | null) => void
  _setStatus: (status: AuthStatus) => void

  signOut: () => Promise<void>
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: 'loading',

  _setUser: (user) => set({ user }),
  _setStatus: (status) => set({ status }),

  signOut: async () => {
    const auth = getFirebaseAuth()
    await auth.signOut()
    set({ user: null, status: 'unauthenticated' })
  },
}))

// ── Auth Listener ─────────────────────────────────────────────────────────────

/**
 * Subscribes to Firebase Auth state changes and updates the store accordingly.
 * Call once at the app root. Returns the unsubscribe function.
 *
 * Flow:
 *   null user  → status: 'unauthenticated'
 *   user, no Firestore doc → create stub doc → status: 'onboarding'
 *   user, doc exists, onboardingCompleted == false → resume → status: 'onboarding'
 *   user, doc exists, onboardingCompleted == true  → status: 'authenticated'
 */
export function initAuthListener(): () => void {
  const auth = getFirebaseAuth()

  return onAuthStateChanged(auth, async (user) => {
    const { _setUser, _setStatus } = useAuthStore.getState()
    _setUser(user)

    if (!user) {
      _setStatus('unauthenticated')
      return
    }

    try {
      const db = getDb()
      const snap = await getDoc(doc(db, 'users', user.uid))

      if (!snap.exists()) {
        // First sign-in with this provider — create the stub document
        await createUserStub(user)
        _setStatus('onboarding')
        return
      }

      const data = snap.data()

      if (data['onboardingCompleted'] !== true) {
        _setStatus('onboarding')
      } else {
        // Existing user returning — update lastSeenAt asynchronously
        updateLastSeen(user.uid).catch(() => {
          // Non-critical; don't block navigation
        })
        _setStatus('authenticated')
      }
    } catch {
      // Network error or Firestore unavailable — treat as onboarding to be safe
      // The onboarding wizard will recover on next write attempt
      _setStatus('onboarding')
    }
  })
}
