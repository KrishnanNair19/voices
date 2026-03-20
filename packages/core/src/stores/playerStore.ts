/**
 * Global audio/video player state.
 *
 * Holds *what* is playing and the playback position.
 * The *how* (actual audio decoding) is platform-specific:
 *   - Web:    useWebAudio hook in apps/web (Web Audio API)
 *   - Mobile: AudioPlayer component in apps/mobile (expo-av)
 * Both subscribe to this store via usePlayerStore() and drive
 * their platform's playback engine accordingly.
 *
 * Usage:
 *   const { play, pause, isPlaying } = usePlayerStore()
 *   play('story-id-123')
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerStore {
  /** The story currently loaded in the player, or null when idle. */
  activeStoryId: string | null
  isPlaying: boolean
  /** Current playback position in milliseconds. */
  currentTimeMs: number
  /** Total duration of the active story in milliseconds. */
  durationMs: number

  /** Load and begin playing a story. If the same story is passed while
   *  playing, it resumes from the current position. */
  play: (storyId: string) => void
  pause: () => void
  /** Seek to a specific position. Does not resume playback. */
  seek: (ms: number) => void
  /** Update current playback time (called by the platform audio engine). */
  setCurrentTime: (ms: number) => void
  /** Set total duration once the audio has loaded. */
  setDuration: (ms: number) => void
  /** Stop playback and clear the active story. */
  reset: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    activeStoryId: null,
    isPlaying: false,
    currentTimeMs: 0,
    durationMs: 0,

    play: (storyId) => {
      const current = get().activeStoryId
      if (current === storyId) {
        // Resume existing story
        set({ isPlaying: true })
      } else {
        // New story — reset position and load
        set({ activeStoryId: storyId, isPlaying: true, currentTimeMs: 0, durationMs: 0 })
      }
    },

    pause: () => set({ isPlaying: false }),

    seek: (ms) => set({ currentTimeMs: ms }),

    setCurrentTime: (ms) => set({ currentTimeMs: ms }),

    setDuration: (ms) => set({ durationMs: ms }),

    reset: () =>
      set({ activeStoryId: null, isPlaying: false, currentTimeMs: 0, durationMs: 0 }),
  })),
)
