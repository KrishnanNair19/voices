# Voices — Migration & Upgrade Plan

> **Source:** `/OldVoices` (React Native / Expo, JS-only, no tests, mobile-only)
> **Target:** `/Voices` (Turborepo monorepo — Expo mobile app + Vite web app + shared core)
> **Date:** 2026-02-18

---

## Table of Contents

1. [Audit Summary](#1-audit-summary)
2. [Architecture Decision: Turborepo Monorepo](#2-architecture-decision-turborepo-monorepo)
3. [Dependency Audit Table](#3-dependency-audit-table)
4. [Build Tooling](#4-build-tooling)
5. [TypeScript Migration Strategy](#5-typescript-migration-strategy)
6. [UI/UX Framework — Platform-Split Strategy](#6-uiux-framework--platform-split-strategy)
7. [Backend & Data — GCP / Firebase Strategy](#7-backend--data--gcp--firebase-strategy)
8. [State Management Architecture](#8-state-management-architecture)
9. [Monorepo Directory Structure](#9-monorepo-directory-structure)
10. [Performance & SEO](#10-performance--seo)
11. [Testing Strategy](#11-testing-strategy)
12. [Migration Phases](#12-migration-phases)
13. [Security Remediation](#13-security-remediation)

---

## 1. Audit Summary

### What OldVoices Is
A **React Native / Expo mobile app** (SDK 40) — users record geo-tagged audio stories, browse them on a map, and organize playlists. Pure JavaScript, no tests, no TypeScript.

### Critical Findings

| Category | Current State | Severity |
|---|---|---|
| React version | 16.13.1 | High |
| Expo SDK | ~40.0.0 (current: 52) | High |
| TypeScript | None — pure JavaScript | High |
| State management | Scattered `useState` only | Medium |
| Testing | Zero test files | High |
| Firebase SDK | 7.9.0 (pre-modular, deprecated) | High |
| Firebase credentials | Hardcoded in `firebase.js` | **Critical** |
| Navigation | React Navigation 5 (current: 6) | Medium |
| MUI version | @material-ui/core v4 | High |
| Code splitting | None | Medium |
| Error boundaries | None | Medium |

### What to Preserve
- Feature set: record → tag → map → playlist → listen
- Design language: teal `#1ddbb5` / warm yellow `#FDF0AF` from `Themes/Colors.js`
- Firebase project `voices-9a030` (after credential rotation)
- Component decomposition philosophy — Screens / Components / Navigation is the right instinct

---

## 2. Architecture Decision: Turborepo Monorepo

### Structure

```
voices/
├── apps/
│   ├── mobile/          ← Expo SDK 52 (iOS + Android)
│   └── web/             ← Vite 6 + React 18 (browser)
└── packages/
    └── core/            ← Shared: types, Firebase, TanStack Query, Zustand, utils
```

### What Lives Where

| Layer | `apps/mobile` | `apps/web` | `packages/core` |
|---|---|---|---|
| Build tooling | Expo / Metro | Vite 6 | tsup (library build) |
| UI components | React Native Paper | MUI v6 + Emotion | — |
| Navigation | React Navigation 6 | React Router v6 | — |
| Routing | Expo Router | React Router | — |
| Styling | NativeWind / RN StyleSheet | Emotion `styled()` + `sx` | Design tokens only |
| Audio | `expo-av` | Web Audio API | — |
| Maps | `react-native-maps` | `@vis.gl/react-google-maps` | — |
| **Auth** | — | — | Firebase Auth hooks |
| **Data fetching** | — | — | TanStack Query + Firestore |
| **Global state** | — | — | Zustand stores |
| **Types** | — | — | All domain types |
| **Utils** | — | — | formatDuration, geoUtils, etc. |

### Why This Split Pays Off

The hard parts of the app — auth flows, Firestore queries, cache invalidation, audio state, optimistic updates — are written **once** in `packages/core` and consumed identically by both apps. The UI layer (the easier part) is written twice but optimized per platform. This is the architecture you'd actually use at a company.

### Code Reuse Estimate

| Category | Shared in `core` |
|---|---|
| TypeScript domain types | 100% |
| Firebase config + SDK init | 100% |
| TanStack Query hooks (useStories, useProfile…) | 100% |
| Zustand stores (auth, player) | 100% |
| Utility functions | 100% |
| UI components | 0% — platform-specific by design |
| Navigation/routing | 0% — platform-specific by design |
| **Total effective reuse** | ~65% |

### Extra Lift vs. Mobile-Only
Monorepo setup and shared package configuration takes roughly 1–2 days upfront. After that, each new feature you build in `core` is free on both platforms — you only pay for the UI layer twice. Net overhead across the full project is ~40–50% more work than mobile-only, but the result demonstrates significantly more architectural maturity.

---

## 3. Dependency Audit Table

### Core Runtime

| Current | Version | `apps/mobile` | `apps/web` | `packages/core` | Reason |
|---|---|---|---|---|---|
| `react` | 16.13.1 | **18.3** | **18.3** | peer dep | Concurrent features, automatic batching |
| `react-native` | SDK 40 | Keep (updated) | via `react-dom` | — | Platform split |
| `expo` | ~40.0.0 | **SDK 52** | — | — | Current stable |

### Build & Tooling

| Current | Replacement | Where | Reason |
|---|---|---|---|
| Expo CLI / Metro | **Expo SDK 52 + Metro** | `apps/mobile` | Current Expo toolchain |
| (none) | **Vite 6** | `apps/web` | Faster HMR, ESM-native |
| `babel-preset-expo` | Stays for mobile | `apps/mobile` | Expo requires it |
| `@svgr/cli` | `vite-plugin-svgr` | `apps/web` | Inline SVG in Vite |
| (none) | **Turborepo** | root | Monorepo task orchestration |
| (none) | **tsup** | `packages/core` | Zero-config library bundler |

### Navigation

| Current | Replacement | Where | Reason |
|---|---|---|---|
| `@react-navigation/native` ^5 | **`@react-navigation/native` ^6** + **Expo Router** | `apps/mobile` | Current stable, file-based routing |
| `@react-navigation/bottom-tabs` ^5 | **`@react-navigation/bottom-tabs` ^6** | `apps/mobile` | Version bump |
| `@react-navigation/stack` ^5 | **`@react-navigation/stack` ^6** | `apps/mobile` | Version bump |
| (none) | **React Router v6** | `apps/web` | Web-native routing |
| `react-native-gesture-handler` ~1.8 | **react-native-gesture-handler ^2** | `apps/mobile` | Required by RN6 |

### UI & Styling — Mobile

| Current | Replacement | Reason |
|---|---|---|
| `@material-ui/core` ^4 | **`react-native-paper` ^5** | MUI is web-only; Paper is the RN equivalent |
| `expo-linear-gradient` ^9 | **`expo-linear-gradient` ^14** | SDK 52 compatible |
| `react-native-vector-icons` ^8 | **`@expo/vector-icons`** (SDK 52 included) | Bundled with Expo, no manual linking |
| `react-native-reanimated` ~1.13 | **`react-native-reanimated` ^3** | Major performance + API improvements |

### UI & Styling — Web

| Current | Replacement | Reason |
|---|---|---|
| `@material-ui/core` ^4 | **`@mui/material` v6** | v5+ uses Emotion engine, `sx` prop, better theming |
| (none) | **`@emotion/react` + `@emotion/styled`** | MUI's styling engine; enables `styled()` and CSS-in-JS |
| (none) | **`@fontsource/inter`** | Self-hosted Inter font, no flash of unstyled text |
| (none) | **`@mui/icons-material`** | Tree-shakeable icon set |

### Maps & Geolocation

| Current | Mobile Replacement | Web Replacement | Reason |
|---|---|---|---|
| `react-native-maps` 0.27.1 | **`react-native-maps` ^1.10** | **`@vis.gl/react-google-maps`** | SDK 52 compatible; Google Maps JS for web |

### Audio & Media

| Current | Mobile Replacement | Web Replacement | Reason |
|---|---|---|---|
| `expo-av` ~8.7 | **`expo-av` ^15** (SDK 52) | Web Audio API (no library) | Native browser API on web |
| `expo-camera` ~9.1 | **`expo-camera` ^15** | `MediaDevices.getUserMedia()` | Web API |
| `expo-image-picker` ~9.2 | **`expo-image-picker` ^15** | `<input type="file">` + FileReader | Web API |
| `react-native-scrubber` ^1.1.5 | Custom RN `Slider` | MUI `Slider` | Full styling control |

### Data & Storage

| Current | Replacement | Where | Reason |
|---|---|---|---|
| `firebase` 7.9.0 | **`firebase` v11 (modular)** | `packages/core` | Tree-shakeable, modular API |
| `@react-native-async-storage/async-storage` | Stays (^2.x) in mobile | `localStorage` / Zustand `persist` on web | Platform-appropriate persistence |

### State & Data Fetching

| Current | Replacement | Where | Reason |
|---|---|---|---|
| `useState` (scattered) | **Zustand ^5** | `packages/core` | Global UI/client state, no provider boilerplate |
| (none) | **TanStack Query v5** | `packages/core` | Server state: caching, invalidation, background refetch |

### Dev & Testing

| Current | Replacement | Where | Reason |
|---|---|---|---|
| None | **Vitest** | `apps/web`, `packages/core` | Vite-native test runner |
| None | **Jest + `jest-expo`** | `apps/mobile` | Standard Expo testing |
| None | **@testing-library/react** | `apps/web` | Component tests |
| None | **@testing-library/react-native** | `apps/mobile` | RN component tests |
| None | **MSW** | both | Mock Firebase calls in tests |
| None | **Playwright** | `apps/web` | E2E browser tests |
| None | **Detox** | `apps/mobile` | E2E mobile tests (Phase 3+) |
| None | **ESLint + @typescript-eslint** | root (shared config) | Static analysis |
| None | **Prettier** | root | Consistent formatting |

---

## 4. Build Tooling

### Turborepo (Root Orchestration)

Turborepo manages tasks across all workspaces with caching — `turbo build` only rebuilds packages that changed.

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**"]
    },
    "test": { "dependsOn": ["^build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

```json
// package.json (root)
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:mobile": "turbo run dev --filter=mobile",
    "dev:web":    "turbo run dev --filter=web",
    "build":      "turbo run build",
    "test":       "turbo run test",
    "lint":       "turbo run lint",
    "typecheck":  "turbo run typecheck"
  }
}
```

### `apps/mobile` — Expo SDK 52

```bash
npx create-expo-app@latest mobile --template blank-typescript
```

Expo handles Metro bundler, Babel, and native module linking. No additional bundler config needed.

### `apps/web` — Vite 6

```bash
npm create vite@latest web -- --template react-ts
```

```ts
// apps/web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: { '@': '/src', '@voices/core': '../../packages/core/src' },
  },
})
```

### `packages/core` — tsup

```ts
// packages/core/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,           // generates .d.ts for consumers
  sourcemap: true,
  external: ['react', 'firebase', '@tanstack/react-query'],
})
```

**Shared `tsconfig` base:**
```json
// packages/tsconfig/base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "skipLibCheck": true
  }
}
```

---

## 5. TypeScript Migration Strategy

Both apps and `packages/core` use **strict TypeScript from day one**.

### Type Layers

```ts
// packages/core/src/types/story.ts
export interface Story {
  id: string
  title: string
  description: string
  audioUrl: string
  transcriptUrl?: string
  coverImageUrl?: string
  location: GeoPoint
  locationName?: string
  tags: string[]
  authorId: string
  durationMs: number
  isPublic: boolean
  playCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface GeoPoint {
  lat: number
  lng: number
}
```

```ts
// packages/core/src/types/user.ts
export interface UserProfile {
  id: string
  username: string
  bio: string
  profileImageUrl: string
  createdAt: Timestamp
}

// packages/core/src/types/playlist.ts
export interface Playlist {
  id: string
  title: string
  description?: string
  coverImageUrl?: string
  ownerId: string
  storyIds: string[]
  isPublic: boolean
  createdAt: Timestamp
}
```

Typed Firestore converters live in `core` — both apps import the same converters, ensuring the same runtime shape guarantee:

```ts
// packages/core/src/lib/converters.ts
import type { FirestoreDataConverter } from 'firebase/firestore'
import type { Story } from '../types/story'

export const storyConverter: FirestoreDataConverter<Story> = {
  toFirestore: (story) => story,
  fromFirestore: (snap) => ({ id: snap.id, ...snap.data() }) as Story,
}
```

### Enforcement
- `"strict": true` — `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`
- `"noUncheckedIndexedAccess": true` — array access returns `T | undefined`
- ESLint `@typescript-eslint/no-explicit-any: "error"`

---

## 6. UI/UX Framework — Platform-Split Strategy

The design system has **one set of tokens, two UI implementations**.

### Design Tokens in `packages/core`

```ts
// packages/core/src/theme/tokens.ts
export const tokens = {
  color: {
    primary: '#1ddbb5',
    secondary: '#FDF0AF',
    bg: '#0f1117',
    surface: '#1a1f2e',
    muted: '#6b7280',
    textPrimary: '#f1f5f9',
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 40,
  },
  radius: {
    sm: 8, md: 12, lg: 20, pill: 999,
  },
  fontFamily: {
    sans: 'Inter',
  },
} as const

export type Tokens = typeof tokens
```

Both apps import `tokens` from `@voices/core` and map them to their respective styling systems. No magic number appears in app code.

---

### `apps/web` — MUI v6 + Emotion

**Anti-"out-of-the-box" strategy:** Three layers of customization ensure no user can identify this as stock Material UI.

#### Layer 1 — Global Theme Override

```ts
// apps/web/src/theme/theme.ts
import { createTheme, alpha } from '@mui/material/styles'
import { tokens } from '@voices/core'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: tokens.color.primary },
    secondary:  { main: tokens.color.secondary },
    background: { default: tokens.color.bg, paper: tokens.color.surface },
    text:       { primary: tokens.color.textPrimary, secondary: tokens.color.muted },
  },
  typography: {
    fontFamily: `"${tokens.fontFamily.sans} Variable", sans-serif`,
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 600, letterSpacing: '-0.02em' },
    body1: { lineHeight: 1.7 },
  },
  shape: { borderRadius: tokens.radius.md },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: tokens.radius.pill,
          padding: '10px 24px',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.color.primary}, ${alpha(tokens.color.primary, 0.7)})`,
          '&:hover': { boxShadow: `0 0 20px ${alpha(tokens.color.primary, 0.4)}` },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiSlider: {
      // Audio scrubber
      styleOverrides: {
        thumb: { width: 12, height: 12, '&:hover': { boxShadow: `0 0 0 8px ${alpha(tokens.color.primary, 0.2)}` } },
        track: { height: 3 },
        rail:  { height: 3, opacity: 0.3 },
      },
    },
  },
})
```

#### Layer 2 — `styled()` for Branded Components

```ts
// apps/web/src/features/record/RecordingOrb.styled.ts
import { styled, keyframes } from '@mui/material/styles'
import Box from '@mui/material/Box'
import { tokens } from '@voices/core'

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(29, 219, 181, 0.4); }
  50%       { box-shadow: 0 0 0 20px rgba(29, 219, 181, 0); }
`

export const OrbContainer = styled(Box, {
  shouldForwardProp: (p) => p !== 'isRecording',
})<{ isRecording: boolean }>(({ isRecording }) => ({
  width: 80, height: 80, borderRadius: '50%',
  background: isRecording
    ? `radial-gradient(circle, ${tokens.color.primary}, #0d8a72)`
    : tokens.color.surface,
  animation: isRecording ? `${pulse} 1.5s ease-in-out infinite` : 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
}))
```

#### Layer 3 — CSS Custom Properties

```css
/* apps/web/src/styles/globals.css */
:root {
  --color-primary: #1ddbb5;
  --color-secondary: #fdf0af;
  --color-bg: #0f1117;
  --color-surface: #1a1f2e;
  --radius: 12px;
}
```

Non-MUI elements (map overlays, canvas-based waveform) use these variables directly.

---

### `apps/mobile` — React Native Paper v5

React Native Paper v5 uses the same MD3 design language as MUI v6. The same token values are applied via Paper's `MD3Theme`:

```ts
// apps/mobile/src/theme/theme.ts
import { MD3DarkTheme, configureFonts } from 'react-native-paper'
import { tokens } from '@voices/core'

export const mobileTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          tokens.color.primary,
    secondary:        tokens.color.secondary,
    background:       tokens.color.bg,
    surface:          tokens.color.surface,
    onPrimary:        tokens.color.bg,
    onSurface:        tokens.color.textPrimary,
  },
  roundness: tokens.radius.md / 4,  // Paper uses unitless roundness scale
}
```

**Result:** Both apps feel like the same product. Same teal, same yellow, same dark background — but each uses the appropriate native component system.

---

## 7. Backend & Data — GCP / Firebase Strategy

### Firebase Services (Project: `voices-9a030` — credentials rotated)

| Service | Usage |
|---|---|
| **Firebase Auth** | Email/password + Google Sign-In |
| **Cloud Firestore** | Primary database — stories, users, playlists |
| **Cloud Storage** | Audio files, cover images |
| **Firebase Hosting** | Web app deployment (CI/CD via GitHub Actions) |
| **Expo Updates (EAS)** | Mobile OTA updates |

### Firestore Schema

```
users/{userId}
  ├── username: string
  ├── bio: string
  ├── profileImageUrl: string
  ├── createdAt: Timestamp

stories/{storyId}
  ├── title: string
  ├── description: string
  ├── audioUrl: string             # gs:// Cloud Storage URL
  ├── coverImageUrl?: string
  ├── transcriptUrl?: string
  ├── durationMs: number
  ├── location: { lat, lng }
  ├── locationName?: string        # reverse-geocoded
  ├── tags: string[]
  ├── authorId: string             # → users/{userId}
  ├── isPublic: boolean
  ├── playCount: number
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

playlists/{playlistId}
  ├── title: string
  ├── description?: string
  ├── coverImageUrl?: string
  ├── ownerId: string
  ├── storyIds: string[]           # ordered
  ├── isPublic: boolean
  └── createdAt: Timestamp
```

### Firebase SDK v11 — Modular (in `packages/core`)

```ts
// packages/core/src/lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
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

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
```

Each app provides env vars via its own mechanism (`import.meta.env` on web, `app.config.js` + EAS secrets on mobile) — `core` reads `process.env` which both environments populate at build time.

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    match /stories/{storyId} {
      allow read: if resource.data.isPublic == true
                  || request.auth.uid == resource.data.authorId;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }
    match /playlists/{playlistId} {
      allow read: if resource.data.isPublic == true
                  || request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.ownerId;
    }
  }
}
```

---

## 8. State Management Architecture

### Principle: Right Tool for the Right State

| State Type | Tool | Location | Examples |
|---|---|---|---|
| **Server / async state** | TanStack Query v5 | `packages/core` | Firestore story list, user profile, playlists |
| **Global UI state** | Zustand ^5 | `packages/core` | Auth user, audio playback, active filters |
| **Local component state** | `useState` | each app | Form inputs, modal open/close |
| **URL state** | React Router (web) / Expo Router (mobile) | each app | Map viewport, active story ID |

### Shared TanStack Query Hook (consumed by both apps)

```ts
// packages/core/src/hooks/useStories.ts
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { storyConverter } from '../lib/converters'
import type { Story } from '../types/story'

export function useStories(tag?: string) {
  return useQuery<Story[]>({
    queryKey: ['stories', { tag }],
    queryFn: async () => {
      const ref = collection(db, 'stories').withConverter(storyConverter)
      const q = tag
        ? query(ref, where('tags', 'array-contains', tag), where('isPublic', '==', true))
        : query(ref, where('isPublic', '==', true))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data())
    },
    staleTime: 1000 * 60 * 5,
  })
}
```

Both apps call `useStories()` from `@voices/core` — identical behavior, caching, and type safety.

### Shared Zustand Store

```ts
// packages/core/src/stores/playerStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface PlayerStore {
  activeStoryId: string | null
  isPlaying: boolean
  currentTimeMs: number
  play: (storyId: string) => void
  pause: () => void
  seek: (ms: number) => void
  reset: () => void
}

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set) => ({
    activeStoryId: null,
    isPlaying: false,
    currentTimeMs: 0,
    play:  (storyId) => set({ activeStoryId: storyId, isPlaying: true }),
    pause: ()        => set({ isPlaying: false }),
    seek:  (ms)      => set({ currentTimeMs: ms }),
    reset: ()        => set({ activeStoryId: null, isPlaying: false, currentTimeMs: 0 }),
  }))
)
```

The store holds the *what* (which story, what position). The *how* of audio playback is handled in each app separately — `expo-av` on mobile, Web Audio API on web — both driven by the same store subscription.

---

## 9. Monorepo Directory Structure

```
voices/                                  # Turborepo root
├── turbo.json
├── package.json                         # Workspace root, Turborepo scripts
│
├── packages/
│   ├── core/                            # Shared business logic
│   │   ├── src/
│   │   │   ├── index.ts                 # Public API barrel export
│   │   │   ├── types/                   # story.ts, user.ts, playlist.ts
│   │   │   ├── lib/
│   │   │   │   ├── firebase.ts          # Firebase app init
│   │   │   │   ├── converters.ts        # Typed Firestore converters
│   │   │   │   └── queryClient.ts       # TanStack QueryClient config
│   │   │   ├── hooks/                   # useStories, useProfile, usePlaylists, useAuth
│   │   │   ├── stores/                  # playerStore.ts, authStore.ts
│   │   │   ├── theme/
│   │   │   │   └── tokens.ts            # Raw design tokens
│   │   │   └── utils/                   # formatDuration, geoUtils, dateUtils
│   │   ├── package.json                 # { "name": "@voices/core" }
│   │   └── tsup.config.ts
│   │
│   └── tsconfig/                        # Shared TS config
│       ├── base.json
│       ├── react-library.json           # Extends base + React JSX
│       └── expo.json                    # Extends base + Expo specifics
│
├── apps/
│   ├── mobile/                          # Expo SDK 52 (iOS + Android)
│   │   ├── app/                         # Expo Router file-based routing
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   └── signup.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── explore/
│   │   │   │   │   ├── index.tsx        # Map view
│   │   │   │   │   ├── list.tsx
│   │   │   │   │   └── story/[id].tsx   # Story listen screen
│   │   │   │   ├── record/
│   │   │   │   │   ├── index.tsx        # Record home
│   │   │   │   │   ├── edit.tsx
│   │   │   │   │   ├── info.tsx
│   │   │   │   │   └── confirm.tsx
│   │   │   │   └── playlists/
│   │   │   │       ├── index.tsx
│   │   │   │       └── [id].tsx
│   │   │   └── _layout.tsx              # Root layout
│   │   ├── components/                  # Mobile-specific shared UI
│   │   │   ├── AudioPlayer.tsx          # expo-av powered
│   │   │   ├── RecordingOrb.tsx         # Animated RN component
│   │   │   ├── MapMarker.tsx
│   │   │   └── StoryCard.tsx
│   │   ├── theme/
│   │   │   └── theme.ts                 # React Native Paper theme (uses core tokens)
│   │   ├── app.json                     # Expo config
│   │   └── package.json
│   │
│   └── web/                             # Vite 6 + React 18 + MUI v6
│       ├── src/
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   ├── router.tsx           # React Router v6
│       │   │   └── providers.tsx        # ThemeProvider, QueryClientProvider
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   │   ├── components/      # LoginForm, AuthGuard
│       │   │   │   └── pages/           # LoginPage, SignUpPage
│       │   │   ├── explore/
│       │   │   │   ├── components/      # StoryMap, StoryCard, FilterBar
│       │   │   │   └── pages/           # ExplorePage, StoryListenPage
│       │   │   ├── record/
│       │   │   │   ├── components/      # RecordingOrb (web), AudioWaveform
│       │   │   │   └── pages/           # RecordPage, EditStoryPage, ConfirmPage
│       │   │   ├── playlists/
│       │   │   │   ├── components/      # PlaylistCard, CreatePlaylistModal
│       │   │   │   └── pages/           # PlaylistsPage, PlaylistDetailPage
│       │   │   └── profile/
│       │   │       ├── components/      # ProfileHeader, AvatarUpload
│       │   │       └── pages/           # ProfilePage, EditProfilePage
│       │   ├── shared/
│       │   │   ├── components/          # EmptyState, PageSkeleton, Avatar
│       │   │   └── hooks/               # useDebounce, useIntersectionObserver
│       │   ├── theme/
│       │   │   ├── theme.ts             # MUI theme (uses core tokens)
│       │   │   └── globals.css          # CSS custom properties
│       │   └── assets/
│       ├── vite.config.ts
│       └── package.json
```

---

## 10. Performance & SEO

### Mobile — `apps/mobile`
- Expo Router enables **automatic code splitting** — each route file is a separate chunk loaded on demand
- `expo-image` (SDK 52) for automatic image optimization and caching
- Hermes JS engine (default in Expo 52) for faster startup and lower memory
- React Native Reanimated v3 for 60fps animations running on the UI thread

### Web — `apps/web`

#### Code Splitting & Lazy Loading

```ts
// apps/web/src/app/router.tsx
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

const ExplorePage    = lazy(() => import('@/features/explore/pages/ExplorePage'))
const RecordPage     = lazy(() => import('@/features/record/pages/RecordPage'))
const PlaylistsPage  = lazy(() => import('@/features/playlists/pages/PlaylistsPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true,       element: <Suspense fallback={<PageSkeleton />}><ExplorePage /></Suspense> },
      { path: 'record/*',  element: <Suspense fallback={<PageSkeleton />}><RecordPage /></Suspense> },
      { path: 'playlists', element: <Suspense fallback={<PageSkeleton />}><PlaylistsPage /></Suspense> },
    ],
  },
  { path: '/story/:id', element: <Suspense fallback={<PageSkeleton />}><StoryListenPage /></Suspense> },
])
```

#### Vite Manual Chunks

```ts
// apps/web/vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
        'vendor-mui':      ['@mui/material', '@emotion/react', '@emotion/styled'],
        'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        'vendor-maps':     ['@vis.gl/react-google-maps'],
        'vendor-query':    ['@tanstack/react-query'],
      },
    },
  },
}
```

#### SEO & Metadata

Public story pages need discoverability:

```tsx
// apps/web/src/features/explore/pages/StoryListenPage.tsx
import { Helmet } from 'react-helmet-async'

function StoryListenPage() {
  const { data: story } = useStory(storyId)  // hook from @voices/core
  return (
    <>
      <Helmet>
        <title>{story?.title ?? 'Voices'} — Voices</title>
        <meta property="og:title"   content={story?.title} />
        <meta property="og:image"   content={story?.coverImageUrl} />
        <meta property="og:type"    content="music.song" />
        <meta property="og:url"     content={`https://voices.app/story/${story?.id}`} />
      </Helmet>
      {/* ... */}
    </>
  )
}
```

#### Web Performance Targets

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| INP | < 100ms |
| CLS | < 0.1 |
| Initial JS (gzipped) | < 150KB |
| Lighthouse Score | > 90 |

---

## 11. Testing Strategy

### Test Stack by Package

| Package | Unit/Integration | E2E | Mocking |
|---|---|---|---|
| `packages/core` | **Vitest** | — | MSW (Firebase REST mock) |
| `apps/web` | **Vitest** + **@testing-library/react** | **Playwright** | MSW |
| `apps/mobile` | **Jest** + **@testing-library/react-native** | Detox (Phase 3) | MSW |

### Test Pyramid

```
             /  E2E  \          ← ~10 Playwright (web) + Detox (mobile, later)
            /----------\
           / Integration \      ← ~30 React Testing Library component tests (each app)
          /--------------\
         /   Unit Tests    \    ← ~50+ Vitest/Jest (core hooks, store logic, utils)
        /____________________\
```

### Vitest Config (web + core)

```ts
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
})
```

### MSW — Mock Firebase Calls

```ts
// packages/core/src/test/handlers.ts
import { http, HttpResponse } from 'msw'
import { mockStories } from './fixtures'

export const handlers = [
  http.post('*/firestore.googleapis.com/*/documents:runQuery', () =>
    HttpResponse.json([{ document: { fields: mockStories[0] } }])
  ),
]
```

Both `apps/web` and `packages/core` tests import these handlers — Firebase is never hit during CI.

### Example Tests

**Unit — shared hook (Vitest):**
```ts
// packages/core/src/hooks/useStories.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useStories } from './useStories'
import { createWrapper } from '../test/utils'  // wraps with QueryClientProvider

it('returns public stories from Firestore', async () => {
  const { result } = renderHook(() => useStories(), { wrapper: createWrapper() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data?.every((s) => s.isPublic)).toBe(true)
})
```

**Playwright E2E — web record flow:**
```ts
// apps/web/e2e/record.spec.ts
import { test, expect } from '@playwright/test'

test('user can record and publish a story', async ({ page }) => {
  await page.goto('/record')
  await page.getByRole('button', { name: /start recording/i }).click()
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: /stop/i }).click()
  await page.getByRole('button', { name: /next/i }).click()
  await page.getByLabel('Title').fill('Test Story')
  await page.getByRole('button', { name: /publish/i }).click()
  await expect(page).toHaveURL(/\/story\//)
})
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx turbo run typecheck lint
      - run: npx turbo run test          # runs vitest (web + core) and jest (mobile) in parallel
      - run: npx playwright install --with-deps chromium
      - run: npx turbo run test:e2e --filter=web
```

---

## 12. Migration Phases

### Phase 0 — Monorepo Bootstrap (Days 1–2)
- [ ] Initialize Turborepo workspace (`npx create-turbo@latest`)
- [ ] Create `packages/core` with tsup, shared tsconfig, design tokens
- [ ] Create `apps/mobile` from `expo` template (`blank-typescript`)
- [ ] Create `apps/web` from Vite `react-ts` template
- [ ] Wire `@voices/core` as a dependency in both apps
- [ ] Configure ESLint + Prettier at root (shared config for all workspaces)
- [ ] Verify `turbo build` succeeds end-to-end

### Phase 1 — Core Package: Auth + Data Layer (Week 1)
- [ ] Implement Firebase v11 init in `core`, move credentials to env
- [ ] Define all TypeScript domain types and Firestore converters
- [ ] Implement TanStack Query hooks: `useStories`, `useProfile`, `usePlaylists`, `useStory`
- [ ] Implement Zustand stores: `authStore`, `playerStore`
- [ ] Write unit tests for all hooks using MSW
- [ ] Implement Firebase Auth hook (`useAuth`) with email + Google Sign-In

### Phase 2 — Mobile App (Week 2–3)
- [ ] Apply React Native Paper theme from core tokens
- [ ] Build auth screens (Login, Sign Up) using Paper components
- [ ] Migrate Explore flow: Map → Story List → Story Listen (using `react-native-maps`, `expo-av`)
- [ ] Migrate Record flow: Record → Edit → Info → Confirm (using MediaRecorder + Expo AV)
- [ ] Migrate Playlists flow (Firestore-backed, replacing AsyncStorage)
- [ ] Write component tests with `@testing-library/react-native`

### Phase 3 — Web App (Week 3–4)
- [ ] Apply MUI theme from core tokens; verify anti-MUI-default styling
- [ ] Build auth pages (Login, Sign Up) using MUI components
- [ ] Build Explore: `StoryMap` (Google Maps), `StoryList`, `StoryListenPage` (Web Audio API)
- [ ] Build Record flow (MediaRecorder browser API)
- [ ] Build Playlists and Profile pages
- [ ] Implement `react-helmet-async` for per-page SEO metadata
- [ ] Write Playwright E2E tests for critical flows

### Phase 4 — Polish & Deploy (Week 5)
- [ ] Run Lighthouse on web; implement `manualChunks` optimizations
- [ ] Set up Firebase Hosting + GitHub Actions CI/CD for web
- [ ] Set up EAS Build for mobile (TestFlight / Play Store internal track)
- [ ] Finalize Firestore Security Rules and Storage CORS config
- [ ] Rotate Firebase credentials (old key committed in OldVoices git history)
- [ ] Enable Firebase App Check

---

## 13. Security Remediation

### Critical: Rotate Firebase Credentials

The existing Firebase API key, App ID, and Messaging Sender ID are committed in plaintext to the OldVoices git history (`firebase.js`). **Do this before any public deployment or sharing of the new repo.**

1. Firebase Console → Project Settings → General → Web apps → Rotate API key
2. Store new credentials only in:
   - `apps/web/.env.local` (gitignored, Vite reads as `import.meta.env.VITE_*`)
   - `apps/mobile/app.config.js` + EAS Secrets (for mobile builds)
   - GitHub Actions secrets (for CI)
3. Add `.env.example` files (committed, no values) to document required variables
4. Add a pre-commit hook via `husky` + `lint-staged` that blocks any commit containing a Firebase API key pattern

### `.env` Setup

```bash
# apps/web/.env.local — gitignored
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=voices-9a030.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=voices-9a030
VITE_FIREBASE_STORAGE_BUCKET=voices-9a030.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# apps/mobile — EAS secrets (set via `eas secret:create`)
# FIREBASE_API_KEY, FIREBASE_APP_ID, etc.
```

### Additional Measures
- Enable **Firebase App Check** to restrict API key to your app origins
- Finalize **Firestore Security Rules** before going public (see Section 7)
- Set Storage bucket CORS to only allow your app's domain
- Use `Content-Security-Policy` headers via Firebase Hosting config

---

*Updated 2026-02-18 to reflect Turborepo monorepo architecture with Expo mobile + Vite web apps and shared `@voices/core` package.*
