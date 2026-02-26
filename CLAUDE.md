# Voices — Monorepo Root

## What this project is

Voices is a social audio/storytelling app (think location-aware voice memos + playlists). It is being migrated from a legacy React Native Expo SDK 40 app (JavaScript, no types, Firebase v7) into a modern Turborepo monorepo with strict TypeScript throughout.

The reference for the full migration plan is [upgrade-plan.md](upgrade-plan.md). **Phase 0 (monorepo bootstrap) is complete.** Phase 1 (auth + data layer) has not started.

---

## Monorepo structure

```
Voices/
├── apps/
│   ├── mobile/          @voices/mobile  — Expo SDK 54, React 19, React Native 0.81
│   └── web/             @voices/web     — Vite 7, React 19
├── packages/
│   ├── core/            @voices/core    — shared design tokens + domain types
│   └── tsconfig/        @voices/tsconfig — shared TypeScript configs (no runtime code)
├── package.json         — root; pnpm workspaces, turbo scripts, shared devDeps
├── pnpm-workspace.yaml  — declares apps/* and packages/* as workspace members
├── .npmrc               — shamefully-hoist=true (required for Metro)
├── turbo.json           — task pipeline (build order + caching rules)
└── eslint.config.mjs    — root ESLint config (flat config format, v9)
```

---

## Package manager and tooling

| Tool | Version | Role |
|------|---------|------|
| pnpm | 10.5.2 | Package manager; declared in `packageManager` field |
| Turborepo | ^2.3.0 | Task orchestrator + build cache |
| TypeScript | ^5.7 (root), ~5.9 (apps) | Type checking |
| tsup | ^8.0.0 | Builds `packages/core` into CJS + ESM + `.d.ts` |
| Vite 7 | in `apps/web` | Web dev server and production bundler |
| Expo SDK 54 | in `apps/mobile` | Mobile bundler (Metro under the hood) |

**Always use `pnpm` — never `npm` or `yarn`.** The `packageManager` field enforces this.

---

## Common commands (run from repo root)

```bash
pnpm build             # build all packages in dependency order
pnpm dev:web           # start Vite dev server (apps/web only)
pnpm dev:mobile        # start Expo dev server (apps/mobile only)
pnpm typecheck         # tsc --noEmit across all packages
pnpm lint              # ESLint across all packages
pnpm format            # Prettier across all files
```

To target a single package:
```bash
pnpm --filter @voices/core build
pnpm --filter @voices/web dev
```

---

## Turborepo task pipeline

Defined in [turbo.json](turbo.json). Key rules:

- `build` depends on `^build` — packages build before apps that depend on them
- `@voices/core` must be built before `@voices/mobile` or `@voices/web` can build
- `@voices/mobile#build` runs `tsc --noEmit` (no output files); its turbo task overrides `outputs: []` to suppress the "no output files" warning
- `dev` tasks are `cache: false` and `persistent: true` (long-running servers)
- Turbo caches by file hash; a clean second `pnpm build` completes in ~22ms (`>>> FULL TURBO`)

---

## Shared package: `@voices/core`

Location: [packages/core/](packages/core/)

Built with **tsup** into `dist/` (CJS `.js`, ESM `.mjs`, declarations `.d.ts`). The `exports` field in its `package.json` has `"types"` first (required — bundlers skip it if it appears after `"import"`/`"require"`).

**Current exports:**
- `tokens` — brand design tokens (`as const` object): colors, spacing, radius, fontFamily, fontSize, fontWeight
- Types: `Story`, `GeoPoint`, `UserProfile`, `Playlist`

Both apps import from `@voices/core` using the `workspace:*` protocol — pnpm resolves this to a symlink at install time.

**Design token quick reference:**
```
color.primary   #1ddbb5  (teal)
color.secondary #FDF0AF  (cream)
color.bg        #0f1117  (near-black)
color.surface   #1a1f2e  (dark blue-grey)
```

---

## TypeScript configuration inheritance

```
packages/tsconfig/base.json          strict, noUncheckedIndexedAccess, moduleResolution: Bundler
  └── packages/tsconfig/react-library.json   + jsx: react-jsx, DOM lib
  └── packages/tsconfig/expo.json            + jsx: react-native

packages/core/tsconfig.json         extends react-library.json
apps/web/tsconfig.app.json          extends react-library.json (with paths alias @/*)
apps/mobile/tsconfig.json           extends ../../node_modules/expo/tsconfig.base
                                    (relative path required — bare specifier breaks VSCode)
```

---

## Internal dependency graph

```
@voices/core ← @voices/mobile
@voices/core ← @voices/web
```

`@voices/tsconfig` is a devDependency of `@voices/core` and `@voices/web`. It contains only JSON files (no runtime code, no build step).

---

## Known gotchas

| Gotcha | Fix |
|--------|-----|
| Metro can't resolve workspace packages | `metro.config.js` sets `watchFolders` + `resolver.nodeModulesPaths` to include monorepo root |
| pnpm 10 blocks native build scripts | `pnpm.onlyBuiltDependencies: ["esbuild"]` in root `package.json` |
| `expo/tsconfig.base` not found in VSCode | Use relative path `../../node_modules/expo/tsconfig.base` in mobile tsconfig |
| `"types"` unreachable in package exports | Always list `"types"` before `"import"`/`"require"` in `exports` field |
| `shamefully-hoist=true` in `.npmrc` | Required so Metro can find packages hoisted to root `node_modules` |

---

## Legacy reference

The original app lives at `/Users/krishnannair/SWE-Portfolio/OldVoices`. It is **read-only reference only** — do not modify it. Key issues with the legacy app (relevant context for migration decisions):

- Expo SDK 40, React 16, JavaScript (no TypeScript)
- Firebase 7.9.0 (pre-modular API, hardcoded credentials in source)
- `@material-ui/core` v4, React Navigation v5
- No tests, no CI, scattered `useState` only for state management

---

## What to build next (Phase 1)

Per [upgrade-plan.md](upgrade-plan.md), Phase 1 adds to `packages/core`:
1. Firebase v11 (modular) client initialisation
2. Firestore typed converters for `stories`, `users`, `playlists` collections
3. TanStack Query hooks wrapping Firestore reads
4. Zustand stores for client-side state

The apps themselves (`apps/mobile`, `apps/web`) get their own CLAUDE.md files with app-specific context.
