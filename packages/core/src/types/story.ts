export interface GeoPoint {
  lat: number
  lng: number
}

export interface Story {
  id: string
  title: string
  description: string
  audioUrl: string
  transcriptUrl?: string
  coverImageUrl?: string
  location: GeoPoint
  locationName?: string
  /** City/region bucket, e.g. "Barcelona" — used for city filter in Explore. */
  locationRegion?: string
  tags: string[]
  authorId: string
  durationMs: number
  isPublic: boolean
  playCount: number
  createdAt: number // Unix timestamp ms — avoids Firestore Timestamp import in core Phase 0
  updatedAt: number
}
