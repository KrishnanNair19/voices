/**
 * Layout constants, responsive scaling helpers, and component size tokens.
 *
 * ─ Import order ─
 *   layout.ts  <─  typography.ts  (typography imports `clampedScale`)
 *   layout.ts has no intra-styles imports, keeping the dep graph acyclic.
 */

import { Dimensions, Platform, StatusBar } from 'react-native'
import { tokens } from '@voices/core'

// ── Screen Dimensions ─────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

/** iPhone 16 (390pt wide) is the design baseline */
const BASE_WIDTH = 390

export { SCREEN_W, SCREEN_H }

// ── Responsive Scaling ────────────────────────────────────────────────────────

/**
 * Linear scale relative to 390pt design baseline.
 * Use for layout dimensions (icon sizes, component heights, fixed widths).
 */
export const scale = (size: number): number =>
  Math.round((SCREEN_W / BASE_WIDTH) * size)

/**
 * Clamped scale — clamps to ±15% of the base size.
 * Use for typography so text doesn't grow/shrink too aggressively on
 * very small phones (320pt) or large tablets (768pt+).
 */
export const clampedScale = (
  size: number,
  min = size * 0.85,
  max = size * 1.15,
): number => Math.round(Math.min(max, Math.max(min, scale(size))))

// ── Spacing ───────────────────────────────────────────────────────────────────
/**
 * Re-exported spacing scale from @voices/core tokens for convenience.
 * Always use named spacing values — never raw numbers in screen/component files.
 *
 *   px:  1   — hairline borders, dividers
 *   xs:  4   — icon gap, tight padding
 *   sm:  8   — compact padding, list item gap
 *   md:  16  — standard component padding
 *   lg:  24  — section spacing, card padding
 *   xl:  40  — large section breaks
 *   xxl: 64  — hero sections
 *   3xl: 80  — full-bleed spacing
 *   4xl: 96  — maximum spacing
 */
export const spacing = tokens.spacing

// ── Screen Layout ─────────────────────────────────────────────────────────────

/** Standard horizontal padding applied to all screen edges */
export const SCREEN_H_PAD = tokens.spacing.md        // 16

/** Wider horizontal padding for modal/detail screens */
export const SCREEN_H_PAD_WIDE = tokens.spacing.lg   // 24

/**
 * Maximum content width — prevents text and cards from stretching too wide
 * on iPads or landscape phones. Centered with `alignSelf: 'center'`.
 */
export const MAX_CONTENT_WIDTH = 600

// ── Component Sizes ───────────────────────────────────────────────────────────
export const sizes = {
  // Touch targets
  // Apple HIG minimum is 44pt; we default to 48 for comfortable tap targets.
  touchMin: 44,
  touchComfy: 48,

  // Icons
  iconXS: scale(14),
  iconSM: scale(18),
  iconMD: scale(24),
  iconLG: scale(32),
  iconXL: scale(40),
  iconHero: scale(56),

  // Avatars
  avatarXS: scale(24),
  avatarSM: scale(32),
  avatarMD: scale(48),
  avatarLG: scale(64),
  avatarXL: scale(96),
  avatarHero: scale(120),

  // Buttons
  buttonHeightSM: 36,
  buttonHeightMD: 44,
  buttonHeightLG: 52,

  // Navigation chrome
  tabBarHeight: 60,
  headerHeight: 56,
  fabSize: 56,
  fabSizeLG: 64,

  // Story-specific
  storyCardHeight: 120,
  storyCardImageSize: 64,
  storyHeroSize: scale(240),
  storyHeroMaxSize: 320,

  // Map
  mapMarkerSize: scale(48),
  mapMarkerImageSize: scale(36),

  // Input
  inputHeight: 48,
  inputHeightSM: 40,
  inputHeightLG: 56,

  // Misc
  dividerThickness: 1,
  borderWidth: 1,
  borderWidthFocus: 2,
} as const

// ── Border Radius ─────────────────────────────────────────────────────────────
export const radius = tokens.radius

// ── Z-Index ───────────────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
} as const

// ── Platform Helpers ──────────────────────────────────────────────────────────
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'

export const statusBarHeight = Platform.select({
  ios: 0,           // SafeAreaInsets handles this on iOS
  android: StatusBar.currentHeight ?? 24,
  default: 0,
})
