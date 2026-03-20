/**
 * TanStack Query hooks for story comments.
 *
 * Comments are stored in a subcollection: stories/{storyId}/comments/{commentId}
 *
 * useComments(storyId)  — fetch the comment thread for a story
 * useAddComment()       — mutation: post a new comment
 * useDeleteComment()    — mutation: delete own comment
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
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  orderBy,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { commentConverter } from '../lib/converters'
import { useAuthStore } from '../stores/authStore'
import type { Comment } from '../types/social'

// ── Query keys ────────────────────────────────────────────────────────────────

export const commentKeys = {
  all: (storyId: string) => ['comments', storyId] as const,
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all comments for a story, ordered oldest-first.
 * staleTime is 0 so comments always refetch when the component mounts
 * (comment threads are expected to change frequently).
 */
export function useComments(storyId: string | null): UseQueryResult<Comment[]> {
  return useQuery({
    queryKey: commentKeys.all(storyId ?? ''),
    queryFn: async () => {
      if (!storyId) return []
      const db = getDb()
      const ref = collection(db, 'stories', storyId, 'comments').withConverter(
        commentConverter,
      )
      const snap = await getDocs(query(ref, orderBy('createdAt', 'asc')))
      return snap.docs.map((d) => d.data())
    },
    enabled: !!storyId,
    staleTime: 0,
  })
}

// ── Add comment ───────────────────────────────────────────────────────────────

interface AddCommentArgs {
  storyId: string
  text: string
}

/** Post a new comment on a story. Requires the user to be authenticated. */
export function useAddComment(): UseMutationResult<void, Error, AddCommentArgs> {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ storyId, text }: AddCommentArgs) => {
      if (!user) throw new Error('Must be signed in to comment')
      if (!text.trim()) throw new Error('Comment cannot be empty')

      const db = getDb()
      await addDoc(
        collection(db, 'stories', storyId, 'comments').withConverter(commentConverter),
        {
          id: '',           // stripped by converter
          storyId,
          authorId: user.uid,
          text: text.trim(),
          createdAt: Date.now(),
        },
      )
    },
    onSuccess: (_, { storyId }) => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all(storyId) })
    },
  })
}

// ── Delete comment ────────────────────────────────────────────────────────────

interface DeleteCommentArgs {
  storyId: string
  commentId: string
}

/** Delete a comment. Firestore Security Rules enforce ownership server-side. */
export function useDeleteComment(): UseMutationResult<void, Error, DeleteCommentArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storyId, commentId }: DeleteCommentArgs) => {
      const db = getDb()
      await deleteDoc(doc(db, 'stories', storyId, 'comments', commentId))
    },
    onSuccess: (_, { storyId }) => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all(storyId) })
    },
  })
}
