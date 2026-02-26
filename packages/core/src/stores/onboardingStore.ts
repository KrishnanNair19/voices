/**
 * Onboarding wizard state.
 *
 * Tracks the current step and the in-progress draft profile.
 * This is in-memory only — each step also writes to Firestore via
 * useOnboardingController (apps/mobile) so the wizard is resumable
 * across devices and app restarts.
 *
 * Step map:
 *   0 — Welcome (no write)
 *   1 — Display Name (required)
 *   2 — Username (required)
 *   3 — Profile Photo + Bio (skippable)
 *   4 — Interests (skippable) → sets onboardingCompleted: true → Main App
 */

import { create } from 'zustand'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OnboardingStep = 0 | 1 | 2 | 3 | 4
export const ONBOARDING_TOTAL_STEPS = 4

/** Fields collected during the wizard. Subset of UserProfile. */
export interface OnboardingDraft {
  displayName: string
  username: string
  bio: string
  /** Google photoURL pre-filled from auth, or null (initials avatar). Upload is post-MVP. */
  profileImageUrl: string | null
  preferredTags: string[]
}

interface OnboardingStore {
  currentStep: OnboardingStep
  draft: OnboardingDraft
  /** True while a Firestore write is in progress (disables the Next button). */
  isSubmitting: boolean
  /** Non-null when a step write fails — displayed as an inline error banner. */
  error: string | null

  setStep: (step: OnboardingStep) => void
  nextStep: () => void
  updateDraft: (partial: Partial<OnboardingDraft>) => void
  setSubmitting: (v: boolean) => void
  setError: (msg: string | null) => void
  /** Called after wizard completion or on sign-out to reset state. */
  reset: () => void
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_DRAFT: OnboardingDraft = {
  displayName: '',
  username: '',
  bio: '',
  profileImageUrl: null,
  preferredTags: [],
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 0,
  draft: DEFAULT_DRAFT,
  isSubmitting: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((s) => ({
      currentStep: Math.min(
        ONBOARDING_TOTAL_STEPS,
        s.currentStep + 1,
      ) as OnboardingStep,
      error: null,
    })),

  updateDraft: (partial) =>
    set((s) => ({ draft: { ...s.draft, ...partial } })),

  setSubmitting: (v) => set({ isSubmitting: v }),

  setError: (msg) => set({ error: msg }),

  reset: () =>
    set({
      currentStep: 0,
      draft: DEFAULT_DRAFT,
      isSubmitting: false,
      error: null,
    }),
}))
