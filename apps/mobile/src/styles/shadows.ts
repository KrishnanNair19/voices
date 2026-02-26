/**
 * Platform-appropriate shadow / elevation system.
 *
 * iOS uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`.
 * Android uses `elevation` (maps to Material Design elevation dp).
 *
 * Usage:
 *   const styles = StyleSheet.create({
 *     card: { ...shadows.md, backgroundColor: colors.bgSurface },
 *   })
 *
 * Levels:
 *   none   — flat, no elevation (e.g. inline elements)
 *   xs     — barely lifted (tags, small badges)
 *   sm     — subtle card depth (list items, chips)
 *   md     — standard card (StoryCard, PlaylistCard)
 *   lg     — floating elements (FAB, bottom sheet handle)
 *   xl     — prominent overlays (modals, drawers)
 *   2xl    — maximum depth (full-screen modals)
 */

import { Platform, ViewStyle } from 'react-native'
import { colors } from './colors'

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>

// Build a cross-platform shadow at a given level.
// The formula produces progressively softer, more spread shadows at higher levels.
function buildShadow(
  level: number,
  color: string = colors.black,
): ShadowStyle {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: Math.round(level * 1.5) },
      shadowOpacity: 0.04 + level * 0.018,
      shadowRadius: level * 2.5,
    },
    android: {
      elevation: level * 2,
    },
    default: {},
  }) as ShadowStyle
}

export const shadows = {
  none: {} as ShadowStyle,
  xs: buildShadow(1),
  sm: buildShadow(2),
  md: buildShadow(4),
  lg: buildShadow(6),
  xl: buildShadow(10),
  '2xl': buildShadow(14),

  // ── Tinted shadows for brand-colored elements ─────────────────────────────
  // Use on buttons, FABs, and highlighted cards that sit on the primary color.
  primarySm: buildShadow(2, colors.primary),
  primaryMd: buildShadow(4, colors.primary),
  primaryLg: buildShadow(6, colors.primary),
} as const

export type ShadowKey = keyof typeof shadows
