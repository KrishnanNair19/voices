/**
 * TanStack Query hook for fetching the public story feed.
 *
 * Supports optional filters for tag, content type, and author.
 * Results are sorted client-side by createdAt descending to avoid
 * requiring a composite Firestore index for every filter combination.
 *
 * Firestore index needed for production:
 *   Collection: stories | Fields: isPublic ASC, createdAt DESC
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  type QueryConstraint,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { storyConverter } from '../lib/converters'
import type { Story, StoryContentType } from '../types/story'

// ── Filters ───────────────────────────────────────────────────────────────────

export interface StoriesFilter {
  /** Filter to stories tagged with this value (array-contains). */
  tag?: string
  /** Filter to a single content type. */
  contentType?: StoryContentType
  /** Filter to stories by a specific author. */
  authorId?: string
  /** Max number of results (default 50). */
  limit?: number
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const storyKeys = {
  all: ['stories'] as const,
  list: (filter?: StoriesFilter) => ['stories', 'list', filter] as const,
  detail: (id: string) => ['stories', 'detail', id] as const,
  byUser: (userId: string) => ['stories', 'user', userId] as const,
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches public stories with optional filtering.
 *
 * Note: Combining tag + contentType filters requires a composite Firestore
 * index. If you encounter a missing-index error, add the index in the
 * Firebase console or firestore.indexes.json.
 */
export function useStories(filter?: StoriesFilter): UseQueryResult<Story[]> {
  return useQuery({
    queryKey: storyKeys.list(filter),
    queryFn: async () => {
      const db = getDb()
      const ref = collection(db, 'stories').withConverter(storyConverter)

      const constraints: QueryConstraint[] = [
        where('isPublic', '==', true),
        limit(filter?.limit ?? 50),
      ]

      if (filter?.tag) {
        constraints.push(where('tags', 'array-contains', filter.tag))
      }
      if (filter?.contentType) {
        constraints.push(where('contentType', '==', filter.contentType))
      }
      if (filter?.authorId) {
        constraints.push(where('authorId', '==', filter.authorId))
      }

      const snap = await getDocs(query(ref, ...constraints))
      const stories = snap.docs.map((d) => d.data())

      // Client-side sort: newest first
      return stories.sort((a, b) => b.createdAt - a.createdAt)
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
