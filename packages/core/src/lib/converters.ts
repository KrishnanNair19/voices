/**
 * Typed Firestore data converters for @voices/core.
 *
 * Each converter ensures the TypeScript type and the Firestore document shape
 * stay in sync at the boundary. Both apps import the same converters, so the
 * same runtime shape guarantee applies everywhere.
 *
 * Usage:
 *   const ref = doc(db, 'users', uid).withConverter(userProfileConverter)
 *   const snap = await getDoc(ref)
 *   const profile = snap.data()  // typed as UserProfile
 */

import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
} from 'firebase/firestore'
import type { Story } from '../types/story'
import type { UserProfile } from '../types/user'
import type { Playlist } from '../types/playlist'
import type { Comment } from '../types/social'

// ── UserProfile converter ─────────────────────────────────────────────────────

export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore(profile: UserProfile): DocumentData {
    // Omit uid from the stored document — it's the document ID, not a field.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { uid, ...rest } = profile
    return rest
  },

  fromFirestore(
    snap: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): UserProfile {
    const data = snap.data(options)
    return {
      uid: snap.id,
      email: data['email'] ?? null,
      authProvider: data['authProvider'] ?? 'email',
      linkedProviders: data['linkedProviders'] ?? [],
      displayName: data['displayName'] ?? '',
      username: data['username'] ?? '',
      bio: data['bio'] ?? '',
      profileImageUrl: data['profileImageUrl'] ?? null,
      avatarProvider: data['avatarProvider'] ?? 'none',
      onboardingCompleted: data['onboardingCompleted'] ?? false,
      onboardingStep: data['onboardingStep'] ?? 0,
      locationPermission: data['locationPermission'] ?? 'undetermined',
      microphonePermission: data['microphonePermission'] ?? 'undetermined',
      preferredTags: data['preferredTags'] ?? [],
      notificationPrefs: data['notificationPrefs'] ?? {
        newFollower: true,
        nearbyStory: true,
        playlistUpdate: true,
      },
      followerCount: data['followerCount'] ?? 0,
      followingCount: data['followingCount'] ?? 0,
      storyCount: data['storyCount'] ?? 0,
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt'],
      lastSeenAt: data['lastSeenAt'],
    } satisfies UserProfile
  },
}

// ── Story converter ───────────────────────────────────────────────────────────

export const storyConverter: FirestoreDataConverter<Story> = {
  toFirestore(story: Story): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = story
    return rest
  },

  fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): Story {
    const data = snap.data(options)
    return {
      id: snap.id,
      contentType: data['contentType'] ?? 'audio',
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      // Optional media fields — only include when present in Firestore
      audioUrl: data['audioUrl'],
      textContent: data['textContent'],
      mediaUrls: data['mediaUrls'],
      videoUrl: data['videoUrl'],
      thumbnailUrl: data['thumbnailUrl'],
      transcriptUrl: data['transcriptUrl'],
      coverImageUrl: data['coverImageUrl'],
      location: data['location'] ?? { lat: 0, lng: 0 },
      locationName: data['locationName'],
      locationRegion: data['locationRegion'],
      tags: data['tags'] ?? [],
      authorId: data['authorId'] ?? '',
      durationMs: data['durationMs'],
      wordCount: data['wordCount'],
      isPublic: data['isPublic'] ?? false,
      playCount: data['playCount'] ?? 0,
      likeCount: data['likeCount'] ?? 0,
      commentCount: data['commentCount'] ?? 0,
      createdAt: data['createdAt'] ?? 0,
      updatedAt: data['updatedAt'] ?? 0,
    } satisfies Story
  },
}

// ── Playlist converter ────────────────────────────────────────────────────────

export const playlistConverter: FirestoreDataConverter<Playlist> = {
  toFirestore(playlist: Playlist): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = playlist
    return rest
  },

  fromFirestore(
    snap: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): Playlist {
    const data = snap.data(options)
    return {
      id: snap.id,
      title: data['title'] ?? '',
      description: data['description'],
      coverImageUrl: data['coverImageUrl'],
      ownerId: data['ownerId'] ?? '',
      storyIds: data['storyIds'] ?? [],
      isPublic: data['isPublic'] ?? false,
      isCurated: data['isCurated'] ?? false,
      createdAt: data['createdAt'] ?? 0,
    } satisfies Playlist
  },
}

// ── Comment converter ─────────────────────────────────────────────────────────

export const commentConverter: FirestoreDataConverter<Comment> = {
  toFirestore(comment: Comment): DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = comment
    return rest
  },

  fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): Comment {
    const data = snap.data(options)
    return {
      id: snap.id,
      storyId: data['storyId'] ?? '',
      authorId: data['authorId'] ?? '',
      text: data['text'] ?? '',
      createdAt: data['createdAt'] ?? 0,
    } satisfies Comment
  },
}
