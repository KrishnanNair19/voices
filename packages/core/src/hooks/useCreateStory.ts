/**
 * TanStack Query mutation hook for creating a new story.
 *
 * Handles the full upload pipeline:
 *   1. Upload audio blob to Firebase Storage (audio/mixed)
 *   2. Upload image files to Firebase Storage (image/mixed)
 *   3. Upload video file to Firebase Storage (video)
 *   4. Write the Story document to Firestore
 *
 * Progress is reported via the optional onProgress callback so the UI
 * can show a meaningful upload progress bar.
 *
 * Returns the new story's Firestore document ID on success.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { collection, addDoc } from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { storyConverter } from '../lib/converters'
import {
  uploadFile,
  generateStoragePath,
  getExtension,
} from '../utils/storageUtils'
import { storyKeys } from './useStories'
import type { StoryDraft } from '../types/story'

// ── Args ──────────────────────────────────────────────────────────────────────

export interface CreateStoryArgs {
  draft: StoryDraft
  authorId: string
  /** Called with overall upload progress 0–100. */
  onProgress?: (pct: number) => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCreateStory(): UseMutationResult<string, Error, CreateStoryArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ draft, authorId, onProgress }: CreateStoryArgs) => {
      // Count total upload steps for accurate progress reporting
      const totalSteps =
        (draft.audioBlob ? 1 : 0) +
        (draft.mediaFiles?.length ?? 0) +
        (draft.videoFile ? 1 : 0)

      let completedSteps = 0

      const reportStep = () => {
        completedSteps++
        onProgress?.(totalSteps > 0 ? (completedSteps / totalSteps) * 95 : 50)
      }

      // ── Step 1: Upload audio ───────────────────────────────────────────────
      let audioUrl: string | undefined
      if (draft.audioBlob) {
        audioUrl = await uploadFile(
          draft.audioBlob,
          generateStoragePath('story-audio', authorId, 'webm'),
        )
        reportStep()
      }

      // ── Step 2: Upload images ──────────────────────────────────────────────
      const mediaUrls: string[] = []
      for (const file of draft.mediaFiles ?? []) {
        const url = await uploadFile(
          file,
          generateStoragePath('story-image', authorId, getExtension(file)),
        )
        mediaUrls.push(url)
        reportStep()
      }

      // ── Step 3: Upload video ───────────────────────────────────────────────
      let videoUrl: string | undefined
      if (draft.videoFile) {
        videoUrl = await uploadFile(
          draft.videoFile,
          generateStoragePath('story-video', authorId, getExtension(draft.videoFile)),
        )
        reportStep()
      }

      // ── Step 4: Write Firestore document ───────────────────────────────────
      const db = getDb()
      const now = Date.now()

      const docRef = await addDoc(
        collection(db, 'stories').withConverter(storyConverter),
        {
          // Required fields (satisfies Story minus 'id')
          id: '',           // placeholder — converter strips this on write
          contentType: draft.contentType,
          title: draft.title,
          description: draft.description,
          tags: draft.tags,
          authorId,
          location: draft.location ?? { lat: 0, lng: 0 },
          isPublic: draft.isPublic,
          playCount: 0,
          likeCount: 0,
          commentCount: 0,
          createdAt: now,
          updatedAt: now,
          // Optional fields — spread only when defined (exactOptionalPropertyTypes)
          ...(draft.locationName !== undefined && { locationName: draft.locationName }),
          ...(audioUrl !== undefined && { audioUrl }),
          ...(draft.textContent !== undefined && { textContent: draft.textContent }),
          ...(mediaUrls.length > 0 && { mediaUrls }),
          ...(videoUrl !== undefined && { videoUrl }),
        },
      )

      onProgress?.(100)
      return docRef.id
    },

    onSuccess: () => {
      // Invalidate all story list queries so the new story appears immediately
      void queryClient.invalidateQueries({ queryKey: storyKeys.all })
    },
  })
}
