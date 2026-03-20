/**
 * Application router.
 *
 * Route groups:
 *   /login, /signup, /verify-email  — auth pages (no AppShell)
 *   /onboarding                      — onboarding wizard (auth required, no shell)
 *   / (and nested children)          — main app behind ProtectedRoute + AppShell
 *
 * Feature pages (3.2+) are lazy-loaded for code-splitting.
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '@/shared/components/AppShell'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import PageSkeleton from '@/shared/components/PageSkeleton'
import LoginPage from '@/features/auth/pages/LoginPage'
import SignUpPage from '@/features/auth/pages/SignUpPage'
import EmailVerificationPage from '@/features/auth/pages/EmailVerificationPage'
import OnboardingPage from '@/features/onboarding/pages/OnboardingPage'

// ── Lazy feature pages (not yet implemented — stubs until Phase 3.2+) ─────────
const PlaceholderPage = lazy(() => import('@/shared/pages/PlaceholderPage'))

// ── Router ────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ── Auth (no shell, no auth requirement) ────────────────────────────────
  { path: '/login',        element: <LoginPage /> },
  { path: '/signup',       element: <SignUpPage /> },
  { path: '/verify-email', element: <EmailVerificationPage /> },

  // ── Onboarding (must be authenticated or in onboarding status) ───────────
  {
    path: '/onboarding',
    element: (
      // requireAuthenticated=false allows 'onboarding' status through
      <ProtectedRoute requireAuthenticated={false}>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // ── Main app (fully authenticated only) ─────────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaceholderPage title="Explore" subtitle="Map & story discovery — coming in Phase 3.2" />
          </Suspense>
        ),
      },
      {
        path: 'create',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaceholderPage title="Create" subtitle="Story creation wizard — coming in Phase 3.3" />
          </Suspense>
        ),
      },
      {
        path: 'playlists',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaceholderPage title="Playlists" subtitle="Playlist management — coming in Phase 3.4" />
          </Suspense>
        ),
      },
      {
        path: 'profile/:username',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaceholderPage title="Profile" subtitle="User profiles — coming in Phase 3.5" />
          </Suspense>
        ),
      },
      {
        path: 'story/:id',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaceholderPage title="Story" subtitle="Story listen page — coming in Phase 3.2" />
          </Suspense>
        ),
      },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])
