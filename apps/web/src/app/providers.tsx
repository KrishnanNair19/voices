/**
 * Root provider tree for Voices Web.
 *
 * Initialises Firebase once (idempotent), then wraps the app with:
 *   HelmetProvider   — per-page <head> management (SEO)
 *   QueryClientProvider — TanStack Query global cache
 *   ThemeProvider    — MUI dark theme from @voices/core tokens
 *   CssBaseline      — MUI CSS normalisation
 */

import { type ReactNode, useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { initFirebase } from '@voices/core'
import { theme } from '@/theme/theme'

// ── Firebase init (runs once at module evaluation) ────────────────────────────

initFirebase(
  {
    apiKey:            import.meta.env['VITE_FIREBASE_API_KEY'] ?? '',
    authDomain:        import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] ?? '',
    projectId:         import.meta.env['VITE_FIREBASE_PROJECT_ID'] ?? '',
    storageBucket:     import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] ?? '',
    messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    appId:             import.meta.env['VITE_FIREBASE_APP_ID'] ?? '',
  },
  import.meta.env['VITE_USE_FIREBASE_EMULATOR'] === 'true',
)

// ── QueryClient config ────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,          // 1 minute default stale time
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  })
}

// ── Providers ─────────────────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // useState so the QueryClient is stable across React StrictMode double-renders
  const [queryClient] = useState(makeQueryClient)

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
