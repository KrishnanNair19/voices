/**
 * Global auth state store.
 *
 * Holds the Firebase User object and a derived navigation status that
 * RootNavigator uses to decide which stack to render.
 *
 * Usage in apps/mobile entry point:
 *   1. Call initFirebase(config)
 *   2. Call initializeAuth(getFirebaseApp(), { persistence: getReactNativePersistence(AsyncStorage) })
 *   3. Call initAuthListener() inside useEffect at the app root; unsubscribe on unmount
 *   4. RootNavigator reads useAuthStore((s) => s.status)
 */

import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getDb } from '../lib/firebase'
import { createUserStub, updateLastSeen } from '../lib/auth/createUserDocument'
import { useOnboardingStore } from './onboardingStore'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * loading         — Firebase hasn't resolved the initial auth state yet (show splash)
 * unauthenticated — No signed-in user, OR email user whose email is not yet verified
 * onboarding      — Authenticated + verified, but onboarding wizard not finished
 * authenticated   — Fully authenticated and onboarded (show Main App)
 */
export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'onboarding'
  | 'authenticated'

interface AuthStore {
  user: User | null
  status: AuthStatus

  // Internal setters — driven by initAuthListener() and recheckStatus()
  _setUser: (user: User | null) => void
  _setStatus: (status: AuthStatus) => void

  /**
   * Re-evaluates auth status for the currently signed-in user.
   * Call this after detecting email verification in EmailVerificationPendingScreen
   * so the navigator advances from the Auth stack to the Onboarding wizard.
   */
  recheckStatus: () => Promise<void>

  signOut: () => Promise<void>
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: 'loading',

  _setUser: (user) => set({ user }),
  _setStatus: (status) => set({ status }),

  recheckStatus: async () => {
    const auth = getFirebaseAuth()
    const current = auth.currentUser
    if (!current) {
      set({ status: 'unauthenticated' })
      return
    }
    // Pull the latest emailVerified flag from Firebase servers before re-evaluating
    await current.reload()
    const fresh = auth.currentUser!
    set({ user: fresh })
    await resolveAuthStatus(fresh)
  },

  signOut: async () => {
    const auth = getFirebaseAuth()
    await auth.signOut()
    useOnboardingStore.getState().reset()
    set({ user: null, status: 'unauthenticated' })
  },
}))

// ── Shared status-resolution logic ────────────────────────────────────────────

/**
 * Core routing logic shared by initAuthListener and recheckStatus.
 * Evaluates the current user against Firestore and sets the store status.
 * Also restores the saved onboardingStep for cross-device resume.
 */
async function resolveAuthStatus(user: User): Promise<void> {
  const { _setStatus } = useAuthStore.getState()

  // Email/password accounts must verify their email before entering the wizard.
  // Google accounts are implicitly verified — skip this check for them.
  const isEmailProvider = user.providerData.some((p) => p.providerId === 'password')
  if (isEmailProvider && !user.emailVerified) {
    _setStatus('unauthenticated')
    return
  }

  try {
    const db = getDb()
    const snap = await getDoc(doc(db, 'users', user.uid))

    if (!snap.exists()) {
      // First sign-in — create the stub document and send to wizard
      await createUserStub(user)
      _setStatus('onboarding')
      return
    }

    const data = snap.data()

    if (data['onboardingCompleted'] !== true) {
      // Resume from the saved step so cross-device handoff works
      const rawStep = data['onboardingStep']
      const savedStep = (
        typeof rawStep === 'number' ? Math.min(rawStep, 4) : 0
      ) as 0 | 1 | 2 | 3 | 4
      useOnboardingStore.getState().setStep(savedStep)
      _setStatus('onboarding')
    } else {
      updateLastSeen(user.uid).catch(() => {
        // Non-critical — don't block navigation
      })
      _setStatus('authenticated')
    }
  } catch {
    // Network error / Firestore unavailable — route to onboarding
    // The wizard will recover on the next write attempt
    _setStatus('onboarding')
  }
}

// ── Auth Listener ─────────────────────────────────────────────────────────────

/**
 * Subscribes to Firebase Auth state changes and updates the store accordingly.
 * Call once at the app root (inside useEffect). Returns the unsubscribe function.
 *
 * Flow:
 *   null user                                        → 'unauthenticated'
 *   email user, emailVerified == false               → 'unauthenticated'
 *   user, no Firestore doc                           → createStub → 'onboarding'
 *   user, doc exists, onboardingCompleted == false   → resume step → 'onboarding'
 *   user, doc exists, onboardingCompleted == true    → 'authenticated'
 */
export function initAuthListener(): () => void {
  const auth = getFirebaseAuth()

  return onAuthStateChanged(auth, async (user) => {
    const { _setUser, _setStatus } = useAuthStore.getState()

    if (!user) {
      _setUser(null)
      _setStatus('unauthenticated')
      return
    }

    _setUser(user)
    await resolveAuthStatus(user)
  })
}
