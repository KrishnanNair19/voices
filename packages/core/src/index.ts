// ── Design tokens ─────────────────────────────────────────────────────────────
export * from './theme/tokens'

// ── Domain types ──────────────────────────────────────────────────────────────
export type { Story, GeoPoint } from './types/story'
export type {
  UserProfile,
  AuthProvider,
  AvatarProvider,
  PermissionStatus,
  NotificationPreferences,
} from './types/user'
export type { Playlist } from './types/playlist'

// ── Firebase init ─────────────────────────────────────────────────────────────
export {
  initFirebase,
  getFirebaseApp,
  getDb,
  getFirebaseAuth,
  getFirebaseStorage,
} from './lib/firebase'
export type { FirebaseConfig } from './lib/firebase'

// ── Firestore converters ──────────────────────────────────────────────────────
export {
  userProfileConverter,
  storyConverter,
  playlistConverter,
} from './lib/converters'

// ── Auth helpers ──────────────────────────────────────────────────────────────
export {
  signUpWithEmail,
  signInWithEmail,
  requestPasswordReset,
  resendVerificationEmail,
  getAuthErrorMessage,
} from './lib/auth/emailAuth'
export { createUserStub, updateLastSeen } from './lib/auth/createUserDocument'

// ── Stores ────────────────────────────────────────────────────────────────────
export { useAuthStore, initAuthListener } from './stores/authStore'
export type { AuthStatus } from './stores/authStore'

export { useOnboardingStore, ONBOARDING_TOTAL_STEPS } from './stores/onboardingStore'
export type { OnboardingStep, OnboardingDraft } from './stores/onboardingStore'

// ── TanStack Query hooks ──────────────────────────────────────────────────────
export {
  useUserProfile,
  useUpdateUserProfile,
  userProfileKeys,
} from './hooks/useUserProfile'
