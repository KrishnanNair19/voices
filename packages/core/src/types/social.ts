// ── Follow ────────────────────────────────────────────────────────────────────

/**
 * Represents a directional follow relationship between two users.
 * Stored at: follows/{followerId}__{followedId}
 */
export interface Follow {
  followerId: string
  followedId: string
  createdAt: number // Unix timestamp ms
}

// ── Comment ───────────────────────────────────────────────────────────────────

/**
 * A comment on a story.
 * Stored at: stories/{storyId}/comments/{commentId}
 */
export interface Comment {
  id: string
  storyId: string
  authorId: string
  text: string
  createdAt: number // Unix timestamp ms
}
