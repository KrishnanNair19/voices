/**
 * React Native Paper MD3 light theme for @voices/mobile.
 *
 * This theme wires the Voices design tokens into Paper's component system so
 * that every Paper component (Button, Card, Chip, TextInput, etc.) automatically
 * renders with the correct Voices brand colors and Inter font.
 *
 * Setup in App.tsx:
 *   import { PaperProvider } from 'react-native-paper'
 *   import { appTheme } from '@/styles'
 *   <PaperProvider theme={appTheme}>...</PaperProvider>
 *
 * Typed hook — use inside any component:
 *   import { useAppTheme } from '@/styles'
 *   const theme = useAppTheme()
 *   // theme.colors.primary, theme.colors.background, etc. — fully typed
 */

import { MD3LightTheme, configureFonts, useTheme } from 'react-native-paper'
import type { MD3Theme } from 'react-native-paper'
import { tokens } from '@voices/core'
import { colors } from './colors'
import { fontFamily } from './typography'

// ── Font configuration ────────────────────────────────────────────────────────
// Maps each MD3 type-scale variant to an Inter font family.
// Sizes and line heights are left at Paper's MD3 defaults — we use our own
// `typeScale` from typography.ts for custom components.
const fontConfig = {
  displayLarge:   { fontFamily: fontFamily.bold },
  displayMedium:  { fontFamily: fontFamily.bold },
  displaySmall:   { fontFamily: fontFamily.semibold },
  headlineLarge:  { fontFamily: fontFamily.bold },
  headlineMedium: { fontFamily: fontFamily.semibold },
  headlineSmall:  { fontFamily: fontFamily.semibold },
  titleLarge:     { fontFamily: fontFamily.semibold },
  titleMedium:    { fontFamily: fontFamily.medium },
  titleSmall:     { fontFamily: fontFamily.medium },
  bodyLarge:      { fontFamily: fontFamily.regular },
  bodyMedium:     { fontFamily: fontFamily.regular },
  bodySmall:      { fontFamily: fontFamily.regular },
  labelLarge:     { fontFamily: fontFamily.semibold },
  labelMedium:    { fontFamily: fontFamily.medium },
  labelSmall:     { fontFamily: fontFamily.medium },
}

// ── Theme ─────────────────────────────────────────────────────────────────────
export const appTheme = {
  ...MD3LightTheme,

  fonts: configureFonts({ config: fontConfig }),

  // roundness: Paper multiplies this by its MD3 shape scale.
  // tokens.radius.md (12) / 4 = 3 — matches our standard card radius.
  roundness: tokens.radius.md / 4,

  colors: {
    ...MD3LightTheme.colors,

    // ── Brand ────────────────────────────────────────────────────────────────
    primary: colors.primary,
    onPrimary: colors.textOnPrimary,
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.textPrimary,

    secondary: colors.secondary,
    onSecondary: colors.textOnSecondary,
    secondaryContainer: '#FFF8D6',
    onSecondaryContainer: colors.textPrimary,

    tertiary: colors.neutral500,
    onTertiary: colors.white,
    tertiaryContainer: colors.neutral100,
    onTertiaryContainer: colors.neutral800,

    // ── Surfaces ─────────────────────────────────────────────────────────────
    background: colors.bgBase,
    onBackground: colors.textPrimary,

    surface: colors.bgSurface,
    onSurface: colors.textPrimary,

    surfaceVariant: colors.bgSurfaceSunken,
    onSurfaceVariant: colors.textSecondary,

    surfaceDisabled: colors.neutral100,
    onSurfaceDisabled: colors.textDisabled,

    // ── Outline ───────────────────────────────────────────────────────────────
    outline: colors.borderDefault,
    outlineVariant: colors.borderStrong,

    // ── Semantic ──────────────────────────────────────────────────────────────
    error: colors.error,
    onError: colors.white,
    errorContainer: colors.errorLight,
    onErrorContainer: colors.errorText,

    // ── Elevation tints (Paper uses these for surface tinting at elevation) ──
    // In MD3 light mode, surfaces at elevation are tinted with the primary color.
    elevation: {
      level0: colors.transparent,
      level1: colors.neutral50,
      level2: colors.neutral100,
      level3: colors.neutral100,
      level4: colors.neutral200,
      level5: colors.neutral200,
    },

    // ── Inverse (snackbars, tooltips on dark surface) ─────────────────────────
    inverseSurface: colors.neutral800,
    inverseOnSurface: colors.textInverse,
    inversePrimary: colors.primary,

    // ── Misc ──────────────────────────────────────────────────────────────────
    scrim: colors.bgOverlay,
    shadow: colors.black,
  },
} satisfies MD3Theme

export type AppTheme = typeof appTheme

/**
 * Typed `useTheme` wrapper — provides full IntelliSense on Voices theme colors.
 *
 * Usage:
 *   const theme = useAppTheme()
 *   theme.colors.primary      // '#1ddbb5'
 *   theme.colors.background   // '#FAFAF7'
 */
export const useAppTheme = (): AppTheme => useTheme<AppTheme>()
