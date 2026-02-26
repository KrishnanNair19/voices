import type { Timestamp } from 'firebase/firestore'

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Primary auth provider used to create the account. */
export type AuthProvider = 'google' | 'email'

// ── Avatar ────────────────────────────────────────────────────────────────────

/** Where the profile image came from. */
export type AvatarProvider = 'google' | 'uploaded' | 'none'

// ── Permissions ───────────────────────────────────────────────────────────────

/** OS-level permission status, stored for UX purposes only. */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined'

// ── Preferences ───────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  newFollower: boolean
  nearbyStory: boolean
  playlistUpdate: boolean
}

// ── User Profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  // Identity — set by Firebase Auth; we read, never write directly
  uid: string
  email: string | null
  authProvider: AuthProvider
  /** All Firebase provider IDs linked to this account, e.g. ['google.com', 'password'] */
  linkedProviders: string[]

  // Profile — set during onboarding; editable via EditProfileScreen
  displayName: string
  /** Unique handle: 3–20 chars, [a-z0-9_] only. Immutable after set. */
  username: string
  /** Max 160 chars. Empty string when not set. */
  bio: string
  /** Cloud Storage URL, or Google photoURL, or null (falls back to initials avatar). */
  profileImageUrl: string | null
  avatarProvider: AvatarProvider

  // Onboarding — wizard resume state
  /** True once the user completes or skips the final onboarding step. */
  onboardingCompleted: boolean
  /** Current wizard step (0–4). Used to resume cross-device. */
  onboardingStep: number

  // Permissions — stored for UX; OS enforcement is separate
  locationPermission: PermissionStatus
  microphonePermission: PermissionStatus

  // Preferences
  /** Tags selected during Interests step, e.g. ['music', 'history']. */
  preferredTags: string[]
  notificationPrefs: NotificationPreferences

  // Social counters — denormalised; incremented by Cloud Functions (Phase 3+)
  followerCount: number
  followingCount: number
  storyCount: number

  // Timestamps — always written via serverTimestamp()
  createdAt: Timestamp
  updatedAt: Timestamp
  lastSeenAt: Timestamp
}
