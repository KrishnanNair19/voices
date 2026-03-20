/**
 * Google Sign-In for web (browser) environments.
 *
 * Uses Firebase's signInWithPopup — browser-only API.
 * Mobile apps should use @react-native-google-signin instead.
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential,
} from 'firebase/auth'
import { getFirebaseAuth } from '../firebase'

/**
 * Opens a Google Sign-In popup and returns the Firebase credential.
 * Throws a Firebase AuthError on failure or if the user closes the popup.
 */
export async function signInWithGooglePopup(): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  return signInWithPopup(auth, provider)
}
