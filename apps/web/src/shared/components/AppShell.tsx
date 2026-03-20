/**
 * AppShell — the persistent layout for all main-app routes.
 *
 * Renders:
 *   AppNavbar  — top fixed navigation bar
 *   <Outlet>   — React Router child routes fill this area
 *
 * The shell is only rendered for authenticated routes (wrapped in ProtectedRoute
 * in router.tsx). Auth and onboarding pages render outside the shell.
 */

import Box from '@mui/material/Box'
import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'

const NAVBAR_HEIGHT = 64

export default function AppShell() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavbar />

      {/* Push page content below the fixed navbar */}
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: `${NAVBAR_HEIGHT}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
