export interface GeoPoint {
  lat: number
  lng: number
}

// ── Content types ─────────────────────────────────────────────────────────────

/** The primary media format of a story. */
export type StoryContentType = 'audio' | 'text' | 'image' | 'video' | 'mixed'

// ── Story ─────────────────────────────────────────────────────────────────────

export interface Story {
  id: string
  title: string
  description: string
  contentType: StoryContentType
  /** Present for 'audio' and 'mixed' stories. */
  audioUrl?: string
  /** Present for 'text' and 'mixed' stories — rich-text HTML string. */
  textContent?: string
  /** Present for 'image' and 'mixed' stories — ordered array of Storage URLs. */
  mediaUrls?: string[]
  /** Present for 'video' stories. */
  videoUrl?: string
  /** Auto-extracted video thumbnail or manually chosen cover image. */
  thumbnailUrl?: string
  transcriptUrl?: string
  coverImageUrl?: string
  location: GeoPoint
  locationName?: string
  /** City/region bucket, e.g. "Barcelona" — used for city filter in Explore. */
  locationRegion?: string
  tags: string[]
  authorId: string
  /** Duration in ms — relevant for audio/video stories. */
  durationMs?: number
  /** Approximate word count — relevant for text stories. */
  wordCount?: number
  isPublic: boolean
  playCount: number
  likeCount: number
  commentCount: number
  createdAt: number // Unix timestamp ms
  updatedAt: number
}

// ── StoryDraft ────────────────────────────────────────────────────────────────

/**
 * In-progress upload state, held in useUploadStore across wizard steps.
 * File/Blob types are web-native; on mobile, convert a URI to Blob via fetch().
 */
export interface StoryDraft {
  contentType: StoryContentType
  /** Raw recorded audio (web MediaRecorder output). */
  audioBlob?: Blob
  textContent?: string
  /** Ordered image files for image/mixed stories. */
  mediaFiles?: File[]
  videoFile?: File
  title: string
  description: string
  tags: string[]
  location?: GeoPoint
  locationName?: string
  isPublic: boolean
}
