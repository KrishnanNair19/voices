/**
 * Google Sign-In helper for apps/mobile.
 *
 * Uses @react-native-google-signin/google-signin to obtain a native Google ID
 * token, then exchanges it with Firebase via signInWithCredential.
 *
 * Setup requirements:
 *   1. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID set in apps/mobile/.env
 *   2. GoogleService-Info.plist (iOS) and google-services.json (Android) in place
 *   3. After adding the package: cd apps/mobile/ios && pod install
 */

import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { getFirebaseAuth } from '@voices/core'
import { googleWebClientId } from '@/lib/firebaseConfig'

// Configure once at module load. Safe to call multiple times.
GoogleSignin.configure({
  webClientId: googleWebClientId,
})

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google Sign-In cancelled by user')
    this.name = 'GoogleSignInCancelledError'
  }
}

/**
 * Triggers the native Google account picker, then signs into Firebase.
 * Throws GoogleSignInCancelledError if the user dismisses the picker.
 * Throws a standard Error with a user-facing message for other failures.
 */
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

  const response = await GoogleSignin.signIn()

  if (!isSuccessResponse(response)) {
    throw new GoogleSignInCancelledError()
  }

  const idToken = response.data.idToken
  if (!idToken) {
    throw new Error('Google Sign-In failed: no ID token returned.')
  }

  const credential = GoogleAuthProvider.credential(idToken)
  return signInWithCredential(getFirebaseAuth(), credential)
}

/**
 * Maps Google Sign-In status codes to user-facing messages.
 */
export function getGoogleSignInErrorMessage(error: unknown): string | null {
  if (error instanceof GoogleSignInCancelledError) {
    return null // Silent — user chose to cancel
  }
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services are not available on this device.'
      case statusCodes.IN_PROGRESS:
        return null // Already signing in — ignore
      default:
        return 'Google Sign-In failed. Please try again.'
    }
  }
  return 'Google Sign-In failed. Please try again.'
}
