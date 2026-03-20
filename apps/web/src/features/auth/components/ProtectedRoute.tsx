/**
 * Route guard for authenticated sections of the app.
 *
 * requireAuthenticated=true (default):
 *   loading       → full-screen spinner
 *   unauthenticated → /login
 *   onboarding    → /onboarding
 *   authenticated → render children
 *
 * requireAuthenticated=false (for /onboarding):
 *   loading       → full-screen spinner
 *   unauthenticated → /login
 *   onboarding    → render children
 *   authenticated → / (already finished onboarding)
 */

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useAuthStore } from '@voices/core'

interface ProtectedRouteProps {
  children: ReactNode
  /** When false, 'onboarding' status is allowed through (used for /onboarding route). */
  requireAuthenticated?: boolean
}

export default function ProtectedRoute({
  children,
  requireAuthenticated = true,
}: ProtectedRouteProps) {
  const status = useAuthStore((s) => s.status)

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (requireAuthenticated) {
    // Main app routes: push onboarding users to the wizard
    if (status === 'onboarding') {
      return <Navigate to="/onboarding" replace />
    }
  } else {
    // Onboarding route: push fully-authenticated users to home
    if (status === 'authenticated') {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
