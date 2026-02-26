export interface Playlist {
  id: string
  title: string
  description?: string
  coverImageUrl?: string
  ownerId: string
  storyIds: string[]
  isPublic: boolean
  /** True for app-managed playlists — disables edit/delete in UI. */
  isCurated: boolean
  createdAt: number
}
