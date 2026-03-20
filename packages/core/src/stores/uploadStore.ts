/**
 * Multi-step story creation wizard state.
 *
 * Persists the in-progress StoryDraft across wizard steps so navigating
 * back/forward doesn't lose the user's work. Reset on publish or cancel.
 *
 * Step map (web wizard):
 *   0 — Choose content type
 *   1 — Create content (record / write / upload)
 *   2 — Story details (title, description, tags)
 *   3 — Pick location
 *   4 — Preview & publish
 */

import { create } from 'zustand'
import type { StoryDraft } from '../types/story'

// ── Types ─────────────────────────────────────────────────────────────────────

export type UploadStep = 0 | 1 | 2 | 3 | 4
export const UPLOAD_TOTAL_STEPS = 4

const DEFAULT_DRAFT: StoryDraft = {
  contentType: 'audio',
  title: '',
  description: '',
  tags: [],
  isPublic: true,
}

interface UploadStore {
  draft: StoryDraft
  currentStep: UploadStep
  /** True while files are uploading to Firebase Storage. */
  isUploading: boolean
  /** Upload progress 0–100 across all files combined. */
  uploadProgress: number
  error: string | null

  /** Merge partial updates into the draft (preserves unmentioned fields). */
  updateDraft: (partial: Partial<StoryDraft>) => void
  setStep: (step: UploadStep) => void
  nextStep: () => void
  prevStep: () => void
  setUploading: (v: boolean) => void
  setProgress: (pct: number) => void
  setError: (msg: string | null) => void
  /** Called on publish success, cancel, or sign-out. */
  reset: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useUploadStore = create<UploadStore>((set, get) => ({
  draft: DEFAULT_DRAFT,
  currentStep: 0,
  isUploading: false,
  uploadProgress: 0,
  error: null,

  updateDraft: (partial) =>
    set((s) => ({ draft: { ...s.draft, ...partial } })),

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((s) => ({
      currentStep: Math.min(UPLOAD_TOTAL_STEPS, s.currentStep + 1) as UploadStep,
      error: null,
    })),

  prevStep: () =>
    set((s) => ({
      currentStep: Math.max(0, s.currentStep - 1) as UploadStep,
      error: null,
    })),

  setUploading: (v) => set({ isUploading: v }),

  setProgress: (pct) => set({ uploadProgress: pct }),

  setError: (msg) => set({ error: msg }),

  reset: () =>
    set({
      draft: DEFAULT_DRAFT,
      currentStep: 0,
      isUploading: false,
      uploadProgress: 0,
      error: null,
    }),

  // expose get for external use (e.g. useCreateStory driving progress)
  _get: get,
}))
