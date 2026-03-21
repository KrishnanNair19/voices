// ── Design tokens ─────────────────────────────────────────────────────────────
export * from './theme/tokens'

// ── Domain types ──────────────────────────────────────────────────────────────
export type { Story, GeoPoint, StoryContentType, StoryDraft } from './types/story'
export type {
  UserProfile,
  AuthProvider,
  AvatarProvider,
  PermissionStatus,
  NotificationPreferences,
} from './types/user'
export type { Playlist } from './types/playlist'
export type { Follow, Comment } from './types/social'

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
  commentConverter,
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
export { signInWithGooglePopup } from './lib/auth/googleAuth'

// ── Stores ────────────────────────────────────────────────────────────────────
export { useAuthStore, initAuthListener } from './stores/authStore'
export type { AuthStatus } from './stores/authStore'

export { useOnboardingStore, ONBOARDING_TOTAL_STEPS } from './stores/onboardingStore'
export type { OnboardingStep, OnboardingDraft } from './stores/onboardingStore'

export { usePlayerStore } from './stores/playerStore'

export { useUploadStore, UPLOAD_TOTAL_STEPS } from './stores/uploadStore'
export type { UploadStep } from './stores/uploadStore'

// ── TanStack Query hooks — user ───────────────────────────────────────────────
export {
  useUserProfile,
  useUserProfileByUsername,
  useUpdateUserProfile,
  userProfileKeys,
} from './hooks/useUserProfile'

// ── TanStack Query hooks — stories ────────────────────────────────────────────
export { useStories, storyKeys } from './hooks/useStories'
export type { StoriesFilter } from './hooks/useStories'

export { useStory, useIncrementPlay } from './hooks/useStory'

export { useUserStories } from './hooks/useUserStories'

export { useCreateStory } from './hooks/useCreateStory'
export type { CreateStoryArgs } from './hooks/useCreateStory'

// ── TanStack Query hooks — playlists ──────────────────────────────────────────
export {
  usePlaylists,
  usePlaylist,
  useCreatePlaylist,
  useUpdatePlaylist,
  useAddStoryToPlaylist,
  useRemoveStoryFromPlaylist,
  useDeletePlaylist,
  playlistKeys,
} from './hooks/usePlaylists'

// ── TanStack Query hooks — social ─────────────────────────────────────────────
export {
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
} from './hooks/useFollow'

export {
  useComments,
  useAddComment,
  useDeleteComment,
  commentKeys,
} from './hooks/useComments'

// ── Utilities ─────────────────────────────────────────────────────────────────
export { formatDuration } from './utils/formatDuration'
export { relativeTime, formatDate, formatShortDate } from './utils/dateUtils'
export { distanceBetween, reverseGeocode } from './utils/geoUtils'
export {
  uploadFile,
  generateStoragePath,
  getExtension,
} from './utils/storageUtils'
export type { StorageAssetType } from './utils/storageUtils'
