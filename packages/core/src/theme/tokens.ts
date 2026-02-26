export const tokens = {
  color: {
    // ── Brand (shared across all platforms and modes) ──────────────────────
    primary: '#1ddbb5',
    primaryLight: '#E8FAF7',   // tint — tinted backgrounds, chips, badges
    primaryDark: '#0FB896',    // shade — hover/pressed states, link text

    secondary: '#FDF0AF',
    secondaryDark: '#E8D84A',  // richer yellow for contrast-sensitive uses

    // ── Legacy dark-mode semantics (kept for web app / backwards compat) ──
    bg: '#0f1117',
    surface: '#1a1f2e',
    muted: '#6b7280',
    textPrimary: '#f1f5f9',

    // ── Semantic states (platform-agnostic primitives) ─────────────────────
    error: '#ef4444',
    errorLight: '#FEF2F2',
    errorDark: '#DC2626',

    warning: '#f59e0b',
    warningLight: '#FFFBEB',
    warningDark: '#D97706',

    success: '#22c55e',
    successLight: '#ECFDF5',
    successDark: '#059669',

    info: '#1ddbb5',           // maps to primary — brand-consistent info tone
    infoLight: '#E8FAF7',

    // ── Neutral grey scale ─────────────────────────────────────────────────
    neutral50: '#F9FAFB',
    neutral100: '#F3F4F6',
    neutral200: '#E5E7EB',
    neutral300: '#D1D5DB',
    neutral400: '#9CA3AF',
    neutral500: '#6B7280',
    neutral600: '#4B5563',
    neutral700: '#374151',
    neutral800: '#1F2937',
    neutral900: '#111827',

    // ── Absolute ───────────────────────────────────────────────────────────
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  // ── Spacing scale (base-4, named) ────────────────────────────────────────
  spacing: {
    px: 1,      // hairline — 1 logical pixel, for borders and dividers
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    xxl: 64,
    '3xl': 80,
    '4xl': 96,
  },

  // ── Border radius ─────────────────────────────────────────────────────────
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    '2xl': 36,
    pill: 999,
  },

  // ── Font family ───────────────────────────────────────────────────────────
  fontFamily: {
    sans: 'Inter',
  },

  // ── Font size primitives (raw pt values — use typeScale in apps) ──────────
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    display: 32, // kept for backwards compat — prefer '4xl'
  },

  // ── Font weight ───────────────────────────────────────────────────────────
  fontWeight: {
    thin: '100' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // ── Line height multipliers (multiply by fontSize for RN lineHeight) ───────
  lineHeight: {
    tight: 1.2,    // headings
    snug: 1.35,    // subheadings
    normal: 1.5,   // body
    relaxed: 1.625,
    loose: 2.0,
  },

  // ── Letter spacing (em units — multiply by fontSize if needed) ─────────────
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 1.5,
  },
} as const

export type Tokens = typeof tokens
export type ColorToken = keyof typeof tokens.color
export type SpacingToken = keyof typeof tokens.spacing
