/**
 * TanStack Query hooks for a single Story document.
 *
 * useStory(id)      — fetch and cache a single story by ID
 * useIncrementPlay  — fire-and-forget play count increment (called on listen mount)
 */

import {
  useQuery,
  useMutation,
  type UseQueryResult,
} from '@tanstack/react-query'
import {
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { storyConverter } from '../lib/converters'
import { storyKeys } from './useStories'
import type { Story } from '../types/story'

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch and cache a single story by its Firestore document ID.
 * Disabled when id is null/empty.
 *
 * Cache: 5-minute stale time — story metadata changes infrequently.
 */
export function useStory(id: string | null): UseQueryResult<Story | null> {
  return useQuery({
    queryKey: storyKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return null
      const db = getDb()
      const snap = await getDoc(
        doc(db, 'stories', id).withConverter(storyConverter),
      )
      return snap.exists() ? snap.data() : null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// ── Play count ────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget mutation that increments the play count by 1.
 * Call this on mount of the StoryListenPage / audio player.
 *
 * Usage:
 *   const { mutate: incrementPlay } = useIncrementPlay()
 *   useEffect(() => { incrementPlay(storyId) }, [storyId])
 */
export function useIncrementPlay() {
  return useMutation({
    mutationFn: async (storyId: string) => {
      const db = getDb()
      await updateDoc(doc(db, 'stories', storyId), {
        playCount: increment(1),
      })
    },
    // No cache invalidation needed — optimistic UI not required for counters.
  })
}
