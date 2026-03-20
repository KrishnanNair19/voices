import { createTheme, alpha } from '@mui/material/styles'
import { tokens } from '@voices/core'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tokens.color.primary,
      light: tokens.color.primaryLight,
      dark: tokens.color.primaryDark,
      contrastText: tokens.color.bg,
    },
    secondary: {
      main: tokens.color.secondary,
      dark: tokens.color.secondaryDark,
      contrastText: tokens.color.bg,
    },
    background: {
      default: tokens.color.bg,
      paper: tokens.color.surface,
    },
    text: {
      primary: tokens.color.textPrimary,
      secondary: tokens.color.muted,
    },
    error: { main: tokens.color.error },
    warning: { main: tokens.color.warning },
    success: { main: tokens.color.success },
    divider: 'rgba(255,255,255,0.08)',
  },

  typography: {
    fontFamily: `"Inter Variable", "Inter", -apple-system, sans-serif`,
    h1: { fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15 },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h3: { fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h4: { fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { color: tokens.color.muted },
  },

  shape: { borderRadius: tokens.radius.md },

  components: {
    // ── Button ──────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.pill,
          padding: '10px 24px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.primaryDark})`,
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.color.primaryDark}, ${tokens.color.primary})`,
            boxShadow: `0 0 24px ${alpha(tokens.color.primary, 0.45)}`,
          },
          '&:disabled': {
            background: alpha(tokens.color.primary, 0.25),
            color: alpha(tokens.color.textPrimary, 0.4),
          },
        },
        outlinedPrimary: {
          borderColor: alpha(tokens.color.primary, 0.45),
          '&:hover': {
            borderColor: tokens.color.primary,
            background: alpha(tokens.color.primary, 0.08),
            boxShadow: `0 0 12px ${alpha(tokens.color.primary, 0.2)}`,
          },
        },
        sizeLarge: { padding: '12px 32px', fontSize: '1rem' },
        sizeSmall: { padding: '6px 16px' },
      },
    },

    // ── Card ────────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: { '&:last-child': { paddingBottom: 16 } },
      },
    },

    // ── Paper ───────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },

    // ── TextField ───────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: 'filled', fullWidth: true },
    },

    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(tokens.color.textPrimary, 0.05),
          borderRadius: `${tokens.radius.sm}px`,
          '&:hover': { backgroundColor: alpha(tokens.color.textPrimary, 0.08) },
          '&.Mui-focused': { backgroundColor: alpha(tokens.color.textPrimary, 0.08) },
          '&::before': { borderBottom: '2px solid transparent' },
          '&::after': { borderBottomColor: tokens.color.primary },
        },
        input: { paddingTop: 20, paddingBottom: 8 },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { color: tokens.color.muted },
        focused: { color: `${tokens.color.primary} !important` },
      },
    },

    // ── Slider (audio scrubber) ──────────────────────────────────────────────
    MuiSlider: {
      styleOverrides: {
        root: { color: tokens.color.primary },
        thumb: {
          width: 14,
          height: 14,
          '&:hover, &.Mui-focusVisible': {
            boxShadow: `0 0 0 8px ${alpha(tokens.color.primary, 0.2)}`,
          },
        },
        track: { height: 3 },
        rail: { height: 3, opacity: 0.3 },
      },
    },

    // ── Chip ────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm, fontWeight: 500 },
        colorPrimary: {
          background: alpha(tokens.color.primary, 0.15),
          color: tokens.color.primary,
          border: `1px solid ${alpha(tokens.color.primary, 0.35)}`,
          '&:hover': { background: alpha(tokens.color.primary, 0.25) },
        },
      },
    },

    // ── AppBar ──────────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha(tokens.color.bg, 0.75),
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        },
      },
    },

    // ── Stepper ─────────────────────────────────────────────────────────────
    MuiStepIcon: {
      styleOverrides: {
        root: { '&.Mui-active': { color: tokens.color.primary } },
        text: { fill: tokens.color.bg },
      },
    },

    MuiStepLabel: {
      styleOverrides: {
        label: { '&.Mui-active': { color: tokens.color.textPrimary, fontWeight: 600 } },
      },
    },

    // ── Divider ─────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.08)' },
      },
    },

    // ── Link ────────────────────────────────────────────────────────────────
    MuiLink: {
      styleOverrides: {
        root: {
          color: tokens.color.primary,
          textDecorationColor: alpha(tokens.color.primary, 0.4),
          '&:hover': { color: tokens.color.primaryLight },
        },
      },
    },

    // ── Alert ───────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm },
      },
    },

    // ── CircularProgress ────────────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: { size: 24 },
      styleOverrides: { root: { color: tokens.color.primary } },
    },
  },
})
