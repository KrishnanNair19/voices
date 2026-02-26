/**
 * Creates the initial Firestore users/{uid} document after a new sign-up.
 *
 * Called immediately after Firebase Auth creates the account (any provider).
 * Uses merge:true so re-authentication of an existing user never overwrites data.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getDb } from '../firebase'
import type { AuthProvider, AvatarProvider } from '../../types/user'

export async function createUserStub(user: User): Promise<void> {
  const db = getDb()
  const ref = doc(db, 'users', user.uid)

  await setDoc( //want to use setDoc so we can use the uid as the docId, addDoc would generate a random id
    ref,
    {
      uid: user.uid,
      email: user.email ?? null,
      authProvider: getAuthProvider(user),
      linkedProviders: user.providerData.map((p) => p.providerId),

      // Profile — onboarding wizard fills these in
      displayName: user.displayName ?? '',
      username: '',
      bio: '',
      profileImageUrl: getInitialPhotoUrl(user),
      avatarProvider: getAvatarProvider(user),

      // Onboarding state
      onboardingCompleted: false,
      onboardingStep: 0,

      // Permissions — undetermined until the OS dialog fires
      locationPermission: 'undetermined',
      microphonePermission: 'undetermined',

      // Preferences — defaults
      preferredTags: [],
      notificationPrefs: {
        newFollower: true,
        nearbyStory: true,
        playlistUpdate: true,
      },

      // Social counters
      followerCount: 0,
      followingCount: 0,
      storyCount: 0,

      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    // merge: true — safe to call on every sign-in; won't overwrite existing onboarding data
    { merge: true },
  )
}

/**
 * Updates lastSeenAt on every sign-in for existing users.
 * Lightweight — does not touch any other fields.
 */
export async function updateLastSeen(uid: string): Promise<void> {
  const db = getDb()
  await setDoc(
    doc(db, 'users', uid),
    { lastSeenAt: serverTimestamp() },
    { merge: true },
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthProvider(user: User): AuthProvider {
  const ids = user.providerData.map((p) => p.providerId)
  if (ids.includes('google.com')) return 'google'
  return 'email'
}

function getInitialPhotoUrl(user: User): string | null {
  // Only use the Google photo URL if the user signed in with Google
  const isGoogle = user.providerData.some((p) => p.providerId === 'google.com')
  return isGoogle && user.photoURL ? user.photoURL : null
}

function getAvatarProvider(user: User): AvatarProvider {
  const isGoogle = user.providerData.some((p) => p.providerId === 'google.com')
  return isGoogle && user.photoURL ? 'google' : 'none'
}
