/**
 * Firebase Storage upload helpers for @voices/core.
 *
 * uploadFile — uploads a File or Blob to Firebase Storage and returns the
 *              public download URL. Supports an optional progress callback.
 *
 * generateStoragePath — constructs a deterministic, collision-resistant path
 *                        for a given asset type.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { getFirebaseStorage } from '../lib/firebase'

/**
 * Uploads a File or Blob to Firebase Storage.
 *
 * @param file       The file or blob to upload.
 * @param path       Destination path in the bucket, e.g. "stories/uid/audio.webm".
 * @param onProgress Optional callback receiving upload progress 0–100.
 * @returns          The public HTTPS download URL of the uploaded file.
 */
export function uploadFile(
  file: File | Blob,
  path: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storage = getFirebaseStorage()
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        }
      },
      reject,
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
      },
    )
  })
}

export type StorageAssetType =
  | 'story-audio'
  | 'story-image'
  | 'story-video'
  | 'profile-avatar'
  | 'playlist-cover'

/**
 * Generates a unique, namespaced storage path.
 *
 * Example:
 *   generateStoragePath('story-audio', 'uid123', 'webm')
 *   → "stories/uid123/audio_1716000000000.webm"
 */
export function generateStoragePath(
  type: StorageAssetType,
  uid: string,
  extension: string,
): string {
  const ts = Date.now()
  switch (type) {
    case 'story-audio':   return `stories/${uid}/audio_${ts}.${extension}`
    case 'story-image':   return `stories/${uid}/image_${ts}.${extension}`
    case 'story-video':   return `stories/${uid}/video_${ts}.${extension}`
    case 'profile-avatar': return `users/${uid}/avatar_${ts}.${extension}`
    case 'playlist-cover': return `playlists/${uid}/cover_${ts}.${extension}`
  }
}

/**
 * Extracts the file extension from a File object.
 * Falls back to 'bin' if no extension is detectable.
 */
export function getExtension(file: File): string {
  const parts = file.name.split('.')
  return parts.length > 1 ? (parts.at(-1) ?? 'bin') : 'bin'
}
