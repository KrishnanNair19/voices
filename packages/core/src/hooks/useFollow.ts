/**
 * TanStack Query hooks for the follow graph.
 *
 * Follows are stored at: follows/{followerId}__{followedId}
 *
 * useIsFollowing(targetUserId) — reactive bool: does the current user follow targetUserId?
 * useFollowUser()              — mutation: follow a user
 * useUnfollowUser()            — mutation: unfollow a user
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { useAuthStore } from '../stores/authStore'
import type { Follow } from '../types/social'

// ── Helpers ───────────────────────────────────────────────────────────────────

function followDocId(followerId: string, followedId: string): string {
  return `${followerId}__${followedId}`
}

// ── Query keys ────────────────────────────────────────────────────────────────

const followKeys = {
  status: (followerId: string, followedId: string) =>
    ['follow', followerId, followedId] as const,
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns true if the currently signed-in user follows targetUserId.
 * Returns false (not undefined) when unauthenticated so the UI can
 * render a follow button without a loading state.
 */
export function useIsFollowing(targetUserId: string): UseQueryResult<boolean> {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: followKeys.status(user?.uid ?? '', targetUserId),
    queryFn: async () => {
      if (!user || !targetUserId) return false
      const db = getDb()
      const snap = await getDoc(
        doc(db, 'follows', followDocId(user.uid, targetUserId)),
      )
      return snap.exists()
    },
    enabled: !!user && !!targetUserId,
    staleTime: 1000 * 60 * 5,
    placeholderData: false,
  })
}

// ── Follow ────────────────────────────────────────────────────────────────────

/** Follow a user. Throws if the current user is not authenticated. */
export function useFollowUser(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error('Must be signed in to follow a user')
      if (user.uid === targetUserId) throw new Error('Cannot follow yourself')

      const db = getDb()
      const follow: Follow = {
        followerId: user.uid,
        followedId: targetUserId,
        createdAt: Date.now(),
      }
      await setDoc(doc(db, 'follows', followDocId(user.uid, targetUserId)), follow)
    },
    onSuccess: (_, targetUserId) => {
      void queryClient.invalidateQueries({
        queryKey: followKeys.status(user?.uid ?? '', targetUserId),
      })
    },
  })
}

// ── Unfollow ──────────────────────────────────────────────────────────────────

/** Unfollow a user. Throws if the current user is not authenticated. */
export function useUnfollowUser(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error('Must be signed in to unfollow a user')

      const db = getDb()
      await deleteDoc(doc(db, 'follows', followDocId(user.uid, targetUserId)))
    },
    onSuccess: (_, targetUserId) => {
      void queryClient.invalidateQueries({
        queryKey: followKeys.status(user?.uid ?? '', targetUserId),
      })
    },
  })
}
