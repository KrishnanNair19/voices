/**
 * Firebase initialisation for @voices/core.
 *
 * Design: packages/core does NOT call initializeApp() automatically.
 * Instead, each app calls initFirebase(config) at startup:
 *
 *   - apps/mobile calls initFirebase(config) then initializeAuth(getFirebaseApp(), { persistence: ... })
 *     before importing anything that uses getFirebaseAuth().
 *   - apps/web calls initFirebase(config) and Firebase uses default browser persistence.
 *
 * All core modules use the lazy getters (getDb, getFirebaseAuth, getFirebaseStorage)
 * so they never fail at import time — only at call time if init was skipped.
 */

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage' 

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

/**
 * Initialise Firebase. Call this once at the top of each app's entry point,
 * before any other Firebase usage. Safe to call multiple times — idempotent.
 */
export function initFirebase(
  config: FirebaseConfig, 
  useEmulator: boolean = false,
  emulatorHost: string = '127.0.0.1' // Default to localhost, but mobile will pass Mac IP
): FirebaseApp {
  const apps = getApps()
  
  if (apps.length === 0) {
    const app = initializeApp(config)
    
    if (useEmulator) {
      // 1. Firestore Emulator
      const db = getFirestore(app)
      connectFirestoreEmulator(db, emulatorHost, 8080)
      
      // 2. Auth Emulator (Requires http:// prefix)
      const auth = getAuth(app)
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`)
      
      // 3. Storage Emulator
      const storage = getStorage(app)
      connectStorageEmulator(storage, emulatorHost, 9199)
      
      console.log(`🛠️ Firebase Emulators connected to ${emulatorHost}`)
    }
    
    return app
  }
  
  return getApp()
}

/**
 * Returns the already-initialised Firebase app.
 * Throws if initFirebase() was never called.
 */
export function getFirebaseApp(): FirebaseApp {
  const apps = getApps()
  if (apps.length === 0) {
    throw new Error(
      '[voices/core] Firebase not initialised. ' +
      'Call initFirebase(config) at app startup before using any Firebase features.',
    )
  }
  return getApp()
}

/** Lazy Firestore getter — returns the same singleton on repeated calls. */
export function getDb(): Firestore {
  return getFirestore(getFirebaseApp())
}

/**
 * Lazy Auth getter.
 *
 * On React Native, apps/mobile must call:
 *   initializeAuth(getFirebaseApp(), { persistence: getReactNativePersistence(AsyncStorage) })
 * BEFORE this getter is first invoked — otherwise Firebase falls back to in-memory persistence.
 */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp())
}

/** Lazy Storage getter. */
export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}

