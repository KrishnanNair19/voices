/**
 * Firebase configuration for the web SDK (used via @voices/core).
 *
 * Env vars must be prefixed with EXPO_PUBLIC_ to be inlined into the JS bundle.
 * Create apps/mobile/.env (or .env.local) with:
 *
 *   EXPO_PUBLIC_FIREBASE_API_KEY=...
 *   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
 *   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
 *   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
 *   EXPO_PUBLIC_FIREBASE_APP_ID=...
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
 *
 * Copy the values from apps/mobile/settings/.env — they are the same values.
 */

import type { FirebaseConfig } from '@voices/core'

export const firebaseConfig: FirebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '',
}

export const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
