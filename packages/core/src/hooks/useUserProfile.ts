/**
 * TanStack Query hooks for UserProfile Firestore documents.
 *
 * useUserProfile(uid) — read a user profile (own or another user's)
 * useUpdateUserProfile() — mutation to write partial profile updates
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { userProfileConverter } from '../lib/converters'
import type { UserProfile } from '../types/user'

// ── Query keys ────────────────────────────────────────────────────────────────

export const userProfileKeys = {
  all: ['userProfile'] as const,
  detail: (uid: string) => ['userProfile', uid] as const,
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch and cache a user profile from Firestore.
 * Disabled when uid is null (unauthenticated state).
 *
 * Cache: 5-minute stale time — profile data changes infrequently.
 */
export function useUserProfile(
  uid: string | null,
): UseQueryResult<UserProfile | null> {
  return useQuery({
    queryKey: userProfileKeys.detail(uid ?? ''),
    queryFn: async () => {
      if (!uid) return null
      const db = getDb()
      const snap = await getDoc(
        doc(db, 'users', uid).withConverter(userProfileConverter),
      )
      return snap.exists() ? snap.data() : null
    },
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Lookup by username ────────────────────────────────────────────────────────

/**
 * Fetch a user profile by their unique username.
 * Performs a Firestore collection query — `where('username', '==', username)`.
 * Returns the first matching profile or null if none found.
 * Disabled when username is null.
 *
 * Cache: 5-minute stale time.
 */
export function useUserProfileByUsername(
  username: string | null,
): UseQueryResult<UserProfile | null> {
  return useQuery({
    queryKey: ['userProfile', 'byUsername', username] as const,
    queryFn: async () => {
      if (!username) return null
      const db = getDb()
      const snap = await getDocs(
        query(
          collection(db, 'users').withConverter(userProfileConverter),
          where('username', '==', username),
          limit(1),
        ),
      )
      const first = snap.docs[0]
      return first ? first.data() : null
    },
    enabled: username !== null,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Write ─────────────────────────────────────────────────────────────────────

interface UpdateProfileArgs {
  uid: string
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'authProvider' | 'linkedProviders'>>
}

/**
 * Mutation to partially update a user profile.
 * Always stamps updatedAt with serverTimestamp().
 * Invalidates the cached profile on success.
 */
export function useUpdateUserProfile(): UseMutationResult<void, Error, UpdateProfileArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ uid, updates }: UpdateProfileArgs) => {
      const db = getDb()
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: (_, { uid }) => {
      void queryClient.invalidateQueries({
        queryKey: userProfileKeys.detail(uid),
      })
    },
  })
}
