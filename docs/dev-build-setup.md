# Development & Deployment Guide

## Strategy overview

| Goal | Tool | Cost |
|---|---|---|
| Local iOS development | `expo run:ios` → iOS Simulator | Free (needs Xcode) |
| Quick layout/logic checks | `expo start --web` | Free |
| Recruiter demo | Expo Web export → Vercel | Free |
| iOS visual portfolio coverage | Screen-record Simulator | Free |

**Why not Expo Go?** Expo Go bundles a fixed set of pre-compiled native modules. Any version mismatch (e.g. `react-native-reanimated`) causes a runtime crash. `expo run:ios` compiles your exact dependency tree locally — this is permanently solved.

**Why not EAS cloud builds for iOS?** EAS iOS builds require a paid Apple Developer account ($99/yr) even for internal/dev distribution. `expo run:ios` achieves the same result locally using Xcode for free.

**Why Expo Web for recruiter demos?** You write the app once in `apps/mobile`. `expo export --platform web` produces static files deployable to Vercel. Recruiters get a browser URL with no installs required.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [One-time setup](#2-one-time-setup)
3. [Daily local development](#3-daily-local-development)
4. [Firebase emulator](#4-firebase-emulator)
5. [Deploying to Vercel (Expo Web)](#5-deploying-to-vercel-expo-web)
6. [Cache clearing and dependency reinstall](#6-cache-clearing-and-dependency-reinstall)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

| Requirement | Version | Check / Install |
|---|---|---|
| Node | >= 20 | `node --version` |
| pnpm | 10.x | `pnpm --version` |
| Xcode | Latest | Mac App Store (~15GB) |
| Xcode CLI tools | Latest | `xcode-select --install` |
| iOS Simulator | Included with Xcode | Open Xcode → Settings → Platforms → iOS |

No Apple Developer account needed. No EAS CLI needed for iOS local development.

---

## 2. One-time setup

### 2a. Install Xcode command line tools

```bash
xcode-select --install
```

If already installed you'll see: `error: command line tools are already installed`. That's fine.

### 2b. Install dependencies from the monorepo root

```bash
pnpm install
```

### 2c. Build shared packages

`@voices/core` must be built before the mobile app can compile:

```bash
pnpm build
```

### 2d. Run the iOS build for the first time

```bash
cd apps/mobile
npx expo run:ios
```

On first run this will:
1. Run `expo prebuild` to generate the native `ios/` Xcode project inside `apps/mobile/`
2. Compile the native app with Xcode (~3–8 minutes)
3. Boot an iOS Simulator and install the app automatically

Subsequent runs are much faster because Xcode caches the native build. You only do a full native recompile when native dependencies change.

> **Note on the generated `ios/` folder:** `expo prebuild` generates `apps/mobile/ios/` and `apps/mobile/android/`. These are build artefacts — they are gitignored and can be regenerated at any time by running `expo prebuild` or `expo run:ios`.

---

## 3. Daily local development

### Start a dev session

You have two options depending on what you're working on:

**Option A — Native iOS Simulator (primary)**

```bash
cd apps/mobile
npx expo run:ios
```

Launches the Simulator with your app. Metro starts automatically and serves the JS bundle.

To pick a specific simulator device:
```bash
npx expo run:ios --device   # interactive device picker
```

**Option B — Vite web app (`apps/web`)**

```bash
# from monorepo root:
pnpm dev:web
```

Opens at `http://localhost:5173`. This is the standalone Vite/React web app — not the mobile app running in a browser.

**Option C — Mobile app in browser (quick layout checks)**

```bash
cd apps/mobile
npx expo start --web
# or from monorepo root:
pnpm dev:mobile   # starts Metro; press 'w' to open web
```

Good for fast iteration on layout and logic that doesn't use native APIs. Not a substitute for testing on the Simulator.

### Hot reload

- **JS/UI changes** → Metro hot-reloads instantly. No native rebuild needed.
- **New package with native code** → re-run `npx expo run:ios` to trigger a native rebuild.
- **Shake gesture** (or `Cmd+D` in Simulator) → opens Expo dev menu (reload, inspector, etc.)
- **`r` in the Metro terminal** → manual JS reload

### When you need a full native rebuild

Re-run `npx expo run:ios` any time you:
- Add or remove a package that has native code (e.g. `expo-camera`, `expo-location`)
- Change `app.json` fields that affect native config (permissions, bundle ID, etc.)
- Pull changes from a teammate that modified `package.json` native deps

---

## 4. Firebase emulator

The Firebase emulator suite lets you develop and test against local Firebase services (Auth, Firestore, Storage) without touching the production project `voices-9a030`.

### Prerequisites

```bash
npm install -g firebase-tools   # one-time global install
firebase login                  # authenticate once
```

Verify installation:
```bash
firebase --version   # should be 13+
```

### Starting the emulator

Run from the **monorepo root** (where `firebase.json` lives):

```bash
firebase emulators:start
```

This starts all configured emulators:

| Emulator | Port | URL |
|---|---|---|
| Auth | 9099 | `http://localhost:9099` |
| Firestore | 8080 | `http://localhost:8080` |
| Storage | 9199 | `http://localhost:9199` |
| Emulator UI | 4000 | `http://localhost:4000` |

Open `http://localhost:4000` to browse the Emulator UI — view and edit Firestore documents, inspect Auth users, and browse Storage files.

### Connecting your app to the emulator

In your Firebase initialisation code, add emulator connections after `initializeApp()`:

```ts
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const auth = getAuth()
const db = getFirestore()
const storage = getStorage()

if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}
```

### Running emulator + web app together

Open two terminals:

```bash
# Terminal 1 — monorepo root
firebase emulators:start

# Terminal 2 — monorepo root
pnpm dev:web
```

### Seeding data

To pre-populate Firestore with test data, export/import emulator data:

```bash
# Export current emulator state (while emulator is running)
firebase emulators:export ./emulator-data

# Start emulator with saved data
firebase emulators:start --import=./emulator-data
```

Add `emulator-data/` to `.gitignore` if you don't want to commit seed data.

### Emulator vs production

The emulator runs in `singleProjectMode` (see `firebase.json`), so it uses the project alias `voices-9a030` locally but writes only to local state — nothing touches production Firestore or Auth. To confirm you're hitting the emulator, check the Emulator UI at `http://localhost:4000`.

---

## 5. Deploying to Vercel (Expo Web)


The mobile app is deployed to the web using `expo export --platform web`, producing a static site that Vercel hosts. Recruiters get a public URL — no installs needed.

### 5a. Preview locally before deploying

```bash
cd apps/mobile
npx expo export --platform web   # outputs to apps/mobile/dist/
npx serve dist                   # serve locally to verify
```

### 5b. First-time Vercel setup

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Set these project settings:

| Setting | Value |
|---|---|
| **Root directory** | `apps/mobile` |
| **Framework preset** | Other |
| **Build command** | `npx expo export --platform web` |
| **Output directory** | `dist` |
| **Install command** | `cd ../.. && pnpm install` |

4. Add any environment variables (Firebase keys, etc.) in the Vercel dashboard
5. Click Deploy

### 5c. Subsequent deploys

Push to `main` — Vercel redeploys automatically on every push.

### 5d. What recruiters see

The app renders at mobile width, centered on desktop, full-width on mobile. This looks intentional — it communicates "this is a mobile app" without needing explanation.

---

## 6. Cache clearing and dependency reinstall

### Full reset — start from scratch

Run from the **monorepo root**. Use this when you see stale module errors, Metro resolution failures, or after major dependency changes.

```bash
# Remove all node_modules across the monorepo
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null; true

# Remove lock file
rm -f pnpm-lock.yaml

# Clear Turborepo cache
rm -rf .turbo

# Clear Metro, Expo, and generated native project caches
rm -rf apps/mobile/.expo
rm -rf apps/mobile/dist
rm -rf apps/mobile/ios
rm -rf apps/mobile/android

# Reinstall
pnpm install

# Rebuild shared packages
pnpm build
```

After this, run `npx expo run:ios` from `apps/mobile` — it will regenerate the native project and do a clean native build.

### Mobile-only reset

Use when only the mobile app is misbehaving and you want to avoid a full reinstall.

```bash
# Clear Metro cache and restart
cd apps/mobile && npx expo start --clear

# Wipe generated native projects (forces a clean prebuild next run)
rm -rf apps/mobile/ios apps/mobile/android apps/mobile/.expo
```

### Web export reset

```bash
rm -rf apps/mobile/dist
cd apps/mobile && npx expo export --platform web
```

### Core package reset

```bash
rm -rf packages/core/dist
pnpm --filter @voices/core build
```

### pnpm store prune (last resort)

```bash
pnpm store prune           # removes unreferenced cached packages
# nuclear option:
# rm -rf $(pnpm store path) && pnpm install
```

### After any reset: verify

```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

## 7. Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Worklets mismatch (X vs Y)` | Running with Expo Go | Use `expo run:ios` instead |
| `Unable to resolve module` | Stale Metro cache | `expo start --clear` or mobile-only reset |
| `@voices/core not found` | Core not built | `pnpm --filter @voices/core build` |
| `xcode-select: error` | Xcode CLI tools missing | `xcode-select --install` |
| `No simulator found` | No iOS platform installed | Xcode → Settings → Platforms → add iOS |
| Native build fails after `pnpm install` | Generated `ios/` is stale | Delete `apps/mobile/ios/` and re-run `expo run:ios` |
| Vercel build fails | Wrong root directory | Set root to `apps/mobile` in Vercel project settings |
| `expo export` missing assets | Asset paths wrong | Check `assets/` paths in `app.json` |
| `pnpm add -g eas-cli` fails | pnpm symlink bug | Use `npm install -g eas-cli` (only needed if you use EAS) |
