/**
 * PlaylistsPage — grid view of the user's own playlists and public playlists
 * by other users (discovery section).
 *
 * Route: /playlists
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import AddIcon from '@mui/icons-material/Add'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import { usePlaylists, useAuthStore, tokens } from '@voices/core'
import PlaylistCard from '../components/PlaylistCard'
import CreatePlaylistModal from '../components/CreatePlaylistModal'

// ── Skeleton grid ──────────────────────────────────────────────────────────────

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i}>
          <Skeleton
            variant="rectangular"
            height={160}
            sx={{ borderRadius: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.06)' }}
          />
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
        </Box>
      ))}
    </Box>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
        color: 'text.secondary',
      }}
    >
      <QueueMusicIcon sx={{ fontSize: 64, opacity: 0.3 }} />
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
        No playlists yet
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 320 }}>
        Create your first playlist to organise your favourite stories.
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
        sx={{
          bgcolor: tokens.color.primary,
          color: tokens.color.bg,
          fontWeight: 700,
          '&:hover': { bgcolor: `${tokens.color.primary}cc` },
        }}
      >
        New Playlist
      </Button>
    </Box>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="h6"
      sx={{ fontWeight: 700, color: 'text.primary', mb: 2, mt: 1 }}
    >
      {children}
    </Typography>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlaylistsPage() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)

  const uid = useAuthStore((s) => s.user?.uid)

  // Own playlists (undefined userId = all public, so we gate on uid)
  const { data: myPlaylists, isLoading: myLoading } = usePlaylists(uid)

  // Public playlists by others
  const { data: allPublic, isLoading: publicLoading } = usePlaylists()

  const discoverPlaylists = (allPublic ?? []).filter((p) => p.ownerId !== uid)

  const handleCreated = (id: string) => {
    navigate(`/playlists/${id}`)
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3, maxWidth: 1200, mx: 'auto', width: '100%' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Playlists
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{
            bgcolor: tokens.color.primary,
            color: tokens.color.bg,
            fontWeight: 700,
            '&:hover': { bgcolor: `${tokens.color.primary}cc` },
          }}
        >
          New Playlist
        </Button>
      </Box>

      {/* My Playlists section */}
      <SectionHeading>My Playlists</SectionHeading>
      {myLoading ? (
        <SkeletonGrid count={4} />
      ) : !uid ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to see your playlists.
        </Typography>
      ) : myPlaylists && myPlaylists.length === 0 ? (
        <EmptyState onCreateClick={() => setModalOpen(true)} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 2,
            mb: 4,
          }}
        >
          {(myPlaylists ?? []).map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => navigate(`/playlists/${playlist.id}`)}
            />
          ))}
        </Box>
      )}

      {/* Discover section */}
      {discoverPlaylists.length > 0 && (
        <>
          <SectionHeading>Discover</SectionHeading>
          {publicLoading ? (
            <SkeletonGrid count={6} />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 2,
              }}
            >
              {discoverPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={() => navigate(`/playlists/${playlist.id}`)}
                />
              ))}
            </Box>
          )}
        </>
      )}

      {/* Create playlist modal */}
      <CreatePlaylistModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  )
}
