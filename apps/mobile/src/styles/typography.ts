/**
 * Complete Inter type scale for @voices/mobile.
 *
 * Usage in components:
 *   const styles = StyleSheet.create({
 *     title: { ...typeScale.headingLarge, color: colors.textPrimary },
 *   })
 *
 * Font loading:
 *   All `fontFamily` values reference fonts from @expo-google-fonts/inter.
 *   Fonts must be loaded with `useFonts()` in the root App component before
 *   these styles render correctly.
 *
 * Scale groups:
 *   display*    — splash, hero moments (40–28pt)
 *   heading*    — screen titles, section headers (24–16pt)
 *   title*      — card titles, list items (15–13pt)
 *   body*       — reading text (16–13pt)
 *   label*      — buttons, tabs, chips (14–11pt)
 *   caption*    — timestamps, metadata (13–11pt)
 *   overline    — category labels in ALL CAPS (11pt)
 *   code*       — transcript display, monospace (14–12pt)
 */

import { Platform, TextStyle } from 'react-native'
import { clampedScale } from './layout'

// ── Font Family Map ────────────────────────────────────────────────────────────
// Keys match the loaded font names from @expo-google-fonts/inter.
// These strings are the fontFamily values React Native uses at render time.
export const fontFamily = {
  thin: 'Inter_100Thin',
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  mono: Platform.select({
    ios: 'Menlo-Regular',
    android: 'monospace',
    default: 'monospace',
  }) as string,
} as const

// ── Helper: compute lineHeight from fontSize and a multiplier ─────────────────
const lh = (fontSize: number, multiplier: number): number =>
  Math.round(fontSize * multiplier)

// ── Type Scale ────────────────────────────────────────────────────────────────
// All font sizes use `clampedScale` so values are clamped to ±15% on
// very small (320pt) or very large (768pt+) screens.

export const typeScale = {
  // ─ Display ───────────────────────────────────────────────────────────────
  // For hero screens, onboarding splash, and large call-to-action text.
  displayLarge: {
    fontFamily: fontFamily.bold,
    fontSize: clampedScale(40),
    lineHeight: lh(clampedScale(40), 1.2),
    letterSpacing: -0.5,
  } satisfies TextStyle,

  displayMedium: {
    fontFamily: fontFamily.bold,
    fontSize: clampedScale(34),
    lineHeight: lh(clampedScale(34), 1.2),
    letterSpacing: -0.3,
  } satisfies TextStyle,

  displaySmall: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(28),
    lineHeight: lh(clampedScale(28), 1.25),
    letterSpacing: -0.2,
  } satisfies TextStyle,

  // ─ Heading ───────────────────────────────────────────────────────────────
  // Screen titles, section group headers, modal titles.
  headingXL: {
    fontFamily: fontFamily.bold,
    fontSize: clampedScale(24),
    lineHeight: lh(clampedScale(24), 1.3),
    letterSpacing: -0.2,
  } satisfies TextStyle,

  headingLarge: {
    fontFamily: fontFamily.bold,
    fontSize: clampedScale(20),
    lineHeight: lh(clampedScale(20), 1.35),
    letterSpacing: -0.1,
  } satisfies TextStyle,

  headingMedium: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(18),
    lineHeight: lh(clampedScale(18), 1.4),
  } satisfies TextStyle,

  headingSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(16),
    lineHeight: lh(clampedScale(16), 1.4),
  } satisfies TextStyle,

  // ─ Title ─────────────────────────────────────────────────────────────────
  // Card titles, list item primary labels, tab bar labels.
  titleLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(15),
    lineHeight: lh(clampedScale(15), 1.4),
  } satisfies TextStyle,

  titleMedium: {
    fontFamily: fontFamily.medium,
    fontSize: clampedScale(14),
    lineHeight: lh(clampedScale(14), 1.4),
    letterSpacing: 0.1,
  } satisfies TextStyle,

  titleSmall: {
    fontFamily: fontFamily.medium,
    fontSize: clampedScale(13),
    lineHeight: lh(clampedScale(13), 1.4),
    letterSpacing: 0.1,
  } satisfies TextStyle,

  // ─ Body ───────────────────────────────────────────────────────────────────
  // Main reading text: story descriptions, bios, transcripts.
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: clampedScale(16),
    lineHeight: lh(clampedScale(16), 1.5),
  } satisfies TextStyle,

  bodyMedium: {
    fontFamily: fontFamily.regular,
    fontSize: clampedScale(14),
    lineHeight: lh(clampedScale(14), 1.5),
  } satisfies TextStyle,

  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: clampedScale(13),
    lineHeight: lh(clampedScale(13), 1.5),
  } satisfies TextStyle,

  // ─ Label ─────────────────────────────────────────────────────────────────
  // Buttons, form labels, chip text, navigation items.
  labelLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(14),
    lineHeight: lh(clampedScale(14), 1.4),
    letterSpacing: 0.1,
  } satisfies TextStyle,

  labelMedium: {
    fontFamily: fontFamily.medium,
    fontSize: clampedScale(12),
    lineHeight: lh(clampedScale(12), 1.35),
    letterSpacing: 0.4,
  } satisfies TextStyle,

  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: clampedScale(11),
    lineHeight: lh(clampedScale(11), 1.35),
    letterSpacing: 0.5,
  } satisfies TextStyle,

  // ─ Caption ───────────────────────────────────────────────────────────────
  // Timestamps, story durations, secondary metadata lines.
  captionLarge: {
    fontFamily: fontFamily.regular,
    fontSize: clampedScale(13),
    lineHeight: lh(clampedScale(13), 1.4),
    letterSpacing: 0.2,
  } satisfies TextStyle,

  captionMedium: {
    fontFamily: fontFamily.regular,
    fontSize: clampedScale(12),
    lineHeight: lh(clampedScale(12), 1.4),
    letterSpacing: 0.2,
  } satisfies TextStyle,

  captionSmall: {
    fontFamily: fontFamily.regular,
    fontSize: clampedScale(11),
    lineHeight: lh(clampedScale(11), 1.4),
    letterSpacing: 0.2,
  } satisfies TextStyle,

  // ─ Overline ───────────────────────────────────────────────────────────────
  // Category labels above section headings (e.g. "FEATURED", "NEARBY").
  // Rendered in ALL CAPS by convention — set textTransform in the component.
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(11),
    lineHeight: lh(clampedScale(11), 1.35),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  overlineLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: clampedScale(12),
    lineHeight: lh(clampedScale(12), 1.35),
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // ─ Code / Monospace ───────────────────────────────────────────────────────
  // Transcript viewer, debug panels.
  codeMedium: {
    fontFamily: fontFamily.mono,
    fontSize: clampedScale(14),
    lineHeight: lh(clampedScale(14), 1.6),
    letterSpacing: 0,
  } satisfies TextStyle,

  codeSmall: {
    fontFamily: fontFamily.mono,
    fontSize: clampedScale(12),
    lineHeight: lh(clampedScale(12), 1.6),
    letterSpacing: 0,
  } satisfies TextStyle,
} as const

export type TypeScaleKey = keyof typeof typeScale
