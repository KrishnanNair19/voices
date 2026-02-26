# Phase 2 — Mobile UI-First Planning Document

> **Architect:** Senior React Native Architect
> **Date:** 2026-02-20
> **Scope:** `apps/mobile` — Expo SDK 54, React 19, React Native 0.81
> **Pivot:** UI-First approach — build all screens with mock/static data before wiring Firestore
> **Pattern:** Strict MVC · Atomic Design · TypeScript throughout

---

## Table of Contents

1. [Strategic Rationale for UI-First](#1-strategic-rationale-for-ui-first)
2. [Screen Inventory](#2-screen-inventory)
3. [Component Mapping — Atomic vs Feature-Specific](#3-component-mapping--atomic-vs-feature-specific)
4. [Styling Architecture — "Key Stylist" System](#4-styling-architecture--key-stylist-system)
5. [MVC Mapping to Directory Structure](#5-mvc-mapping-to-directory-structure)
6. [Database Implications from UI Needs](#6-database-implications-from-ui-needs)
7. [Open Questions for the Style Guide](#7-open-questions-for-the-style-guide)

---

## 1. Strategic Rationale for UI-First

Building screens against mock data before connecting Firebase accomplishes three things:

1. **Schema validation by usage** — the props a component _actually needs_ reveals the exact Firestore document shape. We've already caught one gap: the legacy `StoryInfo.js` stores date as a hardcoded string `"March 2021"` rather than a timestamp, and the Confirmation screen appends `locationIndex` as a raw array index rather than a coordinate reference. These will be fixed in the typed schema.

2. **Fast iteration** — no async loading states, no Firebase emulator, no auth gates while iterating on visual polish.

3. **Parallel work** — the `@voices/core` data layer (Phase 1 in the original plan) can be built in parallel and dropped in without changing any screen layout code. The controller hooks are the seam.

---

## 2. Screen Inventory

Derived by scanning `/OldVoices/App/Screens/` and all navigation stacks. Each entry lists the screen's purpose, its data shape, and its sub-components.

---

### Flow A — Onboarding / Auth

#### A1 · `LoginScreen` → `src/screens/Auth/LoginScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Toggle between Sign Up and Log In |
| Data In | None (form inputs only) |
| Data Out | Firebase Auth: `uid`, `email`; Firestore write: `users/{uid}` |
| User Actions | Toggle form mode, submit credentials, see inline errors |

**Sub-components needed (screen-specific):**
- `AuthForm` — controlled form with animated mode-switch
- `AuthErrorBanner` — inline error display (e.g., "Email already in use")

---

### Flow B — Explore

#### B1 · `MainMapScreen` → `src/screens/Explore/MainMapScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Discover stories by location on an interactive map |
| Data In | Array of `StoryLocation` (coordinates + stories), selected city filter |
| Data Out | Navigation to `StoryListScreen` with `locationId` |
| User Actions | Tap marker → story list, change city filter, re-center to current location |

**Sub-components (screen-specific):**
- `CityFilterDropdown` — animated dropdown pill (Barcelona / San Francisco / All)
- `StoryMapMarker` — custom map pin with story cover image thumbnail

---

#### B2 · `StoryListScreen` → `src/screens/Explore/StoryListScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Circular carousel of stories at a specific location |
| Data In | `locationId` (from B1), resolved `Story[]` for that location |
| Data Out | Navigation to `StoryListenScreen` with `storyId`; modal triggers |
| User Actions | Swipe/tap carousel, open share/playlist modals, view tags |

**Sub-components (screen-specific):**
- `StoryCarousel` — wraps `@vis.gl/react-circle-list` equivalent; handles 12-item wraparound
- Location context header (inherits shared `LocationHeader` atom — see §3)

**Modals triggered** (shared organisms — see §3):
- `PlaylistPickerModal`
- `CreatePlaylistModal`
- `ShareModal`

---

#### B3 · `StoryListenScreen` → `src/screens/Explore/StoryListenScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Full-screen audio player for a single story |
| Data In | `storyId`; resolved `Story` (cover image, audio URL, transcript, tags, author) |
| Data Out | Writes to `playerStore` (play/pause/seek); navigation to `CreatorProfileScreen` |
| User Actions | Play/pause, scrub timeline, view transcript, share, add to playlist |

**Sub-components (screen-specific):**
- `StoryHero` — large cover image with blurred background (ImageBackground effect)
- `AudioScrubber` — styled Slider + time labels

**Modals triggered:**
- `TranscriptModal`
- `ShareModal`
- `PlaylistPickerModal`

---

#### B4 · `CreatorProfileScreen` → `src/screens/Explore/CreatorProfileScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | View a story creator's profile and their published stories |
| Data In | `authorId`; resolved `UserProfile` + `Story[]` by that author |
| Data Out | Navigation to `StoryListenScreen` |
| User Actions | Scroll story grid, tap story to listen, share profile |

**Sub-components (screen-specific):**
- `ProfileStats` — story count + playlist count badges
- `ProfileStoriesGrid` — 2-column grid using `StoryCard` organism

---

### Flow C — Record

#### C1 · `RecordHomeScreen` → `src/screens/Record/RecordHomeScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Record a new audio story using the signature orb UI |
| Data In | Current recording state from `recordingStore` |
| Data Out | Navigates to `EditStoryScreen` with `audioUri` + `durationMs` |
| User Actions | Tap orb to start/pause/resume recording, restart, proceed to edit |

**Sub-components (screen-specific):**
- `RecordingOrb` — animated RN Reanimated v3 orb; state: idle / recording / paused
- `RecordTimer` — running `MM:SS` counter; updates every 500ms
- `RecordActionRow` — Restart + Next buttons with disabled states

---

#### C2 · `EditStoryScreen` → `src/screens/Record/EditStoryScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Trim the recorded audio to a desired clip length |
| Data In | `audioUri`, `durationMs` |
| Data Out | Navigates to `StoryInfoScreen` with trimmed range `{ start: ms, end: ms }` |
| User Actions | Drag left/right handles to set trim range, scrub playback, play preview |

**Sub-components (screen-specific):**
- `AudioTrimmer` — waveform bars + two draggable handle views
- `TrimScrubber` — playback position indicator overlaid on trimmer
- `TrimStats` — displays total duration, trim start, trim end, trimmed length

---

#### C3 · `StoryInfoScreen` → `src/screens/Record/StoryInfoScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Add title, tags, and cover photo before posting |
| Data In | `audioUri`, `{ start, end }` trim range |
| Data Out | Navigates to `ConfirmLocationScreen` with `DraftStory` object |
| User Actions | Type title, multi-select tags, choose photo (gallery or camera) |

**Sub-components (screen-specific):**
- `CoverPhotoSelector` — circular preview + "Take Photo" / "Upload" options
- `TagPicker` — multi-select chip grid (6 predefined tags + custom input — see DB implications §6)

---

#### C4 · `ConfirmLocationScreen` → `src/screens/Record/ConfirmLocationScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Pin story to a map location and post it |
| Data In | `DraftStory` object (title, tags, audioUri, coverImageUri, trimRange) |
| Data Out | Writes to Firestore `stories/{id}`, Cloud Storage; navigates to `MainMapScreen` |
| User Actions | Select location from dropdown or tap map pin, confirm/undo post |

**Sub-components (screen-specific):**
- `LocationPicker` — dropdown + map view showing selected pin
- `PostConfirmationOverlay` — success state with Undo / OK actions

---

#### C5 · `TakePhotoScreen` → `src/screens/Record/TakePhotoScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Capture a photo from device camera |
| Data In | None |
| Data Out | Navigates to `PhotoPreviewScreen` with `photoUri` |
| User Actions | Flip camera, capture |

---

#### C6 · `PhotoPreviewScreen` → `src/screens/Record/PhotoPreviewScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Review captured photo and confirm or retake |
| Data In | `photoUri` |
| Data Out | Returns `photoUri` to `StoryInfoScreen` |
| User Actions | Confirm or retake |

---

### Flow D — Playlists

#### D1 · `PlaylistsHomeScreen` → `src/screens/Playlists/PlaylistsHomeScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Grid of all available playlists (curated + user-created) |
| Data In | `Playlist[]` — mix of curated and user-owned |
| Data Out | Navigation to `PlaylistDetailScreen` or `PlaylistMapScreen` |
| User Actions | Tap playlist to enter, create new playlist (FAB) |

---

#### D2 · `PlaylistDetailScreen` → `src/screens/Playlists/PlaylistDetailScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Circular carousel of stories within a specific playlist |
| Data In | `playlistId`; resolved `Playlist` + `Story[]` |
| Data Out | Navigation to `StoryListenScreen`, modal triggers |
| User Actions | Same as `StoryListScreen` (B2) but in playlist context |

---

#### D3 · `PlaylistMapScreen` → `src/screens/Playlists/PlaylistMapScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Map view showing unique story locations within a playlist |
| Data In | `playlistId`; resolved `Story[]` with GeoPoint data |
| Data Out | Navigation to `StoryListenScreen` |
| User Actions | Tap map marker to listen |

---

### Flow E — Profile / Settings

#### E1 · `UserProfileScreen` → `src/screens/Profile/UserProfileScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Authenticated user's own profile with their stories and playlists |
| Data In | `authStore.user`; user's `Story[]` and `Playlist[]` |
| Data Out | Navigation to edit, story listening |
| User Actions | Edit profile, view own stories, log out |

---

#### E2 · `EditProfileScreen` → `src/screens/Profile/EditProfileScreen.tsx`

| Field | Detail |
|---|---|
| Purpose | Edit username, bio, and profile picture |
| Data In | Current `UserProfile` |
| Data Out | Writes to Firestore `users/{uid}` |
| User Actions | Edit fields, upload profile photo, save |

---

### Screen Count Summary

| Flow | Screens |
|---|---|
| Onboarding / Auth | 1 |
| Explore | 4 |
| Record | 6 |
| Playlists | 3 |
| Profile | 2 |
| **Total** | **16** |

---

## 3. Component Mapping — Atomic vs Feature-Specific

Organized using Atomic Design: **Atoms → Molecules → Organisms → Screens**.

### Atoms — `src/components/common/atoms/`

Pure, dependency-free primitives. No business logic, no navigation calls.

| Component | Props | Notes |
|---|---|---|
| `Text` | `variant`, `color`, `children` | Wraps RN `Text`; enforces typography scale from `@voices/core` tokens |
| `Button` | `variant` (primary/secondary/ghost), `size`, `loading`, `disabled`, `onPress` | Renders `Pressable` with animated press feedback (Reanimated) |
| `IconButton` | `icon`, `size`, `onPress`, `accessibilityLabel` | Touchable icon wrapper |
| `Avatar` | `uri`, `size`, `fallbackInitials` | Circular image; shows initials if no image |
| `Tag` | `label`, `selected`, `onPress` | Pill chip; teal when selected, muted when not |
| `Divider` | `horizontal` / `vertical` | Thin separator using surface token |
| `Skeleton` | `width`, `height`, `radius` | Loading placeholder using Reanimated shimmer |
| `Badge` | `count` | Number badge overlay (for notification counts) |

---

### Molecules — `src/components/common/molecules/`

Small compositions of atoms. May have local state but no data fetching.

| Component | Atoms Used | Notes |
|---|---|---|
| `StoryCard` | `Avatar`, `Text`, `Tag`, `IconButton` | Card showing story title, author, duration, tags, play + share + playlist buttons |
| `PlaylistCard` | `Text`, `Avatar` | Grid item with cover image + title |
| `AudioProgressBar` | — | Thin Slider styled to match scrubber design |
| `PlaybackControls` | `IconButton` | Play/Pause, Prev, Next with loading state |
| `TagChipGroup` | `Tag` | Horizontally scrollable group of Tag atoms |
| `FormField` | `Text` | Label + TextInput + error message |
| `EmptyState` | `Text`, `Button` | Illustration + message + optional CTA |
| `LocationHeader` | `Text`, `IconButton` | Screen header showing location name + back/menu button |

---

### Organisms — `src/components/common/organisms/`

Feature-complete UI blocks. May receive data via props from a screen's controller hook. No direct data fetching.

| Component | Molecules Used | Notes |
|---|---|---|
| `AudioPlayer` | `PlaybackControls`, `AudioProgressBar`, `StoryCard` | Full persistent mini-player; driven by `playerStore` |
| `MapView` | — | Wrapper around `react-native-maps`; renders `StoryMapMarker` markers |
| `StoryCarousel` | `StoryCard` | Circular carousel using `react-native-snap-carousel` or custom `FlatList` |
| `PlaylistPickerModal` | `PlaylistCard`, `Button` | Bottom sheet to add story to existing or new playlist |
| `CreatePlaylistModal` | `FormField`, `Button` | Form sheet to create a new playlist |
| `ShareModal` | `IconButton`, `Text` | Bottom sheet with platform share targets |
| `TranscriptModal` | `Text` | Scrollable transcript in a modal |
| `ConfirmationModal` | `Text`, `Button` | Generic confirm/cancel dialog |

---

### Feature-Specific Sub-components — `src/screens/[Feature]/components/`

Components that are tightly coupled to one screen's business logic and are not reusable elsewhere.

| Location | Component | Reason It's Feature-Specific |
|---|---|---|
| `Explore/components/` | `CityFilterDropdown` | Uses explore's filter state shape |
| `Explore/components/` | `StoryMapMarker` | Renders a `Story` preview; tightly coupled to Explore nav |
| `Record/components/` | `RecordingOrb` | Reanimated animation tied to `recordingStore` state machine |
| `Record/components/` | `RecordTimer` | Drives off recording tick; only valid inside Record flow |
| `Record/components/` | `AudioTrimmer` | Gesture-based trimmer; uses raw `durationMs` from recorder |
| `Record/components/` | `CoverPhotoSelector` | Calls expo-image-picker; specific to story creation |
| `Record/components/` | `TagPicker` | Multi-select grid; uses the hardcoded tag constants for record flow |
| `Record/components/` | `LocationPicker` | Combines dropdown + MapView for confirmation step only |
| `Playlists/components/` | `PlaylistsGrid` | 2-col FlatList of `PlaylistCard`; fetches from `usePlaylists` |
| `Profile/components/` | `ProfileStats` | Badges for story/playlist counts; reads `UserProfile` shape |

---

## 4. Styling Architecture — "Key Stylist" System

### 4.1 Design Token Foundation

All styling traces back to `packages/core/src/theme/tokens.ts`. **No hard-coded values in `apps/mobile`.** Every pixel value, color, and font size is a named token.

```
@voices/core tokens
      ↓
apps/mobile/src/styles/theme.ts     ← extends tokens into React Native Paper MD3 theme
apps/mobile/src/styles/typography.ts ← maps fontFamily + scale to RN TextStyle objects
apps/mobile/src/styles/layout.ts     ← spacing scale, screen-edge padding, safe area helpers
apps/mobile/src/styles/shadows.ts    ← platform-appropriate elevation/shadow values
```

---

### 4.2 Light / Dark Mode

**Strategy: System-first, with user override via `themeStore`.**

```
System Theme (Appearance.getColorScheme())
    ↓
themeStore (Zustand — 'light' | 'dark' | 'system')
    ↓
PaperProvider theme={activeTheme}
    ↓
Every component reads via useTheme() from react-native-paper
```

Both light and dark themes extend the same `tokens` base, swapping only surface/background/text colors:

| Token | Dark (default) | Light (TBD — see §7) |
|---|---|---|
| `color.bg` | `#0f1117` | `?` |
| `color.surface` | `#1a1f2e` | `?` |
| `color.textPrimary` | `#f1f5f9` | `?` |
| `color.primary` | `#1ddbb5` | `#1ddbb5` (same) |
| `color.secondary` | `#FDF0AF` | `#FDF0AF` (same) |

**Rule:** Components must **never** hardcode `'dark'` or `'light'` conditionals. They receive `colors` from `useTheme()` only.

---

### 4.3 Responsive Scaling

React Native uses logical pixels (density-independent). We still need to handle:
1. Small phones (iPhone SE: 320pt wide)
2. Standard phones (390pt — iPhone 16)
3. Large phones (430pt — iPhone 16 Plus, Pro Max)
4. Tablets (768pt+) — lower priority for Phase 2

**Scaling strategy: `src/styles/layout.ts`**

```typescript
// src/styles/layout.ts
import { Dimensions, Platform } from 'react-native'
import { tokens } from '@voices/core'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const BASE_WIDTH = 390   // iPhone 16 logical width

// Scale factor for font/icon sizes relative to base device
export const scale = (size: number) => (SCREEN_W / BASE_WIDTH) * size

// Clamp to min/max to prevent extreme scaling on tablets
export const clampedScale = (size: number, min = size * 0.8, max = size * 1.2) =>
  Math.min(max, Math.max(min, scale(size)))

// Spacing: always use tokens; avoid raw numbers
export const spacing = tokens.spacing   // xs: 4, sm: 8, md: 16, lg: 24, xl: 40

// Screen edge padding (respects notches + Dynamic Island)
export const SCREEN_HORIZONTAL_PADDING = tokens.spacing.md   // 16pt
export const SCREEN_VERTICAL_PADDING   = tokens.spacing.lg   // 24pt
```

**Typography scaling: `src/styles/typography.ts`**

Typography uses `clampedScale` to ensure readability on very small or large screens. Font sizes are defined as named roles:

```typescript
export const typography = {
  displayLarge:  { fontSize: clampedScale(32), fontWeight: '700', lineHeight: clampedScale(40) },
  headingMedium: { fontSize: clampedScale(20), fontWeight: '600', lineHeight: clampedScale(28) },
  bodyLarge:     { fontSize: clampedScale(16), fontWeight: '400', lineHeight: clampedScale(24) },
  bodySmall:     { fontSize: clampedScale(13), fontWeight: '400', lineHeight: clampedScale(18) },
  label:         { fontSize: clampedScale(12), fontWeight: '500', letterSpacing: 0.4 },
  caption:       { fontSize: clampedScale(11), fontWeight: '400', lineHeight: clampedScale(16) },
} as const
```

**Rule:** The `Text` atom maps `variant` prop to these roles. `<Text variant="headingMedium">` is the API; raw `fontSize` never appears in screen files.

---

### 4.4 Safe Area & Platform Handling

- Wrap root layout in `<SafeAreaProvider>` from `react-native-safe-area-context` (already included with Expo)
- Every screen uses `useSafeAreaInsets()` to pad content away from notches and home indicator
- `Platform.select` is allowed only in `layout.ts` — never inside screen components

---

### 4.5 StyleSheet Conventions

```typescript
// ✅ Correct: styles are co-located in the same file, using tokens
import { StyleSheet } from 'react-native'
import { tokens } from '@voices/core'
import { spacing, typography } from '@/styles/layout'

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: spacing.md,
  },
  title: {
    ...typography.headingMedium,
    color: tokens.color.textPrimary,
  },
})

// ❌ Wrong: no inline styles, no magic numbers
<View style={{ backgroundColor: '#1a1f2e', padding: 16 }} />
```

**Animation rule:** All animations use `react-native-reanimated` v3. No `Animated` from core RN (performance regression risk on Hermes).

---

## 5. MVC Mapping to Directory Structure

```
apps/mobile/src/
│
├── components/
│   └── common/
│       ├── atoms/             ← View layer: pure presentational atoms
│       ├── molecules/         ← View layer: composed UI blocks
│       └── organisms/         ← View layer: feature-complete reusable blocks
│
├── screens/
│   ├── Auth/
│   │   ├── LoginScreen.tsx                  ← View (screen)
│   │   ├── components/
│   │   │   ├── AuthForm.tsx                 ← View (screen sub-component)
│   │   │   └── AuthErrorBanner.tsx
│   │   └── useLoginController.ts            ← Controller (form state + auth calls)
│   │
│   ├── Explore/
│   │   ├── MainMapScreen.tsx
│   │   ├── StoryListScreen.tsx
│   │   ├── StoryListenScreen.tsx
│   │   ├── CreatorProfileScreen.tsx
│   │   ├── components/
│   │   │   ├── CityFilterDropdown.tsx
│   │   │   └── StoryMapMarker.tsx
│   │   └── useExploreController.ts          ← Controller (location filter, story selection)
│   │
│   ├── Record/
│   │   ├── RecordHomeScreen.tsx
│   │   ├── EditStoryScreen.tsx
│   │   ├── StoryInfoScreen.tsx
│   │   ├── ConfirmLocationScreen.tsx
│   │   ├── TakePhotoScreen.tsx
│   │   ├── PhotoPreviewScreen.tsx
│   │   ├── components/
│   │   │   ├── RecordingOrb.tsx
│   │   │   ├── RecordTimer.tsx
│   │   │   ├── AudioTrimmer.tsx
│   │   │   ├── CoverPhotoSelector.tsx
│   │   │   ├── TagPicker.tsx
│   │   │   └── LocationPicker.tsx
│   │   └── useRecordController.ts           ← Controller (recording state machine)
│   │
│   ├── Playlists/
│   │   ├── PlaylistsHomeScreen.tsx
│   │   ├── PlaylistDetailScreen.tsx
│   │   ├── PlaylistMapScreen.tsx
│   │   ├── components/
│   │   │   └── PlaylistsGrid.tsx
│   │   └── usePlaylistsController.ts
│   │
│   └── Profile/
│       ├── UserProfileScreen.tsx
│       ├── EditProfileScreen.tsx
│       ├── components/
│       │   └── ProfileStats.tsx
│       └── useProfileController.ts
│
├── styles/
│   ├── theme.ts               ← React Native Paper MD3 theme (maps core tokens)
│   ├── typography.ts          ← Font scale (roles → TextStyle objects)
│   ├── layout.ts              ← Screen dimensions, spacing helpers, safe area
│   └── shadows.ts             ← Elevation system (iOS shadow + Android elevation)
│
└── navigation/
    ├── RootNavigator.tsx      ← Auth gate: (auth) stack vs (tabs) stack
    ├── TabNavigator.tsx       ← Bottom tabs: Explore, Record, Playlists, Profile
    ├── ExploreStack.tsx
    ├── RecordStack.tsx
    └── PlaylistsStack.tsx
```

### MVC Role Definitions

| Layer | What it is | Rules |
|---|---|---|
| **Model** | `@voices/core` TanStack Query hooks + Zustand stores + TypeScript types | Lives in `packages/core`. No RN imports. No UI code. |
| **View** | All `.tsx` files in `screens/` and `components/` | No direct Firebase or AsyncStorage calls. Reads data from props or controller hook only. |
| **Controller** | `use[X]Controller.ts` files co-located with each screen folder | Connects Model to View. Calls core hooks, transforms data, provides handlers to screen. One controller per feature flow. |

---

## 6. Database Implications from UI Needs

These are gaps or additions to the current planned Firestore schema (from `upgrade-plan.md §7`) discovered by tracing the UI requirements.

---

### 6.1 Draft Stories — New Collection Required

**Trigger:** The Record flow is a 4-step wizard (Record → Trim → Metadata → Location). Users will interrupt mid-flow (phone call, battery, crash). A story should be resumable.

**Schema addition:**
```
drafts/{draftId}
  ├── authorId: string
  ├── audioStoragePath: string       # Cloud Storage path (not public URL)
  ├── trimStart: number              # milliseconds
  ├── trimEnd: number                # milliseconds
  ├── title?: string
  ├── tags?: string[]
  ├── coverImageStoragePath?: string
  ├── currentStep: 'trim' | 'info' | 'location'
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

**Impact on current schema:** `stories/` is unchanged. Drafts are a separate collection and are deleted on publish.

---

### 6.2 Tags — Fixed Enum vs User-Defined

**Current UI:** `StoryInfo.js` uses 6 hardcoded tags: `COVID-19, Music, Dance, Food, History, Folklore`.

**UI Tension:** The current `TagPicker` feature-specific component assumes a fixed list. However, the `Story` type in `upgrade-plan.md` already defines `tags: string[]`, which allows arbitrary strings.

**Decision needed (see §7, Q1):** Two options:
- **Option A (Fixed):** Keep the 6 predefined tags. No schema change needed. `tags` field stores the tag label string.
- **Option B (Open):** Allow custom tags. Add a `tags/{tagId}` collection with `label`, `slug`, `useCount` to support autocomplete and trending. `Story.tags` stores slugs.

**Temporary default for UI-first phase:** Use the 6 fixed tags with a text input overflow. This unblocks UI work; schema can be finalized later.

---

### 6.3 Location — GeoPoint vs Index Reference

**Current legacy behavior:** `Confirmation.js` stores `locationIndex` as an integer array index pointing into the hardcoded `StoryLocations` array. This is entirely non-scalable — any reordering of the array breaks all old stories.

**Correct schema (already partially correct in upgrade plan):**
```
stories/{storyId}
  ├── location: { lat: number, lng: number }   ✅ already in plan
  ├── locationName: string                     ✅ already in plan (reverse-geocoded label)
```

**Additional needed field:**
```
  └── locationRegion?: string                  # e.g. "Barcelona" | "San Francisco"
                                               # Used to bucket stories in CityFilterDropdown
```

Without `locationRegion`, the `CityFilterDropdown` on `MainMapScreen` has no efficient way to filter stories by city — it would require client-side lat/lng bounding box math on every story fetch.

---

### 6.4 Play Count — Increment Safety

**Current UI:** `StoryListen.js` implicitly tracks engagement but the legacy app does not write a play count back to Firestore.

**Schema field** (already in plan): `stories.playCount: number`

**Implication:** The `StoryListenScreen` controller must use a Firestore **atomic increment** (`increment(1)`) rather than a read-modify-write to avoid race conditions when multiple users listen simultaneously:

```typescript
// useStoryListenController.ts
import { doc, updateDoc, increment } from 'firebase/firestore'
await updateDoc(doc(db, 'stories', storyId), { playCount: increment(1) })
```

This is a controller implementation note, not a schema change.

---

### 6.5 Playlists — Ordered Story References

**Current plan:** `playlists.storyIds: string[]` — an ordered array.

**UI implication from `PlaylistDetailScreen`:** The carousel needs stories in a user-defined order. Firestore array operations (`arrayUnion`, `arrayRemove`) do not preserve order when modifying individual elements. Reordering requires writing the entire `storyIds` array atomically.

**Recommendation:** Add `updatedAt: Timestamp` to playlists (already in upgrade plan — confirm it's there). No schema change, but the controller for playlist reordering must replace the entire array, not diff it.

---

### 6.6 User-Curated vs App-Curated Playlists

**Current legacy:** 5 hardcoded "curated" playlists exist as JS files alongside user-created ones.

**UI implication from `PlaylistsHomeScreen`:** The grid mixes curated and user playlists. We need to distinguish them visually (e.g., a "Curated" badge) and functionally (curated playlists are read-only).

**Schema addition:**
```
playlists/{playlistId}
  └── isCurated: boolean      # true for app-managed playlists; disables edit/delete in UI
```

---

### 6.7 Profile — Following / Followers (Not in Legacy, But UI Will Surface It)

**Current plan:** `UserProfile` has no social graph fields.

**UI Tension:** `CreatorProfileScreen` (B4) currently shows only story/playlist counts. In almost any audio social app, users expect to follow creators. Even if we don't build "following" in Phase 2, the schema should have a placeholder to avoid a costly migration later.

**Recommendation (optional, non-blocking for Phase 2):**
```
users/{userId}
  └── followerCount: number   # denormalized; incremented by Cloud Function
                               # (not blocking Phase 2 — add field but don't populate)
```

---

## 7. Open Questions for the Style Guide

These are the specific decisions I need from you before generating the base UI component library. I've organized them by urgency — **Tier 1** blocks work; **Tier 2** can be deferred.

---

### Tier 1 — Blocks Component Development

**Q1 — Tag System Design**
Should story tags be:
- **Fixed (6 predefined):** Simpler to implement, consistent vocabulary
- **User-defined (open text + autocomplete):** More flexible, requires `tags` collection

*This affects `TagPicker` component design and `Story` schema.*

---

**Q2 — Light Mode**
Is dark mode the only supported mode for Phase 2, or do we need light mode from day one?

The token system supports both, but light mode color values (background, surface, text colors) are undefined in the current palette. If light mode is required, I need:
- Light `bg` color (currently `#0f1117` dark)
- Light `surface` color (currently `#1a1f2e` dark)
- Light `textPrimary` color (currently `#f1f5f9` near-white)

---

**Q3 — Typography: Font Choice**
The upgrade plan specifies `fontFamily.sans: 'Inter'`. However, the legacy app uses **Montserrat** (loaded via `.ttf` files in `/App/Fonts/`). Two options:
- **Keep Inter** — modern, excellent legibility, free via `@fontsource/inter`, consistent with the web app
- **Keep Montserrat** — preserves the legacy brand voice, familiar to any existing users

*This affects `typography.ts` setup and the expo-font loading strategy.*

---

**Q4 — Spacing Unit**
The current token scale is: `xs: 4, sm: 8, md: 16, lg: 24, xl: 40`. Is this the final scale, or do you want a different base unit or additional sizes (e.g., `2xl: 64`, `3xl: 96`)?

*This affects `layout.ts` and every screen's vertical rhythm.*

---

**Q5 — Bottom Tab Labels**
The legacy app has 3 tabs: **Explore, Record, Playlists**. The new plan adds a **Profile** tab. Confirm:
- Which 4 tabs should the bottom nav have?
- Should "Record" be a central FAB (floating action button) breaking out of the tab bar, or a standard tab item?

*This affects `TabNavigator.tsx` architecture significantly — a central FAB is a different layout pattern.*

---

### Tier 2 — Can Be Deferred (but Document the Default)

**Q6 — Card Border vs Shadow**
`StoryCard` in the legacy app uses a yellow border (`#FCC201`). The upgrade plan tokens suggest surface cards use a subtle border (`rgba(255,255,255,0.06)`). Which treatment is right for the mobile redesign?

*My default: subtle border unless you want the yellow accent back.*

---

**Q7 — Recording Orb Color States**
The legacy orb has two image assets (yellow idle, blue/teal recording). In the new Reanimated implementation, these become programmatic color states. Proposed:
- **Idle:** `color.surface` fill with `color.primary` ring
- **Recording:** `color.primary` fill with pulse glow animation
- **Paused:** `color.secondary` (cream/yellow) fill

*Confirm or specify alternative states.*

---

**Q8 — Icon Library**
The legacy app uses both `@expo/vector-icons` (Ionicons, MaterialIcons) and custom SVG icon components in `/icons/` (50+ files). For the new app:
- **Option A (Recommended):** `@expo/vector-icons` only — no custom SVGs, zero overhead
- **Option B:** Keep custom SVG icons for brand-specific elements (mic, orb states, map pins), use Ionicons for generic UI icons

*My recommendation: Option A for speed, unless specific icons have strong brand identity.*

---

**Q9 — Waveform / Trim Visualization**
`EditStoryScreen` requires a waveform-like audio trimmer visualization. Options:
- **Static bars (fast):** Render fixed-height gradient bars as a placeholder; no actual waveform data
- **Actual waveform (slow):** Use `expo-av` to sample amplitude data and render real waveform bars

*My recommendation: Static bars for Phase 2 UI-first. Real waveform is a Phase 3 enhancement.*

---

**Q10 — Navigation Transition Style**
Default Expo Router / React Navigation transitions are iOS-native slide (right-to-left push). The legacy app used the same. Should we keep native transitions or use custom Reanimated transitions (e.g., a fade-up for modals, a scale for the record flow)?

*Default to native unless you have a specific motion language in mind.*

---

### Summary Table of Decisions Needed

| # | Question | Blocks | My Default If Unspecified |
|---|---|---|---|
| Q1 | Tag system: Fixed vs open | `TagPicker`, `Story` schema | Fixed 6 tags |
| Q2 | Light mode in scope? | Theme file, tokens | Dark only |
| Q3 | Font: Inter vs Montserrat | `typography.ts`, font loading | Inter |
| Q4 | Spacing scale complete? | `layout.ts` | Current scale is final |
| Q5 | Tab structure + Record as FAB? | `TabNavigator.tsx` | 4 standard tabs |
| Q6 | Card treatment | `StoryCard` | Subtle border |
| Q7 | Orb color states | `RecordingOrb.tsx` | Primary/secondary/surface |
| Q8 | Icon strategy | All icon usage | `@expo/vector-icons` only |
| Q9 | Waveform fidelity | `AudioTrimmer.tsx` | Static bars placeholder |
| Q10 | Transition style | `navigation/` | Native default |

---

*Once Q1–Q5 are answered, code generation can begin with the atoms, `typography.ts`, `layout.ts`, and `TabNavigator.tsx` in parallel.*
