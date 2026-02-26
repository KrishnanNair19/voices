# Voices — Onboarding & Authentication Plan

> **Architect:** Senior Full-Stack Engineer
> **Date:** 2026-02-24
> **Scope:** `apps/mobile` + `packages/core` (auth layer)
> **Status:** Pre-implementation specification — no application code written yet

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Requirements](#2-data-requirements)
3. [Logic Flow — User Journey Map](#3-logic-flow--user-journey-map)
4. [Authentication Logic](#4-authentication-logic)
5. [Database Schema — Users Collection](#5-database-schema--users-collection)
6. [State Management Architecture](#6-state-management-architecture)
7. [Screen Inventory — Onboarding Flow](#7-screen-inventory--onboarding-flow)
8. [Security Considerations](#8-security-considerations)
9. [Implementation Phases](#9-implementation-phases)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

The onboarding flow has one job: get the user from zero to an authenticated, personalized session with the minimum possible friction. We achieve this via a **two-stage model**:

**Stage 1 — Authentication:** Establish identity (Firebase UID). This is a single screen with a primary SSO path and a secondary credential path. The user either taps one button (Google) or fills in a two-field form (email + password).

**Stage 2 — Progressive Profiling:** Collect the minimum data needed to make Voices functional (display name, username, permissions). Everything else — bio, avatar, interests — is optional and skippable. A user who skips every optional step still reaches the main app in under 60 seconds.

The wizard state is persisted to Firestore at each step so that an interrupted onboarding can be resumed on any device.

---

## 2. Data Requirements

### 2.1 Required at Authentication (collected by Firebase Auth, not by us)

These fields are populated automatically from the Firebase Auth provider. We read them, never write them directly.

| Field | Source | Notes |
|---|---|---|
| `uid` | Firebase Auth | Immutable. Primary key for `users/{uid}` document |
| `email` | Firebase Auth | Present for email/password + Google providers; null for phone-only |
| `phoneNumber` | Firebase Auth | Present for phone provider; null otherwise |
| `photoURL` | Firebase Auth (Google) | Google avatar URL; we offer the option to use it or replace it |
| `emailVerified` | Firebase Auth | `true` after email verification link clicked |

### 2.2 Required for Core App Functionality

Collected during onboarding. Cannot be skipped. App is gated until these are set.

| Field | Step Collected | Validation Rules |
|---|---|---|
| `displayName` | Step 1 — Identity | 2–50 chars; any Unicode; trimmed |
| `username` | Step 2 — Username | 3–20 chars; `[a-z0-9_]` only; unique across all users; checked against Firestore |
| `onboardingCompleted` | Final step | Boolean flag; set to `true` on wizard completion |
| `authProvider` | Auth screen | `'google' \| 'email' \| 'phone'` — primary provider used to create the account |

### 2.3 Permissions — Requested Contextually (Not During Onboarding)

Permissions are **never** requested during the onboarding wizard. They are requested the first time the user hits a screen that needs them, with an in-context explanation.

| Permission | When Requested | If Denied |
|---|---|---|
| Device location | First visit to `MainMapScreen` | Map shows a fallback view; geo-tagging unavailable until granted |
| Notifications | First visit to main app (first launch post-onboarding) | Notification prefs stored but push delivery disabled |
| Microphone | First tap of the record orb in `RecordHomeScreen` | Record flow shows an in-context rationale sheet; blocks recording |

### 2.4 Optional — Progressive Profile (Skippable)

Collected during onboarding or later in Edit Profile. The UI marks these as optional with a visible "Skip" affordance.

| Field | Step Collected | Default Value | Purpose |
|---|---|---|---|
| `bio` | Step 3 — Profile | `''` (empty string) | Shown on creator profile screen |
| `profileImageUrl` | Step 3 — Profile | `null` (shows initials avatar) | Profile and story card avatars |
| `preferredTags` | Step 4 — Interests | `[]` | Personalizes the Explore feed (future) |
| `notificationPrefs.newFollower` | Post-onboarding prompt | `true` | Push notification opt-in |
| `notificationPrefs.nearbyStory` | Post-onboarding prompt | `true` | Location-triggered story alerts |
| `notificationPrefs.playlistUpdate` | Post-onboarding prompt | `true` | Playlist activity alerts |

### 2.5 System-Managed Fields

Written by the app, never exposed as user-editable.

| Field | Type | Who Writes It | Notes |
|---|---|---|---|
| `createdAt` | `Timestamp` | Server (on first Firestore doc write) | Use `serverTimestamp()` |
| `updatedAt` | `Timestamp` | Client on every profile write | Use `serverTimestamp()` |
| `lastSeenAt` | `Timestamp` | Auth state listener on sign-in | Used for activity metrics |
| `onboardingStep` | `number` | Onboarding wizard | Enables cross-device resume |
| `linkedProviders` | `string[]` | After account linking | e.g., `['google.com', 'password']` |
| `followerCount` | `number` | Cloud Function (future) | Denormalized; increment only |
| `followingCount` | `number` | Cloud Function (future) | Denormalized; increment only |
| `storyCount` | `number` | Cloud Function (future) | Denormalized; increment on publish |
| `isAdmin` | `boolean` | Manual Firestore write | Never set from client code |

---

## 3. Logic Flow — User Journey Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                    │
│                                                                      │
│  onAuthStateChanged() fires immediately from Firebase Auth cache     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Firebase User present?   │
              └──────┬──────────┬─────────┘
                     │ NO       │ YES
                     ▼          ▼
         ┌───────────────┐  ┌─────────────────────────────────┐
         │ Landing Screen│  │  Fetch users/{uid} from Firestore│
         └───────────────┘  └────────────┬────────────────────┘
                                         │
                           ┌─────────────▼──────────────────┐
                           │  onboardingCompleted == true?   │
                           └──────┬───────────────┬──────────┘
                                  │ NO             │ YES
                                  ▼                ▼
                          ┌───────────────┐ ┌────────────┐
                          │Onboarding     │ │  Main App  │
                          │Wizard (resume │ │(TabNavigator│
                          │from saved     │ │)           │
                          │onboardingStep)│ └────────────┘
                          └───────────────┘
```

### 3.1 Landing Screen → Auth Decision

```
Landing Screen
├── "Continue with Google"  ───────►  [4.1 Google SSO Flow]
├── "Sign up with email"    ───────►  [4.2 Email Sign-Up Flow]
└── "Log in"                ───────►  [4.3 Email Log-In Flow]
```

### 3.2 Google SSO Flow (Primary Path — Happy Path)

```
User taps "Continue with Google"
    ↓
expo-auth-session / @react-native-google-signin triggers OS-level Google account picker
    ↓
User selects Google account
    ↓
ID token returned → signInWithCredential(GoogleAuthProvider.credential(idToken))
    ↓
Firebase Auth state updates → onAuthStateChanged fires
    ↓
Check if users/{uid} document exists in Firestore
    ├── Does NOT exist → Create stub document → Navigate to Onboarding Wizard (Step 1)
    └── Exists
        ├── onboardingCompleted == false → Resume Onboarding from saved onboardingStep
        └── onboardingCompleted == true  → Navigate to Main App
```

### 3.3 Email Sign-Up Flow (Fallback Path)

```
User taps "Sign up with email"
    ↓
EmailSignUpScreen
  Fields: Email, Password, Confirm Password
    ↓
Client-side validation:
  • Email: valid RFC 5322 format
  • Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
  • Confirm: must match password
    ↓
createUserWithEmailAndPassword(auth, email, password)
    ↓
sendEmailVerification(user)      ← fires magic link email
    ↓
Navigate to EmailVerificationPendingScreen
  • Shows: "We sent a link to user@example.com"
  • Polls user.reload() every 3 seconds
  • On emailVerified == true: auto-advance to Onboarding Wizard
  • Button: "Resend email" (disabled for 60s after each send)
  • Link: "Wrong email? Go back"
    ↓
Firebase Auth state updates → Onboarding Wizard (Step 1)
```

> **Why magic link over OTP code:** Firebase natively supports email magic links (`sendEmailVerification`). OTP-by-email requires a Cloud Function + email delivery service (Sendgrid etc.) with no Firebase SDK support. The polling screen eliminates the need to manually tap "I've verified" — the app detects verification automatically.

### 3.4 Email Log-In Flow (Returning Users)

```
User taps "Log in"
    ↓
EmailLoginScreen
  Fields: Email, Password
  Link: "Forgot password?"
    ↓
signInWithEmailAndPassword(auth, email, password)
    ↓
Firebase Auth state updates → post-auth routing:
  • onboardingCompleted == true  → Main App
  • onboardingCompleted == false → Onboarding Wizard (rare: incomplete signup)
```

### 3.5 Forgot Password Flow

```
User taps "Forgot password?" on EmailLoginScreen
    ↓
ForgotPasswordScreen
  Field: Email
    ↓
sendPasswordResetEmail(auth, email)
    ↓
Success banner: "Check your email for a reset link"
    ↓
Auto-navigate back to EmailLoginScreen after 3s
```

### 3.6 Onboarding Wizard — Step-by-Step

Each required step writes its data to Firestore before advancing (enables cross-device resume). Steps 3–4 are skippable and write only if the user provides data.

```
Step 0: Welcome (no write)
  └── Animated wordmark + tagline
  └── "Let's get started →"

Step 1: Display Name  [REQUIRED]
  └── Pre-filled with Google displayName or empty
  └── Input: Display Name (2–50 chars)
  └── "Next →"
  └── Writes: { displayName, onboardingStep: 1 }

Step 2: Username  [REQUIRED]
  └── Input: @username
  └── Real-time uniqueness check (debounced 400ms Firestore query)
  └── Inline indicator: checking… / ✓ available / ✗ taken
  └── "Next →" (disabled while taken or checking)
  └── Batched write: { username → users/{uid} } + { uid → usernames/{username} }
  └── Writes: { onboardingStep: 2 }

Step 3: Profile — Avatar & Bio  [OPTIONAL — skippable]
  └── Avatar: "Use Google Photo" (if provider == google) | initials avatar shown as default
  └── Avatar upload from library: POST-MVP — skipped for now
  └── Bio textarea (max 160 chars, char counter)
  └── "Next →" / "Skip"
  └── Writes: { profileImageUrl?, bio?, onboardingStep: 3 }

Step 4: Interests  [OPTIONAL — skippable]
  └── Tag chip grid: Music · History · Food · Nature · Urban · Stories
  └── User selects 0–6 tags
  └── "Done →" / "Skip"
  └── Writes: { preferredTags, onboardingCompleted: true, onboardingStep: 4 }
  └── Navigate → Main App (TabNavigator)
      └── On first visit to MainMapScreen → request location permission
      └── On first app launch → request notification permission
      └── On first tap of record orb → request microphone permission
```

### 3.7 Account Linking (Post-Authentication)

Users who signed up with email can link their Google account later via Profile > Settings. This is Phase 2+ and uses Firebase's `linkWithCredential()`. The `linkedProviders` array in the user document reflects all linked providers.

---

## 4. Authentication Logic

### 4.1 Firebase Auth as the Identity Layer

All identity management is delegated to Firebase Auth (project `
`voices-9a030`). We never store passwords. We never handle tokens directly. Firebase Auth provides:
- **Secure token issuance** — short-lived ID tokens (1 hour), long-lived refresh tokens
- **Session persistence** — handled by Firebase SDK (`AsyncStorage` on React Native via `initializeAuth` with `getReactNativePersistence`)
- **Provider abstraction** — same `uid` regardless of whether the user signed in with Google or email

### 4.2 Firebase SDK Initialization (in `packages/core`)

```typescript
// packages/core/src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.FIREBASE_APP_ID             ?? '',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// initializeAuth (not getAuth) is required on React Native for AsyncStorage persistence
export const auth    = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})
export const db      = getFirestore(app)
export const storage = getStorage(app)
```

> **Note:** `initializeAuth` must only be called once. On subsequent renders/imports, call `getAuth(app)` to retrieve the existing instance. The singleton guard (`getApps().length === 0`) handles the app init; auth init needs its own guard.

### 4.3 Google Sign-In (Mobile)

React Native cannot use Firebase's web-based `signInWithPopup`. We use `@react-native-google-signin/google-signin` to retrieve a native Google ID token, then exchange it with Firebase.

```typescript
// packages/core/src/lib/auth/googleSignIn.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { auth } from '../firebase'

GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID ?? '',  // From Google Cloud Console
})

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices()
  const { data } = await GoogleSignin.signIn()
  const credential = GoogleAuthProvider.credential(data?.idToken ?? '')
  return signInWithCredential(auth, credential)
}
```

### 4.4 Email/Password Sign-Up

```typescript
// packages/core/src/lib/auth/emailAuth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase'

export const signUpWithEmail = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await sendEmailVerification(cred.user)   // Non-blocking; fire and forget
  return cred
}

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const requestPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email)
```

### 4.5 Auth State Observer — The Bridge to Navigation

The `RootNavigator` subscribes to Firebase Auth state and drives the navigation stack. It replaces the current `useState(false)` placeholder.

```typescript
// packages/core/src/stores/authStore.ts (Zustand)
import { create } from 'zustand'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'onboarding'

interface AuthStore {
  user: User | null
  status: AuthStatus
  _setUser: (user: User | null) => void
  _setStatus: (status: AuthStatus) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: 'loading',
  _setUser: (user) => set({ user }),
  _setStatus: (status) => set({ status }),
  signOut: async () => {
    await auth.signOut()
    set({ user: null, status: 'unauthenticated' })
  },
}))

// Call once at app root (e.g., inside RootNavigator or a providers wrapper)
export function initAuthListener() {
  return onAuthStateChanged(auth, async (user) => {
    const { _setUser, _setStatus } = useAuthStore.getState()
    _setUser(user)

    if (!user) {
      _setStatus('unauthenticated')
      return
    }

    // Check onboarding completion in Firestore
    const { getDoc, doc } = await import('firebase/firestore')
    const { db } = await import('./lib/firebase')
    const snap = await getDoc(doc(db, 'users', user.uid))

    if (!snap.exists() || snap.data()?.onboardingCompleted !== true) {
      _setStatus('onboarding')
    } else {
      _setStatus('authenticated')
    }
  })
}
```

### 4.6 Post-Authentication User Document Creation

When a new user authenticates (any provider), we create a stub Firestore document immediately. This ensures the document always exists by the time the onboarding wizard tries to write to it.

```typescript
// packages/core/src/lib/auth/createUserDocument.ts
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { db } from '../firebase'

export async function createUserStub(user: User) {
  const ref = doc(db, 'users', user.uid)
  await setDoc(ref, {
    uid: user.uid,
    email: user.email ?? null,
    phoneNumber: user.phoneNumber ?? null,
    displayName: user.displayName ?? '',
    profileImageUrl: user.photoURL ?? null,
    authProvider: getProviderFromUser(user),
    linkedProviders: user.providerData.map((p) => p.providerId),
    onboardingCompleted: false,
    onboardingStep: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  }, { merge: true })  // merge: true prevents overwriting existing data on re-auth
}

function getProviderFromUser(user: User): 'google' | 'email' | 'phone' {
  const providers = user.providerData.map((p) => p.providerId)
  if (providers.includes('google.com')) return 'google'
  if (providers.includes('phone')) return 'phone'
  return 'email'
}
```

### 4.7 Error Handling Contract

Firebase Auth errors are typed. Each screen's controller maps them to user-friendly messages.

| Firebase Error Code | User-Facing Message |
|---|---|
| `auth/email-already-in-use` | "An account with this email already exists. Try logging in." |
| `auth/invalid-email` | "Please enter a valid email address." |
| `auth/weak-password` | "Password must be at least 8 characters." |
| `auth/user-not-found` | "No account found with this email." |
| `auth/wrong-password` | "Incorrect password. Forgot your password?" |
| `auth/too-many-requests` | "Too many attempts. Please wait a few minutes." |
| `auth/network-request-failed` | "No internet connection. Check your network and try again." |
| `auth/cancelled-popup-request` | (Silent — user cancelled the Google picker; no error shown) |

---

## 5. Database Schema — Users Collection

### 5.1 Firestore Document: `users/{uid}`

```
users/{uid}
│
├── IDENTITY (from Firebase Auth)
│   ├── uid: string                         // Firebase UID; also the document ID
│   ├── email: string | null                // null for phone-only accounts
│   ├── phoneNumber: string | null          // null for email/Google accounts
│   ├── authProvider: 'google' | 'email' | 'phone'
│   └── linkedProviders: string[]           // ['google.com', 'password'] etc.
│
├── PROFILE (from onboarding + editable)
│   ├── displayName: string                 // Human-readable name; shown in UI
│   ├── username: string                    // Unique handle; @mentions, URLs
│   ├── bio: string                         // Max 160 chars; defaults to ''
│   ├── profileImageUrl: string | null      // Cloud Storage URL; null = initials avatar
│   └── avatarProvider: 'google' | 'uploaded' | 'generated' | 'none'
│
├── ONBOARDING STATE
│   ├── onboardingCompleted: boolean        // Gate: false until wizard finishes
│   └── onboardingStep: number             // 0–6; allows cross-device resume
│
├── PERMISSIONS (stored for UX, not enforced here — OS handles enforcement)
│   ├── locationPermission: 'granted' | 'denied' | 'undetermined'
│   └── microphonePermission: 'granted' | 'denied' | 'undetermined'
│
├── PREFERENCES
│   ├── preferredTags: string[]             // from Interests step; e.g. ['music', 'history']
│   └── notificationPrefs: {
│       ├── newFollower: boolean            // default: true
│       ├── nearbyStory: boolean            // default: true
│       └── playlistUpdate: boolean         // default: true
│       }
│
├── SOCIAL GRAPH (denormalized counters — incremented by Cloud Functions in Phase 3+)
│   ├── followerCount: number               // default: 0
│   ├── followingCount: number              // default: 0
│   └── storyCount: number                 // default: 0
│
└── TIMESTAMPS
    ├── createdAt: Timestamp                // serverTimestamp() on doc creation
    ├── updatedAt: Timestamp                // serverTimestamp() on every write
    └── lastSeenAt: Timestamp              // serverTimestamp() on each sign-in
```

### 5.2 TypeScript Type (in `packages/core/src/types/user.ts`)

```typescript
import type { Timestamp } from 'firebase/firestore'

export type AuthProvider = 'google' | 'email' | 'phone'
export type PermissionStatus = 'granted' | 'denied' | 'undetermined'
export type AvatarProvider = 'google' | 'uploaded' | 'generated' | 'none'

export interface NotificationPreferences {
  newFollower: boolean
  nearbyStory: boolean
  playlistUpdate: boolean
}

export interface UserProfile {
  // Identity
  uid: string
  email: string | null
  phoneNumber: string | null
  authProvider: AuthProvider
  linkedProviders: string[]

  // Profile
  displayName: string
  username: string
  bio: string
  profileImageUrl: string | null
  avatarProvider: AvatarProvider

  // Onboarding
  onboardingCompleted: boolean
  onboardingStep: number

  // Permissions
  locationPermission: PermissionStatus
  microphonePermission: PermissionStatus

  // Preferences
  preferredTags: string[]
  notificationPrefs: NotificationPreferences

  // Social (denormalized)
  followerCount: number
  followingCount: number
  storyCount: number

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  lastSeenAt: Timestamp
}
```

### 5.3 Username Uniqueness Index

Firestore does not support unique constraints natively. We enforce username uniqueness via a separate lookup collection:

```
usernames/{username}
  └── uid: string     // The user who owns this username
```

**Write flow:**
1. Query `usernames/{desiredUsername}` — if it exists, show "Username taken"
2. Use a Firestore batched write to atomically:
   - Write `users/{uid}` with the new username
   - Write `usernames/{username}` → `{ uid }`

This prevents TOCTOU (time-of-check / time-of-use) race conditions between users picking the same username simultaneously.

### 5.4 Firestore Security Rules — Users Collection

```javascript
// firestore.rules (additions to upgrade-plan.md §7 rules)

match /users/{userId} {
  // Anyone can read a public profile
  allow read: if true;

  // Only the owner can write their own document
  allow write: if request.auth != null && request.auth.uid == userId;

  // Restrict which fields can be set on create vs update
  allow create: if request.auth.uid == userId
                && request.resource.data.uid == userId
                && !request.resource.data.keys().hasAny(['isAdmin', 'followerCount', 'storyCount']);

  allow update: if request.auth.uid == userId
                && !request.resource.data.diff(resource.data).affectedKeys()
                    .hasAny(['uid', 'createdAt', 'isAdmin', 'followerCount', 'storyCount']);
}

match /usernames/{username} {
  allow read: if true;
  allow write: if request.auth != null
               && request.resource.data.uid == request.auth.uid;
}
```

---

## 6. State Management Architecture

### 6.1 State Ownership Map

| State | Tool | Location | Rationale |
|---|---|---|---|
| Firebase `User` object | `useAuthStore` (Zustand) | `packages/core` | Shared between mobile and web |
| `UserProfile` (Firestore doc) | TanStack Query | `packages/core` | Cached, invalidated on write |
| Auth navigation status | `useAuthStore.status` | `packages/core` | Drives `RootNavigator` routing |
| Onboarding wizard progress | `useOnboardingStore` (Zustand) | `packages/core` or `apps/mobile` | Step tracking, draft data |
| Form field inputs | `useState` | Screen component | Local; no global state needed |
| Form validation errors | `useState` | Screen component | Local; cleared on field change |

### 6.2 `useAuthStore` — Global Auth State

Defined above in §4.5. Consumed by:
- `RootNavigator` — to determine which stack to show
- `UserProfileScreen` — to get `user.uid` for profile queries
- `useProfileController` — to read/write the current user's data
- Header components — to show the user's avatar

### 6.3 `useOnboardingStore` — Wizard State Machine

```typescript
// packages/core/src/stores/onboardingStore.ts
import { create } from 'zustand'

export type OnboardingStep = 0 | 1 | 2 | 3 | 4
export const ONBOARDING_STEPS = 4

interface OnboardingDraft {
  displayName: string
  username: string
  bio: string
  profileImageUrl: string | null   // Google photo URL or null (upload is post-MVP)
  preferredTags: string[]
}

interface OnboardingStore {
  currentStep: OnboardingStep
  draft: OnboardingDraft
  isSubmitting: boolean
  error: string | null

  // Actions
  setStep: (step: OnboardingStep) => void
  nextStep: () => void
  updateDraft: (partial: Partial<OnboardingDraft>) => void
  setSubmitting: (v: boolean) => void
  setError: (msg: string | null) => void
  reset: () => void
}

const defaultDraft: OnboardingDraft = {
  displayName: '',
  username: '',
  bio: '',
  profileImageUrl: null,
  preferredTags: [],
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 0,
  draft: defaultDraft,
  isSubmitting: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({
    currentStep: Math.min(ONBOARDING_STEPS, s.currentStep + 1) as OnboardingStep
  })),
  updateDraft: (partial) => set((s) => ({ draft: { ...s.draft, ...partial } })),
  setSubmitting: (v) => set({ isSubmitting: v }),
  setError: (msg) => set({ error: msg }),
  reset: () => set({ currentStep: 0, draft: defaultDraft, isSubmitting: false, error: null }),
}))
```

### 6.4 TanStack Query — `useUserProfile` Hook

```typescript
// packages/core/src/hooks/useUserProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { userProfileConverter } from '../lib/converters'
import type { UserProfile } from '../types/user'

export function useUserProfile(uid: string | null) {
  return useQuery({
    queryKey: ['userProfile', uid],
    queryFn: async () => {
      if (!uid) return null
      const snap = await getDoc(
        doc(db, 'users', uid).withConverter(userProfileConverter)
      )
      return snap.exists() ? snap.data() : null
    },
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,  // 5-minute cache
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uid,
      updates,
    }: {
      uid: string
      updates: Partial<UserProfile>
    }) => {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', uid] })
    },
  })
}
```

### 6.5 `RootNavigator` — Updated Routing Logic

The current `RootNavigator` uses `useState(false)`. After Phase 1, it becomes:

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore, initAuthListener } from '@voices/core'
import TabNavigator from './TabNavigator'
import RecordStack from './RecordStack'
import AuthStack from './AuthStack'             // New: Landing + Email screens
import OnboardingStack from './OnboardingStack' // New: Wizard steps

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    const unsubscribe = initAuthListener()
    return unsubscribe
  }, [])

  if (status === 'loading') {
    return <SplashScreen />  // Show branded splash while checking auth state
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'unauthenticated' && (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
        {status === 'onboarding' && (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        )}
        {status === 'authenticated' && (
          <>
            <Stack.Screen name="MainApp" component={TabNavigator} />
            <Stack.Screen
              name="RecordModal"
              component={RecordStack}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### 6.6 Onboarding Persistence — Cross-Device Resume

At each wizard step completion, we write `onboardingStep` to Firestore. When the `initAuthListener` fires on a new device/session and finds `onboardingCompleted == false`, it reads `onboardingStep` and sets `useOnboardingStore.currentStep` to resume where the user left off.

```typescript
// In initAuthListener, after determining status === 'onboarding':
const stepFromFirestore = snap.data()?.onboardingStep ?? 0
useOnboardingStore.getState().setStep(stepFromFirestore)
```

---

## 7. Screen Inventory — Onboarding Flow

All screens in the Auth and Onboarding stacks. These are the deliverables for Phase 1 implementation.

| Screen File | Stack | Step | Input | Output |
|---|---|---|---|---|
| `LandingScreen.tsx` | Auth | — | None | Google auth trigger; nav to EmailSignUp / EmailLogin |
| `EmailSignUpScreen.tsx` | Auth | — | Email, Password, Confirm | `createUserWithEmailAndPassword` + `sendEmailVerification` |
| `EmailVerificationPendingScreen.tsx` | Auth | — | None (polls `user.reload()`) | Auto-advance when `emailVerified == true` |
| `EmailLoginScreen.tsx` | Auth | — | Email, Password | `signInWithEmailAndPassword` |
| `ForgotPasswordScreen.tsx` | Auth | — | Email | `sendPasswordResetEmail` |
| `OnboardingWelcomeScreen.tsx` | Onboarding | Step 0 | None | Advances to Step 1 |
| `OnboardingIdentityScreen.tsx` | Onboarding | Step 1 | Display Name | Writes `{ displayName }` to Firestore |
| `OnboardingUsernameScreen.tsx` | Onboarding | Step 2 | @username | Uniqueness check; batched write to `users/` + `usernames/` |
| `OnboardingProfileScreen.tsx` | Onboarding | Step 3 (skip) | Avatar choice + Bio | Writes `{ profileImageUrl?, bio? }` to Firestore |
| `OnboardingInterestsScreen.tsx` | Onboarding | Step 4 (skip) | Tag chips | Writes `{ preferredTags, onboardingCompleted: true }` → Main App |

### Controller Files

| Controller | Screens It Serves |
|---|---|
| `useAuthController.ts` | LandingScreen, EmailSignUpScreen, EmailVerificationPendingScreen, EmailLoginScreen, ForgotPasswordScreen |
| `useOnboardingController.ts` | All OnboardingX screens (reads/writes store + Firestore) |

---

## 8. Security Considerations

### 8.1 Credential Storage

- **Never** store email/password in Zustand or AsyncStorage — Firebase Auth SDK handles session tokens securely via its own `AsyncStorage` key namespace
- Refresh tokens are handled entirely by Firebase SDK — we never see or store them

### 8.2 Username Race Conditions

Handled via the dual-collection write (§5.3). The `usernames/` collection acts as a reservation system. Firestore Security Rules ensure only the authenticated user can write a username entry pointing to their own UID.

### 8.3 Email Verification Gate

**Method:** Magic link via `sendEmailVerification()` (Firebase Auth SDK). See §3.3 for the rationale over OTP-by-email.

**Flow gate:** Email users cannot advance past `EmailVerificationPendingScreen` until `user.emailVerified == true`. The screen polls `user.reload()` every 3 seconds. Google users bypass this entirely — Google accounts are implicitly verified.

**In-app gate:** Publishing a story additionally checks `auth.currentUser?.emailVerified` in `useRecordController.ts`. If false (edge case — token could be stale), it calls `user.reload()` before re-checking. This covers the case where a user somehow bypasses the pending screen.

### 8.4 Input Sanitisation

| Input | Sanitisation |
|---|---|
| `displayName` | `trim()` both ends; max 50 chars enforced client-side and in Firestore rules |
| `username` | Lowercased + `/[^a-z0-9_]/g` stripped before submission |
| `bio` | `trim()`; max 160 chars; no HTML parsing needed (rendered as plain text) |
| `email` | Validated by Firebase Auth before reaching Firestore |

### 8.5 Rate Limiting

Firebase Auth enforces its own rate limits on `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`. For the username uniqueness check (a Firestore read), debounce the input handler by 400ms to avoid unnecessary reads on every keystroke.

---

## 9. Implementation Phases

### Phase 1a — Core Auth Infrastructure (packages/core)

- [ ] `packages/core/src/lib/firebase.ts` — add `initializeAuth` with `AsyncStorage` persistence
- [ ] `packages/core/src/lib/auth/googleSignIn.ts` — Google sign-in helper
- [ ] `packages/core/src/lib/auth/emailAuth.ts` — email sign-up / sign-in / reset helpers
- [ ] `packages/core/src/lib/auth/createUserDocument.ts` — stub document creation
- [ ] `packages/core/src/stores/authStore.ts` — Zustand auth store + `initAuthListener`
- [ ] `packages/core/src/stores/onboardingStore.ts` — onboarding wizard state
- [ ] `packages/core/src/hooks/useUserProfile.ts` — TanStack Query hook
- [ ] `packages/core/src/types/user.ts` — updated `UserProfile` interface (this doc's schema)
- [ ] `packages/core/src/lib/converters.ts` — add `userProfileConverter`
- [ ] Unit tests for auth helpers using MSW + Firebase emulator

### Phase 1b — Auth Screens (apps/mobile)

- [ ] `apps/mobile/src/screens/Auth/LandingScreen.tsx` — wordmark + Google button + email options
- [ ] `apps/mobile/src/screens/Auth/EmailSignUpScreen.tsx` — form with validation
- [ ] `apps/mobile/src/screens/Auth/EmailLoginScreen.tsx` — form + forgot password link
- [ ] `apps/mobile/src/screens/Auth/ForgotPasswordScreen.tsx` — email field + success banner
- [ ] `apps/mobile/src/screens/Auth/useAuthController.ts` — controller for all auth screens
- [ ] `apps/mobile/src/navigation/AuthStack.tsx` — stack navigator for auth screens
- [ ] Update `RootNavigator.tsx` to use `useAuthStore.status`

### Phase 1c — Onboarding Wizard (apps/mobile)

- [ ] `apps/mobile/src/screens/Onboarding/OnboardingWelcomeScreen.tsx` — Step 0: animated wordmark
- [ ] `apps/mobile/src/screens/Onboarding/OnboardingIdentityScreen.tsx` — Step 1: display name (required)
- [ ] `apps/mobile/src/screens/Onboarding/OnboardingUsernameScreen.tsx` — Step 2: @username, real-time uniqueness check (required)
- [ ] `apps/mobile/src/screens/Onboarding/OnboardingProfileScreen.tsx` — Step 3: Google photo option + bio (skippable)
- [ ] `apps/mobile/src/screens/Onboarding/OnboardingInterestsScreen.tsx` — Step 4: tag chips; completion writes `onboardingCompleted: true` (skippable)
- [ ] `apps/mobile/src/screens/Onboarding/useOnboardingController.ts`
- [ ] `apps/mobile/src/navigation/OnboardingStack.tsx`
- [ ] `OnboardingProgressDots` component — shared across Steps 1–4

### Phase 1d — Firestore Rules & Indexes

- [ ] Deploy updated `firestore.rules` (§5.4 above)
- [ ] Create `usernames` collection + composite indexes if needed
- [ ] Test rules with Firebase Emulator Suite

---

## 10. Decisions Log

All open questions from the initial draft have been resolved.

| # | Question | Decision |
|---|---|---|
| OQ1 | Phone auth required? | **No.** Email + Google only. |
| OQ2 | Apple Sign-In? | **No.** Not publishing to App Store currently; defer indefinitely. |
| OQ3 | Username mutability? | **Immutable after set** for now. Add mutability (with `usernames/` migration) in a future phase. |
| OQ4 | Email verification method? | **Magic link** (`sendEmailVerification`). In-app polling screen detects verification automatically. OTP-by-email deferred (requires Cloud Function + email service). |
| OQ5 | Onboarding steps required vs skippable? | **Steps 1–2 are required gates** (displayName + username). Steps 3–4 are skippable. |
| OQ6 | Avatar upload in onboarding? | **Post-MVP.** Step 3 offers "Use Google Photo" for Google users; all others get initials avatar. Upload from library deferred. |

---

*This document supersedes the auth references in `upgrade-plan.md §7` and `phase-2-mobile-planning.md §Flow A`. Implementation should follow the phases in §9 in order.*
