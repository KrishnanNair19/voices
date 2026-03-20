# Voices Web App — Development Planning

> **Stack:** Vite 7 · React 19 · MUI v6 · React Router v6 · Firebase v11 · `@vis.gl/react-google-maps`
> **Shared logic:** `@voices/core` (auth, Firestore hooks, Zustand stores, design tokens, types)
> **Status:** Phase 3 (Core Web App) — not yet started

---

## Table of Contents

1. [Overview & Design Philosophy](#1-overview--design-philosophy)
2. [packages/core — Required Additions](#2-packagescore--required-additions)
3. [Web App Architecture](#3-web-app-architecture)
4. [Phase 3.1 — Foundation](#phase-31--foundation-app-shell-auth-routing)
5. [Phase 3.2 — Explore & Listen](#phase-32--explore--listen)
6. [Phase 3.3 — Story Creation (Multi-Format)](#phase-33--story-creation-multi-format-upload)
7. [Phase 3.4 — Playlists](#phase-34--playlists)
8. [Phase 3.5 — Profile & Social](#phase-35--profile--social)
9. [Phase 3.6 — Polish & Deploy](#phase-36--polish--deploy)
10. [Phase 4 — Text Messaging Ingestion Service](#phase-4--text-messaging-ingestion-service)
11. [Phase 5 — AI Integrations](#phase-5--ai-integrations)
12. [Dependencies](#12-dependencies)
13. [Web vs. Mobile Adaptation Reference](#13-web-vs-mobile-adaptation-reference)

---

## 1. Overview & Design Philosophy

The Voices web app is a **browser-first companion** to the mobile app. It targets desktop and tablet users who want to explore geo-tagged stories on a large map, upload multi-format content, and manage playlists — all in a rich web experience.

### Key Differences from Mobile

| Dimension | Mobile (`apps/mobile`) | Web (`apps/web`) |
|---|---|---|
| Navigation | Bottom tab bar | Top navbar + sidebar panel |
| Layout | Single-column full-screen | Multi-column (map + sidebar) |
| Story input | Voice memos only | Voice, text, images, videos |
| Maps library | `react-native-maps` | `@vis.gl/react-google-maps` |
| Audio | `expo-av` | Web Audio API + `MediaRecorder` |
| UI system | React Native Paper v5 | MUI v6 + Emotion |
| Auth guards | `RootNavigator` status check | React Router `<ProtectedRoute>` |

### Design Token Consistency

Both apps share the same tokens from `@voices/core`:

```
color.primary   #1ddbb5  (teal)          — buttons, accents, waveform
color.secondary #FDF0AF  (cream)         — highlights, badges
color.bg        #0f1117  (near-black)    — page background
color.surface   #1a1f2e  (dark blue-grey) — cards, panels
```

The MUI theme is built entirely from these tokens — no MUI defaults leak through.

### Extended Story Format (Web Feature)

The legacy app was voice-only. The web app expands story content to:

| Content Type | Input Method | Stored As |
|---|---|---|
| `audio` | MediaRecorder browser API | `audioUrl` in Cloud Storage |
| `text` | Rich text editor (TipTap) | `textContent` in Firestore |
| `image` | File upload / drag-and-drop | `mediaUrls[]` in Cloud Storage |
| `video` | File upload | `videoUrl` + `thumbnailUrl` in Cloud Storage |
| `mixed` | Audio + image(s) together | `audioUrl` + `mediaUrls[]` |

---

## 2. packages/core — Required Additions

Before building the web UI, `packages/core` needs the additions below. These are shared between web and mobile — implement in core, then consume in both apps.

### 2.1 Type Changes

**Extend `Story` type** (`packages/core/src/types/story.ts`):

```ts
export type StoryContentType = 'audio' | 'text' | 'image' | 'video' | 'mixed'

export interface Story {
  // ... existing fields remain unchanged ...
  contentType: StoryContentType   // defaults to 'audio' for migrated stories
  textContent?: string            // for 'text' and 'mixed' stories
  mediaUrls?: string[]            // for 'image' and 'mixed' stories (multiple images)
  videoUrl?: string               // for 'video' stories
  thumbnailUrl?: string           // video thumbnail or cover image
  likeCount: number
  commentCount: number
}
```

**New `StoryDraft` type** (for upload wizard state):

```ts
export interface StoryDraft {
  contentType: StoryContentType
  audioBlob?: Blob
  textContent?: string
  mediaFiles?: File[]
  videoFile?: File
  title: string
  description: string
  tags: string[]
  location?: GeoPoint
  locationName?: string
  isPublic: boolean
}
```

**New `Follow` type**:

```ts
export interface Follow {
  followerId: string
  followedId: string
  createdAt: Timestamp
}
```

**New `Comment` type**:

```ts
export interface Comment {
  id: string
  storyId: string
  authorId: string
  text: string
  createdAt: Timestamp
}
```

### 2.2 Firestore Hooks to Add

All hooks go in `packages/core/src/hooks/`. Export from `packages/core/src/index.ts`.

| Hook | File | Description |
|---|---|---|
| `useStories(filters?)` | `hooks/useStories.ts` | Paginated public story feed, optional tag/location filter |
| `useStory(id)` | `hooks/useStory.ts` | Single story by ID; increments `playCount` on mount |
| `useUserStories(userId)` | `hooks/useUserStories.ts` | All stories by a given user |
| `useCreateStory()` | `hooks/useCreateStory.ts` | Mutation: upload files to Storage + write Firestore doc |
| `usePlaylists(userId?)` | `hooks/usePlaylists.ts` | User's playlists or all public playlists |
| `usePlaylist(id)` | `hooks/usePlaylist.ts` | Single playlist with resolved story list |
| `useCreatePlaylist()` | `hooks/usePlaylist.ts` | Mutation: create playlist |
| `useUpdatePlaylist()` | `hooks/usePlaylist.ts` | Mutation: add/remove stories, rename |
| `useDeletePlaylist()` | `hooks/usePlaylist.ts` | Mutation: delete playlist |
| `useFollowUser()` | `hooks/useFollow.ts` | Mutation: follow a user |
| `useUnfollowUser()` | `hooks/useFollow.ts` | Mutation: unfollow a user |
| `useIsFollowing(targetId)` | `hooks/useFollow.ts` | Reactive follow status bool |
| `useComments(storyId)` | `hooks/useComments.ts` | Real-time comment subscription |
| `useAddComment()` | `hooks/useComments.ts` | Mutation: post comment |

### 2.3 Zustand Stores to Add

**`usePlayerStore`** (`packages/core/src/stores/playerStore.ts`):
> Referenced in upgrade-plan.md but not yet implemented. Both web and mobile will subscribe.

```ts
interface PlayerStore {
  activeStoryId: string | null
  isPlaying: boolean
  currentTimeMs: number
  durationMs: number
  play: (storyId: string) => void
  pause: () => void
  seek: (ms: number) => void
  setDuration: (ms: number) => void
  reset: () => void
}
```

**`useUploadStore`** (`packages/core/src/stores/uploadStore.ts`):
> Holds in-progress story creation state across wizard steps.

```ts
interface UploadStore {
  draft: StoryDraft | null
  currentStep: number
  isUploading: boolean
  uploadProgress: number    // 0–100
  error: string | null
  setDraft: (partial: Partial<StoryDraft>) => void
  setStep: (step: number) => void
  reset: () => void
}
```

### 2.4 Utility Functions to Add

Location: `packages/core/src/utils/`

```ts
// formatDuration.ts
export function formatDuration(ms: number): string  // 182000 → "3:02"

// dateUtils.ts
export function relativeTime(date: Date | Timestamp): string  // "2 hours ago"
export function formatDate(date: Date | Timestamp): string    // "March 19, 2026"

// geoUtils.ts
export async function reverseGeocode(lat: number, lng: number): Promise<string>
export function distanceBetween(a: GeoPoint, b: GeoPoint): number  // km

// storageUtils.ts
export async function uploadFile(
  file: File | Blob,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string>  // returns download URL
```

### 2.5 Firestore Schema Additions

```
stories/{storyId}
  + contentType: 'audio' | 'text' | 'image' | 'video' | 'mixed'
  + textContent?: string
  + mediaUrls?: string[]
  + videoUrl?: string
  + thumbnailUrl?: string
  + likeCount: number
  + commentCount: number

stories/{storyId}/comments/{commentId}
  ├── authorId: string
  ├── text: string
  └── createdAt: Timestamp

follows/{followerId}__{followedId}
  ├── followerId: string
  ├── followedId: string
  └── createdAt: Timestamp
```

---

## 3. Web App Architecture

### Directory Structure

```
apps/web/src/
├── app/
│   ├── App.tsx                    — root component, provider tree
│   ├── router.tsx                 — React Router v6, lazy-loaded routes
│   └── providers.tsx              — ThemeProvider, QueryClientProvider, HelmetProvider
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── ProtectedRoute.tsx — redirects unauthenticated users
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       └── SignUpPage.tsx
│   │
│   ├── onboarding/
│   │   ├── components/            — web-adapted step components
│   │   └── pages/OnboardingPage.tsx — wizard controller
│   │
│   ├── explore/
│   │   ├── components/
│   │   │   ├── StoryMap.tsx       — Google Maps with story markers
│   │   │   ├── StoryMapMarker.tsx — custom info-window marker
│   │   │   ├── StorySidebar.tsx   — scrollable story list panel
│   │   │   ├── StoryCard.tsx      — story preview card
│   │   │   └── FilterBar.tsx      — tag chips + search
│   │   └── pages/ExplorePage.tsx  — map + sidebar split layout
│   │
│   ├── story/
│   │   ├── components/
│   │   │   ├── AudioWaveform.tsx  — Web Audio API canvas waveform
│   │   │   ├── AudioScrubber.tsx  — MUI Slider with time labels
│   │   │   ├── StoryMeta.tsx      — title, author, tags, location
│   │   │   ├── CommentSection.tsx
│   │   │   └── RelatedStories.tsx
│   │   └── pages/StoryListenPage.tsx
│   │
│   ├── create/
│   │   ├── components/
│   │   │   ├── ContentTypePicker.tsx  — choose audio/text/image/video
│   │   │   ├── AudioRecorder.tsx      — MediaRecorder + waveform preview
│   │   │   ├── TextEditor.tsx         — TipTap rich text editor
│   │   │   ├── MediaUploader.tsx      — drag-and-drop image/video
│   │   │   ├── StoryMetaForm.tsx      — title, description, tags
│   │   │   ├── LocationPicker.tsx     — click-on-map to set location
│   │   │   └── PublishPreview.tsx     — final review before upload
│   │   └── pages/CreateStoryPage.tsx  — multi-step wizard
│   │
│   ├── playlists/
│   │   ├── components/
│   │   │   ├── PlaylistCard.tsx
│   │   │   ├── PlaylistStoryList.tsx
│   │   │   └── CreatePlaylistModal.tsx
│   │   └── pages/
│   │       ├── PlaylistsPage.tsx
│   │       └── PlaylistDetailPage.tsx
│   │
│   └── profile/
│       ├── components/
│       │   ├── ProfileHeader.tsx   — avatar, stats, follow button, bio
│       │   ├── StoryGrid.tsx       — masonry grid of user's stories
│       │   └── AvatarUpload.tsx    — drag-and-drop avatar update
│       └── pages/
│           ├── ProfilePage.tsx
│           └── EditProfilePage.tsx
│
├── shared/
│   ├── components/
│   │   ├── AppNavbar.tsx           — top nav: logo, links, user menu
│   │   ├── AppShell.tsx            — navbar + <Outlet> layout wrapper
│   │   ├── StoryCard.tsx           — reused across explore + playlists
│   │   ├── Avatar.tsx              — image with fallback initials
│   │   ├── EmptyState.tsx          — icon + message for empty lists
│   │   ├── PageSkeleton.tsx        — MUI Skeleton loading states
│   │   └── ConfirmDialog.tsx       — reusable confirmation modal
│   └── hooks/
│       ├── useDebounce.ts
│       ├── useIntersectionObserver.ts  — infinite scroll trigger
│       └── useWebAudio.ts              — Web Audio API playback hook
│
├── theme/
│   ├── theme.ts                    — MUI createTheme from @voices/core tokens
│   └── globals.css                 — CSS custom properties + font import
│
└── assets/
    └── icons/                      — SVG icons (via vite-plugin-svgr)
```

### Route Map

| Path | Component | Auth Required |
|---|---|---|
| `/` | `ExplorePage` | No (public stories visible) |
| `/story/:id` | `StoryListenPage` | No |
| `/create` | `CreateStoryPage` | Yes |
| `/playlists` | `PlaylistsPage` | No |
| `/playlists/:id` | `PlaylistDetailPage` | No |
| `/profile/:username` | `ProfilePage` | No |
| `/profile/edit` | `EditProfilePage` | Yes |
| `/login` | `LoginPage` | No |
| `/signup` | `SignUpPage` | No |
| `/onboarding` | `OnboardingPage` | Yes (new users only) |

---

## Phase 3.1 — Foundation (App Shell, Auth, Routing)

**Goal:** A working app skeleton — themed app shell, auth pages, route guards, onboarding wizard.

### Steps

**1. Install dependencies**

```bash
pnpm --filter @voices/web add \
  @mui/material @mui/icons-material \
  @emotion/react @emotion/styled \
  react-router-dom \
  react-helmet-async \
  @fontsource/inter
```

**2. MUI Theme** (`src/theme/theme.ts`)
- `createTheme` using `@voices/core` tokens
- Dark mode palette, Inter font, component overrides:
  - `MuiButton`: pill shape (`borderRadius: tokens.radius.pill`), gradient primary, no uppercase
  - `MuiCard`: glass-style border (`1px solid rgba(255,255,255,0.06)`), `backdropFilter: blur(12px)`
  - `MuiSlider`: thin track (3px), teal thumb glow on hover
  - `MuiTextField`: dark fill, teal focus ring

**3. App Shell** (`src/shared/components/AppShell.tsx`)
- Top navbar: logo left, nav links center (Explore, Create, Playlists), avatar menu right
- `<Outlet>` for page content
- Persistent mini audio player bar at bottom when `usePlayerStore.activeStoryId !== null`

**4. Router** (`src/app/router.tsx`)
- `createBrowserRouter` with `React.lazy` + `<Suspense>` for all feature pages
- `ProtectedRoute` wraps auth-required routes (reads `useAuthStore.status`)
- `OnboardingGuard` redirects `status === 'onboarding'` users to `/onboarding`

**5. Auth Pages** — reuse `signInWithEmail`, `signUpWithEmail`, `useAuthStore` from `@voices/core`
- `LoginPage`: email/password + Google sign-in button
- `SignUpPage`: name, email, password
- Email verification notice (mirrors mobile `EmailVerificationPendingScreen`)

**6. Onboarding Wizard** — web-adapted from mobile's 5-step flow
- Reuses `useOnboardingStore` from `@voices/core`
- Steps: Welcome → Display Name → Username → Profile Photo + Bio → Interests
- MUI `Stepper` for progress indication (instead of stack navigation)

### Deliverables
- [ ] MUI theme applied, no MUI defaults visible
- [ ] Login and signup working via Firebase Auth
- [ ] Auth guards redirect unauthenticated users
- [ ] Onboarding wizard completes and writes to Firestore
- [ ] App shell renders on all routes with mini-player slot

---

## Phase 3.2 — Explore & Listen

**Goal:** The core discovery experience — full-page map with story markers, sidebar list, and story listen page with waveform.

### Layout

```
┌─ AppNavbar ───────────────────────────────────────────┐
│                                                        │
├──────────────────────────────┬─────────────────────────┤
│                              │  FilterBar (tags/search)│
│    Google Maps               │  ──────────────────     │
│    (60% viewport width)      │  StoryCard              │
│                              │  StoryCard              │
│    story markers on map      │  StoryCard              │
│                              │  (scrollable, 40% width)│
└──────────────────────────────┴─────────────────────────┘
```

### Steps

**1. Install Google Maps**
```bash
pnpm --filter @voices/web add @vis.gl/react-google-maps
```

**2. StoryMap** (`features/explore/components/StoryMap.tsx`)
- `<APIProvider>` + `<Map>` from `@vis.gl/react-google-maps`
- Custom circular story markers (cover image + teal ring)
- Click marker → highlight card in sidebar + open info popup
- Dark map style ("Aubergine" or custom JSON) to match app theme
- Viewport-bound query: only load stories visible in current map bounds

**3. StorySidebar** — virtualized story list for performance
- Filters: tag chips, text search (debounced 300ms), content type selector
- `useStories(filters)` from core (TanStack Query, paginated)
- Infinite scroll via `useIntersectionObserver`

**4. StoryCard** (shared component)
- Cover image or content-type icon fallback (teal background)
- Title, author avatar + name, duration or word count, tag chips
- Play button → `usePlayerStore.play(storyId)`
- Three-dot menu: Add to Playlist, Share, View Profile

**5. StoryListenPage** (`features/story/pages/StoryListenPage.tsx`)
- `useStory(id)` increments play count on mount
- Renders by content type:
  - `audio`: `AudioWaveform` canvas + `AudioScrubber` (MUI Slider) + play controls
  - `text`: rendered rich text with estimated read time header
  - `image`: lightbox gallery (MUI Dialog + image carousel)
  - `video`: `<video>` element with custom-styled controls
- Story metadata: mini map thumbnail, tags, author card with follow button
- Comment section
- Related stories strip (same tags or location)
- SEO: `react-helmet-async` sets `og:title`, `og:image`, `og:url`

**6. `useWebAudio` hook** (`shared/hooks/useWebAudio.ts`)
- Manages `AudioContext`, `AudioBufferSourceNode`
- Decodes remote `audioUrl` → `AudioBuffer` for waveform visualization
- Exposes: `play()`, `pause()`, `seek(ms)`, `currentTime`, `isPlaying`, `waveformData: Float32Array`
- Syncs playback state with `usePlayerStore`

### Deliverables
- [ ] Map renders story markers from Firestore
- [ ] Sidebar filters work (tag, search, content type)
- [ ] StoryListenPage plays audio with waveform visualization
- [ ] StoryListenPage renders text/image/video stories
- [ ] SEO meta tags present on story pages
- [ ] Mini player in AppShell reflects playback state

---

## Phase 3.3 — Story Creation (Multi-Format Upload)

**Goal:** Multi-step creation wizard supporting voice, text, images, and video — all with geo-tagging.

### Wizard Steps

```
Step 1 — Choose Format
  [🎤 Voice Memo]  [✍️ Written Story]  [🖼️ Photo Journal]  [🎬 Video]

Step 2 — Create Content
  Voice:  MediaRecorder → live waveform → dual-handle trim
  Text:   TipTap editor (bold, italic, headings, blockquote)
  Image:  Drag-and-drop zone, multiple files, reorder grid
  Video:  Single file upload, auto-extract first frame as thumbnail

Step 3 — Story Details
  Title (required), Description, Tags (multi-select chips)

Step 4 — Pick Location
  Google Maps click-to-place pin → auto-reverse-geocode to location name
  "Use my location" button (navigator.geolocation)

Step 5 — Preview & Publish
  Summary card showing all content → Upload button → progress bar
```

### Steps

**1. Install TipTap**
```bash
pnpm --filter @voices/web add \
  @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-placeholder
```

**2. `useUploadStore`** in `packages/core` — holds `StoryDraft` state across wizard steps

**3. `AudioRecorder` component**
- `MediaRecorder` API for browser recording
- Live animated waveform during recording (Web Audio API `AnalyserNode` + canvas)
- Dual-handle trim UI (CSS-based range inputs layered over waveform)
- Preview playback before proceeding

**4. `MediaUploader` component** — drag-and-drop using HTML File API + `FileReader`
- Image: preview grid with drag-to-reorder
- Video: upload + extract first frame via `<canvas>` as thumbnail

**5. `LocationPicker` component** — full Google Maps with click-to-pin
- `reverseGeocode(lat, lng)` from core utils to auto-fill location name field

**6. Upload flow** via `useCreateStory` mutation from core
- Upload all files to Firebase Storage with `onProgress` callback → `useUploadStore.uploadProgress`
- Write Firestore doc with typed `storyConverter`
- Redirect to `/story/:newId` on success

### Deliverables
- [ ] All four content type flows complete end-to-end
- [ ] Files upload to Firebase Storage
- [ ] Story appears in Explore map + sidebar after publish
- [ ] Location pin renders correctly on Explore map

---

## Phase 3.4 — Playlists

**Goal:** Browse and manage playlists; add stories from any story card.

### Steps

**1. PlaylistsPage** — two sections: "My Playlists" + "Featured" (public playlists)
- MUI Grid of `PlaylistCard` (cover image, title, story count, owner avatar)

**2. PlaylistDetailPage**
- Header: cover image, title, description, share button
- Tab view: **Story List** | **Map View** (all story locations on mini-map)
- "Play All" button → queues stories in `usePlayerStore`

**3. Add to Playlist** — context menu on `StoryCard`
- Popover listing user's playlists + "Create New" option
- `useUpdatePlaylist` mutation from core

**4. `CreatePlaylistModal`** — title, description, optional cover image upload

### Deliverables
- [ ] Playlists render from Firestore
- [ ] Add/remove stories from playlists
- [ ] Playlist map view shows all story location pins
- [ ] Create and delete playlists work

---

## Phase 3.5 — Profile & Social

**Goal:** User profiles with story grid, follower counts, and follow/unfollow.

### Steps

**1. ProfilePage** (`/profile/:username`)
- Header: avatar, display name, `@username`, bio, stats row (stories · followers · following)
- Follow/Unfollow button (hidden on own profile) → `useFollowUser` / `useUnfollowUser`
- Story Grid: masonry layout, content-type badge overlay on each card
- Playlists grid below stories

**2. EditProfilePage** (`/profile/edit`)
- `AvatarUpload`: drag-and-drop with crop dialog (`<canvas>`-based)
- Display name, username (debounced uniqueness check against `usernames/` collection)
- Bio (max 160 chars with live counter)
- `useUpdateUserProfile` mutation from core

### Deliverables
- [ ] Profile pages render from Firestore data
- [ ] Follow/unfollow updates Firestore and reflects instantly
- [ ] Avatar upload works via Firebase Storage
- [ ] Edit profile saves successfully

---

## Phase 3.6 — Polish & Deploy

### Performance
- `vite.config.ts` `manualChunks`: react/router, MUI, firebase, maps, query — separate chunks
- All feature pages via `React.lazy` + `<Suspense fallback={<PageSkeleton />}>`
- Targets: Lighthouse > 90, LCP < 2.5s, initial JS < 150KB gzipped

### Testing
- **Vitest** unit tests for all `packages/core` hooks + utils (MSW for Firebase mocking)
- **@testing-library/react** component tests for key pages
- **Playwright** E2E: sign-up → onboarding, create story, explore + listen

### Deploy
- **Firebase Hosting**: `firebase.json` rewrites all paths to `index.html` (SPA routing)
- **GitHub Actions CI/CD**: typecheck → lint → test → build → deploy on merge to `main`
- Environment variables: GitHub Secrets → `VITE_FIREBASE_*`

---

## Phase 4 — Text Messaging Ingestion Service

> **Prerequisite:** Core web app complete (Phases 3.1–3.6)

### Architecture

```
Your phone
    │  SMS/MMS to Twilio number
    ▼
Twilio Gateway
    │  HTTP POST webhook
    ▼
Firebase Cloud Function (Node.js)
  ├── Validate Twilio request signature
  ├── Parse message type (text / MMS photo / MMS video / location share)
  ├── Download MMS media → re-upload to Firebase Storage (permanent)
  ├── Call Gemini API to expand terse texts → full journal entries
  └── Write to Firestore: messages/{userId}/items/{msgId}
    │
    ▼  (optional batch step)
Cloud Scheduler (nightly)
    │  Pending messages → auto-generate Story drafts
    ▼
Voices Story Feed
```

### Message Types & Command Routing

| SMS Content | Detection | Firestore Destination |
|---|---|---|
| Plain text | Default | `messages/{uid}/items` as `type: 'text'` |
| `#food Best ramen` | `#tag` prefix regex | Same, with `tag: 'food'` |
| `#reflect Tired but grateful` | `#reflect` prefix | `messages/{uid}/reflections` |
| `#route` + Google Maps URL | URL regex extract lat/lng | `messages/{uid}/locations` |
| MMS photo | `NumMedia > 0`, `image/*` | Auto-create Story draft |
| MMS video | `NumMedia > 0`, `video/*` | Auto-create Story draft |

### Gemini Text Expansion

```
Input:  "Rough day in Sapa. Worth it tho"

Prompt: "You are a travel journalist. Expand this voice note into a
         2-paragraph journal entry in first person. Keep the original
         tone and correct any typos. Input: {rawText}"

Output: "Today in Sapa, the climb was punishing — my legs gave out twice
         on the ascent, and the mountain mist soaked through my jacket
         before noon. But at the summit, with the valley spread out below
         me like a hand-drawn map, every aching step dissolved into
         something close to gratitude..."
```

### Firestore Schema (Phase 4 Additions)

```
messages/{userId}/items/{msgId}
  ├── type: 'text' | 'photo' | 'video' | 'location'
  ├── rawText: string
  ├── expandedText?: string          — Gemini output
  ├── mediaUrl?: string              — re-uploaded to Storage
  ├── location?: GeoPoint
  ├── tag?: string                   — from #hashtag command
  ├── processedAt: Timestamp
  └── convertedToStoryId?: string    — set when auto-published
```

### Web UI (Phase 4 Web Feature)

- **Messages page** (`/messages`): timeline view of all received SMS/MMS
- **Draft review cards**: Gemini-expanded text with "Publish as Story" button
- **Settings**: link Twilio phone number to your Voices account

---

## Phase 5 — AI Integrations

> **Prerequisite:** Text messaging service complete (Phase 4)

### Feature A — Voice Enhancement & Mood Background

**Goal:** Automatically clean audio quality and add ambient music matched to story sentiment.

**Stack:** Dolby.io Media Enhance API (or ElevenLabs Audio Isolation)

**Flow:**
1. Firebase Cloud Function triggers on new `stories/{storyId}` where `contentType === 'audio'`
2. Download audio from Storage → POST to Dolby.io `/media/enhance`
3. Re-upload enhanced audio → update `story.enhancedAudioUrl` in Firestore
4. Gemini sentiment analysis on transcript → classify mood: `calm | energetic | melancholy | wonder`
5. Select ambient track from pre-licensed library → mix at ~15% volume
6. Store `enhancedAudioUrl` and `moodTag` on the Story document

**Web UI additions:**
- Audio player "Enhanced" badge when `enhancedAudioUrl` exists
- Toggle: Original ↔ Enhanced audio
- Story creation step 2: opt-in checkbox "Enhance my audio with AI"

---

### Feature B — Chapter Auto-Generation

**Goal:** Automatically group stories by geography + time into named travel chapters, with no user action.

**Stack:** Gemini API + Cloud Scheduler (nightly job)

**Algorithm:**
1. **Cluster stories** by GeoPoint proximity (DBSCAN, ~50km radius) AND date proximity (±3 days)
2. **Name each cluster**: Gemini prompt with story titles + location names + dates → `"The Loop: Ha Giang"`
3. **Generate summary**: Gemini synthesizes transcripts → 150-word chapter overview
4. **Highlight reel**: rank stories by `playCount + likeCount`, pick top 5
5. **Map route**: chronologically ordered GeoPoints → stored as `routePoints: GeoPoint[]`

**Firestore Schema (Phase 5 Additions):**

```
journeys/{userId}/chapters/{chapterId}
  ├── title: string                  — "The Loop: Ha Giang"
  ├── summary: string                — 150-word Gemini summary
  ├── storyIds: string[]             — ordered highlight reel
  ├── routePoints: GeoPoint[]        — map polyline
  ├── startDate: Timestamp
  ├── endDate: Timestamp
  ├── coverImageUrl?: string         — from highest-ranked story
  └── generatedAt: Timestamp
```

**Web UI — Journeys Page** (`/journeys`):

```
┌─ Your Journeys ────────────────────────────────────────┐
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Ha Giang Loop    │  │ Da Nang Coast    │            │
│  │  Mar 12–15       │  │  Mar 16–18       │            │
│  │  8 stories       │  │  5 stories       │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  Chapter detail: polyline route + story highlight reel  │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Dependencies

### apps/web — To Add

```bash
# UI & Styling
pnpm --filter @voices/web add \
  @mui/material @mui/icons-material \
  @emotion/react @emotion/styled \
  @fontsource/inter

# Routing & SEO
pnpm --filter @voices/web add \
  react-router-dom \
  react-helmet-async

# Maps
pnpm --filter @voices/web add \
  @vis.gl/react-google-maps

# Rich Text Editor
pnpm --filter @voices/web add \
  @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-placeholder

# Dev & Testing
pnpm --filter @voices/web add -D \
  vite-plugin-svgr \
  vitest @vitest/coverage-v8 \
  @testing-library/react @testing-library/user-event \
  jsdom \
  @playwright/test
```

### packages/core — No New Runtime Deps

Firebase, TanStack Query, and Zustand are already in core. New hooks/stores/utils use existing deps only.

### Firebase Cloud Functions (Phase 4+)

```bash
# In functions/ directory (to be created in Phase 4)
npm install twilio @google/generative-ai node-fetch form-data
```

---

## 13. Web vs. Mobile Adaptation Reference

| Mobile Screen | Web Equivalent | Key Differences |
|---|---|---|
| `LandingScreen` | `LoginPage` hero section | Full-width with map background |
| `EmailLoginScreen` / `EmailSignUpScreen` | `LoginPage` / `SignUpPage` | MUI `TextField` + `Button` |
| `OnboardingWelcomeScreen` → `OnboardingInterestsScreen` | `OnboardingPage` wizard | MUI `Stepper`, not stack navigation |
| `MainMapScreen` | `ExplorePage` left panel | Map fills 60% of viewport |
| `StoryListScreen` | `ExplorePage` right sidebar | Vertical scrollable list, not circular carousel |
| `StoryListenScreen` | `StoryListenPage` | Multi-format; not audio-only |
| `Profile.js` (author view) | `ProfilePage` | Story masonry grid, not vertical list |
| `RecordHome` → `Confirmation` | `CreateStoryPage` wizard | Multi-format; MUI `Stepper`; MediaRecorder |
| `PlaylistHome` | `PlaylistsPage` | MUI card grid |
| `PlaylistListView` | `PlaylistDetailPage` | Tab: list + map view |
| `UserProfile` | `EditProfilePage` | Avatar crop dialog, bio char counter |

---

*Last updated: 2026-03-19*
*Phase 0 ✅ · Phase 1 ✅ · Phase 2 (mobile, pending) · Phase 3 (this doc — web) · Phase 4 (SMS) · Phase 5 (AI)*
