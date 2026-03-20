/**
 * TanStack Query hook for fetching all stories by a specific user.
 *
 * Used on ProfilePage to populate the story grid.
 * Returns both public and private stories when the viewer is the author;
 * query-level filtering of private stories happens server-side via Firestore
 * Security Rules (non-authors can only read isPublic == true stories).
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { storyConverter } from '../lib/converters'
import { storyKeys } from './useStories'
import type { Story } from '../types/story'

/**
 * Fetch all stories authored by a given user.
 * Disabled when userId is null/empty.
 */
export function useUserStories(userId: string | null): UseQueryResult<Story[]> {
  return useQuery({
    queryKey: storyKeys.byUser(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []
      const db = getDb()
      const ref = collection(db, 'stories').withConverter(storyConverter)
      const snap = await getDocs(
        query(ref, where('authorId', '==', userId)),
      )
      const stories = snap.docs.map((d) => d.data())
      return stories.sort((a, b) => b.createdAt - a.createdAt)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 3,
  })
}
