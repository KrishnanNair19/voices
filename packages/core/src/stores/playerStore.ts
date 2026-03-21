/**
 * Global audio/video player state.
 *
 * Holds *what* is playing and the playback position.
 * The *how* (actual audio decoding) is platform-specific:
 *   - Web:    MiniPlayer component in apps/web (HTMLAudioElement)
 *   - Mobile: AudioPlayer component in apps/mobile (expo-av)
 * Both subscribe to this store via usePlayerStore() and drive
 * their platform's playback engine accordingly.
 *
 * Usage:
 *   const { play, pause, isPlaying } = usePlayerStore()
 *   play('story-id-123')
 *
 *   // Queue support:
 *   playQueue(['id-1', 'id-2', 'id-3'], 0) // play from first item
 *   nextInQueue()  // advance to next story
 *   prevInQueue()  // go back to previous story
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
  /** Ordered list of story IDs in the current play queue. */
  queue: string[]
  /** Index of the currently playing story within the queue. */
  queueIndex: number

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
  /** Stop playback and clear the active story and queue. */
  reset: () => void
  /** Load an ordered list of story IDs and start playing from startIndex. */
  playQueue: (storyIds: string[], startIndex?: number) => void
  /** Advance to the next story in the queue, if any. */
  nextInQueue: () => void
  /** Go back to the previous story in the queue, if any. */
  prevInQueue: () => void
  /** Add a story to the end of the queue.
   *  If nothing is playing, starts playing the story immediately
   *  (only if it is not already in the queue).
   *  If already playing, appends the story to the queue without
   *  changing the currently active story or queueIndex. */
  addToQueue: (storyId: string) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    activeStoryId: null,
    isPlaying: false,
    currentTimeMs: 0,
    durationMs: 0,
    queue: [],
    queueIndex: 0,

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
      set({
        activeStoryId: null,
        isPlaying: false,
        currentTimeMs: 0,
        durationMs: 0,
        queue: [],
        queueIndex: 0,
      }),

    playQueue: (storyIds, startIndex = 0) => {
      if (storyIds.length === 0) return
      const idx = Math.max(0, Math.min(startIndex, storyIds.length - 1))
      const storyId = storyIds[idx]
      if (!storyId) return
      set({ queue: storyIds, queueIndex: idx })
      get().play(storyId)
    },

    nextInQueue: () => {
      const { queue, queueIndex } = get()
      if (queueIndex < queue.length - 1) {
        const newIndex = queueIndex + 1
        const storyId = queue[newIndex]
        if (!storyId) return
        set({ queueIndex: newIndex })
        get().play(storyId)
      }
    },

    prevInQueue: () => {
      const { queue, queueIndex } = get()
      if (queueIndex > 0) {
        const newIndex = queueIndex - 1
        const storyId = queue[newIndex]
        if (!storyId) return
        set({ queueIndex: newIndex })
        get().play(storyId)
      }
    },

    addToQueue: (storyId) => {
      const { activeStoryId, queue } = get()
      if (activeStoryId === null) {
        // Nothing is playing — start playing only if not already queued
        if (!queue.includes(storyId)) {
          get().playQueue([storyId], 0)
        }
      } else {
        // Already playing — append to end of queue (duplicates allowed by design)
        set({ queue: [...queue, storyId] })
      }
    },
  })),
)
