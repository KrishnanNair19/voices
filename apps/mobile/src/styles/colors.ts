/**
 * Semantic light-mode color palette for @voices/mobile.
 *
 * Every color reference in the app should come from this file.
 * Raw hex values are defined here once; `tokens.color.*` is used for brand/primitive
 * values so they stay in sync with @voices/core.
 *
 * Naming convention:
 *   bg*         — backgrounds (screen, card, input, overlay)
 *   text*       — text roles
 *   border*     — borders and dividers
 *   error|success|warning|info — semantic state families
 *   neutral*    — grey scale steps
 */

import { tokens } from '@voices/core'

export const colors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary: tokens.color.primary,          // #1ddbb5 — teal
  primaryLight: tokens.color.primaryLight, // #E8FAF7 — tinted bg, chips
  primaryDark: tokens.color.primaryDark,   // #0FB896 — pressed, link text

  secondary: tokens.color.secondary,       // #FDF0AF — warm cream
  secondaryDark: tokens.color.secondaryDark, // #E8D84A — richer yellow

  // ── Backgrounds ────────────────────────────────────────────────────────────
  /** Main screen / page background — warm off-white */
  bgBase: '#FAFAF7',
  /** Cards, modals, bottom sheets — pure white on warm base creates depth */
  bgSurface: '#FFFFFF',
  /** Recessed areas: input fills, code blocks, sunken sections */
  bgSurfaceSunken: '#F4F3EF',
  /** Tinted surface for selected/active states */
  bgSurfaceTinted: tokens.color.primaryLight,
  /** Full-screen modal backdrop */
  bgOverlay: 'rgba(15, 17, 23, 0.50)',
  /** Subtle scrim behind bottom sheets */
  bgScrim: 'rgba(15, 17, 23, 0.20)',

  // ── Text ───────────────────────────────────────────────────────────────────
  /** Primary body text — reuses the dark bg token for visual consistency */
  textPrimary: '#0F1117',
  /** Supporting text, secondary labels */
  textSecondary: '#4B5563',
  /** Timestamps, metadata, tertiary labels */
  textTertiary: '#9CA3AF',
  /** Disabled text, placeholders */
  textDisabled: '#D1D5DB',
  /** Text on dark/colored surfaces (inverse) */
  textInverse: '#FAFAF7',
  /** Text on primary (teal) backgrounds — dark for contrast */
  textOnPrimary: '#0A2420',
  /** Text on secondary (cream) backgrounds */
  textOnSecondary: '#3D3200',
  /** Hyperlinks and interactive text */
  textLink: tokens.color.primaryDark,

  // ── Borders & Dividers ─────────────────────────────────────────────────────
  /** Standard border — list separators, card outlines */
  borderDefault: '#E5E7EB',
  /** Stronger border — section headers, emphasized containers */
  borderStrong: '#D1D5DB',
  /** Input focus ring */
  borderFocus: tokens.color.primary,
  /** Error state border */
  borderError: '#FECACA',
  /** Success state border */
  borderSuccess: '#A7F3D0',

  // ── Semantic: Error ────────────────────────────────────────────────────────
  error: '#DC2626',
  errorLight: tokens.color.errorLight,  // #FEF2F2
  errorBorder: '#FECACA',
  errorText: '#991B1B',

  // ── Semantic: Success ──────────────────────────────────────────────────────
  success: '#059669',
  successLight: tokens.color.successLight, // #ECFDF5
  successBorder: '#A7F3D0',
  successText: '#065F46',

  // ── Semantic: Warning ──────────────────────────────────────────────────────
  warning: '#D97706',
  warningLight: tokens.color.warningLight, // #FFFBEB
  warningBorder: '#FDE68A',
  warningText: '#92400E',

  // ── Semantic: Info (brand teal) ────────────────────────────────────────────
  info: tokens.color.primary,
  infoLight: tokens.color.primaryLight,
  infoBorder: '#99E9D5',
  infoText: '#0A4A3D',

  // ── Neutral grey scale ─────────────────────────────────────────────────────
  neutral50: tokens.color.neutral50,   // #F9FAFB
  neutral100: tokens.color.neutral100, // #F3F4F6
  neutral200: tokens.color.neutral200, // #E5E7EB
  neutral300: tokens.color.neutral300, // #D1D5DB
  neutral400: tokens.color.neutral400, // #9CA3AF
  neutral500: tokens.color.neutral500, // #6B7280
  neutral600: tokens.color.neutral600, // #4B5563
  neutral700: tokens.color.neutral700, // #374151
  neutral800: tokens.color.neutral800, // #1F2937
  neutral900: tokens.color.neutral900, // #111827

  // ── Absolute ───────────────────────────────────────────────────────────────
  white: tokens.color.white,
  black: tokens.color.black,
  transparent: tokens.color.transparent,
} as const

export type Colors = typeof colors
export type ColorKey = keyof Colors
