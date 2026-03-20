import { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import ExploreIcon from '@mui/icons-material/Explore'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import { useAuthStore, tokens } from '@voices/core'

// ── Nav links ─────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Explore',   path: '/',          icon: <ExploreIcon fontSize="small" /> },
  { label: 'Create',    path: '/create',     icon: <AddCircleOutlineIcon fontSize="small" /> },
  { label: 'Playlists', path: '/playlists',  icon: <QueueMusicIcon fontSize="small" /> },
]

// ── Logo ──────────────────────────────────────────────────────────────────────

function VoicesLogo() {
  return (
    <Box
      component={RouterLink}
      to="/"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* Teal circle mark */}
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.primaryDark})`,
          boxShadow: `0 0 10px ${tokens.color.primary}55`,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: tokens.color.textPrimary,
          letterSpacing: '-0.02em',
          fontSize: '1.1rem',
        }}
      >
        Voices
      </Typography>
    </Box>
  )
}

// ── AppNavbar ─────────────────────────────────────────────────────────────────

export default function AppNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, status, signOut } = useAuthStore()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }
  const handleMenuClose = () => setAnchorEl(null)

  const handleSignOut = async () => {
    handleMenuClose()
    await signOut()
    navigate('/login')
  }

  const handleProfile = () => {
    handleMenuClose()
    if (user) navigate(`/profile/${user.uid}`)
  }

  return (
    <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 2 }}>
        {/* ── Logo ── */}
        <VoicesLogo />

        {/* ── Nav links (desktop) ── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 0.5,
            mx: 'auto',
          }}
        >
          {NAV_LINKS.map(({ label, path }) => {
            const isActive =
              path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path)
            return (
              <Button
                key={path}
                component={RouterLink}
                to={path}
                variant={isActive ? 'contained' : 'text'}
                size="small"
                sx={{
                  color: isActive ? tokens.color.bg : tokens.color.muted,
                  '&:hover': { color: tokens.color.textPrimary },
                  px: 2,
                }}
              >
                {label}
              </Button>
            )
          })}
        </Box>

        {/* ── Spacer for mobile (pushes auth section right) ── */}
        <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />

        {/* ── Auth section ── */}
        {status === 'authenticated' && user ? (
          <>
            <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0.5 }}>
              <Avatar
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? 'User'}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: tokens.color.primaryDark,
                  fontSize: '0.85rem',
                  border: `2px solid ${tokens.color.primary}40`,
                }}
              >
                {user.displayName?.[0]?.toUpperCase() ?? 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    border: '1px solid rgba(255,255,255,0.08)',
                  },
                },
              }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {user.displayName ?? 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfile}>My Profile</MenuItem>
              <MenuItem onClick={handleMenuClose} component={RouterLink} to="/profile/edit">
                Edit Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                Sign Out
              </MenuItem>
            </Menu>
          </>
        ) : status !== 'loading' ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="text"
              size="small"
              sx={{ color: tokens.color.muted }}
            >
              Log in
            </Button>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="small"
            >
              Sign up
            </Button>
          </Box>
        ) : null}
      </Toolbar>
    </AppBar>
  )
}
