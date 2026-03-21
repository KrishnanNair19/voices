/**
 * AppShell — the persistent layout for all main-app routes.
 *
 * Renders:
 *   AppNavbar  — top fixed navigation bar
 *   <Outlet>   — React Router child routes fill this area
 *   MiniPlayer — fixed bottom audio player bar (visible when a story is active)
 *
 * The shell is only rendered for authenticated routes (wrapped in ProtectedRoute
 * in router.tsx). Auth and onboarding pages render outside the shell.
 */

import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'
import MiniPlayer from './MiniPlayer'
import { usePlayerStore } from '@voices/core'

const NAVBAR_HEIGHT = 64
const MINI_PLAYER_HEIGHT = 72

export default function AppShell() {
  const hasActiveStory = usePlayerStore((s) => s.activeStoryId !== null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavbar />

      {/* Push page content below the fixed navbar; add bottom padding when
          the mini player is visible so content isn't hidden behind it */}
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: `${NAVBAR_HEIGHT}px`,
          pb: hasActiveStory ? `${MINI_PLAYER_HEIGHT}px` : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>

      {/* MiniPlayer is fixed-positioned — does not affect layout flow */}
      <MiniPlayer />
    </Box>
  )
}
