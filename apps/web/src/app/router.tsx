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

// ── Lazy feature pages ────────────────────────────────────────────────────────
const CreateStoryPage = lazy(() => import('@/features/create/pages/CreateStoryPage'))
const ExplorePage = lazy(() => import('@/features/explore/pages/ExplorePage'))
const StoryListenPage = lazy(() => import('@/features/story/pages/StoryListenPage'))
const PlaylistsPage = lazy(() => import('@/features/playlists/pages/PlaylistsPage'))
const PlaylistDetailPage = lazy(() => import('@/features/playlists/pages/PlaylistDetailPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))

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
            <ExplorePage />
          </Suspense>
        ),
      },
      {
        path: 'create',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <CreateStoryPage />
          </Suspense>
        ),
      },
      {
        path: 'playlists',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaylistsPage />
          </Suspense>
        ),
      },
      {
        path: 'playlists/:id',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaylistDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'profile/:username',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'story/:id',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <StoryListenPage />
          </Suspense>
        ),
      },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])
