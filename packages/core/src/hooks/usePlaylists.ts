/**
 * TanStack Query hooks for Playlist Firestore documents.
 *
 * usePlaylists(userId?)    — fetch public playlists, or a specific user's playlists
 * usePlaylist(id)          — fetch a single playlist
 * useCreatePlaylist()      — mutation: create a new playlist
 * useUpdatePlaylist()      — mutation: rename, reorder, or add/remove stories
 * useDeletePlaylist()      — mutation: delete a playlist and its cover image
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
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { playlistConverter } from '../lib/converters'
import type { Playlist } from '../types/playlist'

// ── Query keys ────────────────────────────────────────────────────────────────

export const playlistKeys = {
  all: ['playlists'] as const,
  list: (userId?: string) => ['playlists', 'list', userId] as const,
  detail: (id: string) => ['playlists', 'detail', id] as const,
}

// ── Read: list ────────────────────────────────────────────────────────────────

/**
 * Fetch playlists from Firestore.
 *
 * - With userId: returns all playlists owned by that user.
 * - Without userId: returns all public, non-curated playlists (discovery feed).
 */
export function usePlaylists(userId?: string): UseQueryResult<Playlist[]> {
  return useQuery({
    queryKey: playlistKeys.list(userId),
    queryFn: async () => {
      const db = getDb()
      const ref = collection(db, 'playlists').withConverter(playlistConverter)

      const constraints = userId
        ? [where('ownerId', '==', userId)]
        : [where('isPublic', '==', true), where('isCurated', '==', false)]

      const snap = await getDocs(query(ref, ...constraints))
      const playlists = snap.docs.map((d) => d.data())
      return playlists.sort((a, b) => b.createdAt - a.createdAt)
    },
    staleTime: 1000 * 60 * 3,
  })
}

// ── Read: single ──────────────────────────────────────────────────────────────

/** Fetch and cache a single playlist by ID. */
export function usePlaylist(id: string | null): UseQueryResult<Playlist | null> {
  return useQuery({
    queryKey: playlistKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null
      const db = getDb()
      const snap = await getDoc(
        doc(db, 'playlists', id).withConverter(playlistConverter),
      )
      return snap.exists() ? snap.data() : null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Create ────────────────────────────────────────────────────────────────────

interface CreatePlaylistArgs {
  title: string
  description?: string
  coverImageUrl?: string
  ownerId: string
  isPublic?: boolean
}

/** Create a new playlist. Returns the new document ID. */
export function useCreatePlaylist(): UseMutationResult<string, Error, CreatePlaylistArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, description, coverImageUrl, ownerId, isPublic = false }) => {
      const db = getDb()
      const docRef = await addDoc(
        collection(db, 'playlists').withConverter(playlistConverter),
        {
          id: '',           // stripped by converter on write
          title,
          ownerId,
          storyIds: [],
          isPublic,
          isCurated: false,
          createdAt: Date.now(),
          // Optional fields — spread only when defined (exactOptionalPropertyTypes)
          ...(description !== undefined && { description }),
          ...(coverImageUrl !== undefined && { coverImageUrl }),
        },
      )
      return docRef.id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all })
    },
  })
}

// ── Update ────────────────────────────────────────────────────────────────────

interface UpdatePlaylistArgs {
  id: string
  updates: Partial<Pick<Playlist, 'title' | 'description' | 'coverImageUrl' | 'isPublic' | 'storyIds'>>
}

/** Update playlist metadata or the ordered storyIds array. */
export function useUpdatePlaylist(): UseMutationResult<void, Error, UpdatePlaylistArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const db = getDb()
      await updateDoc(doc(db, 'playlists', id), updates)
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all })
    },
  })
}

// ── Add / Remove story ────────────────────────────────────────────────────────

interface PlaylistStoryArgs {
  playlistId: string
  storyId: string
}

/** Append a story ID to a playlist's storyIds array (Firestore arrayUnion). */
export function useAddStoryToPlaylist(): UseMutationResult<void, Error, PlaylistStoryArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ playlistId, storyId }) => {
      const db = getDb()
      await updateDoc(doc(db, 'playlists', playlistId), {
        storyIds: arrayUnion(storyId),
      })
    },
    onSuccess: (_, { playlistId }) => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.detail(playlistId) })
    },
  })
}

/** Remove a story ID from a playlist's storyIds array (Firestore arrayRemove). */
export function useRemoveStoryFromPlaylist(): UseMutationResult<void, Error, PlaylistStoryArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ playlistId, storyId }) => {
      const db = getDb()
      await updateDoc(doc(db, 'playlists', playlistId), {
        storyIds: arrayRemove(storyId),
      })
    },
    onSuccess: (_, { playlistId }) => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.detail(playlistId) })
    },
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────

/** Delete a playlist document. The caller is responsible for removing any
 *  associated cover image from Firebase Storage if needed. */
export function useDeletePlaylist(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (playlistId: string) => {
      const db = getDb()
      await deleteDoc(doc(db, 'playlists', playlistId))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all })
    },
  })
}
