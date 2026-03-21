/**
 * PlaylistDetailPage — full detail view for a single playlist.
 *
 * Route: /playlists/:id
 *
 * Layout:
 *   Header: cover art, title, description, play-all / shuffle buttons
 *   Tabs:   Stories | Map
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Skeleton from '@mui/material/Skeleton'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import {
  usePlaylist,
  useStories,
  usePlayerStore,
  useAuthStore,
  useRemoveStoryFromPlaylist,
  useDeletePlaylist,
  tokens,
} from '@voices/core'
import type { Story } from '@voices/core'
import PlaylistStoryRow from '../components/PlaylistStoryRow'
import PlaylistMapView from '../components/PlaylistMapView'

// ── Helper: shuffle array (Fisher-Yates) ──────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

function DeleteConfirmDialog({ open, onClose, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { bgcolor: tokens.color.surface, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 },
      }}
    >
      <DialogTitle>Delete Playlist?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          This action cannot be undone. The playlist and its story list will be permanently deleted.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isPending} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={isPending}
          color="error"
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'stories' | 'map'>('stories')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: playlist, isLoading: playlistLoading, isError } = usePlaylist(id ?? null)
  const { data: allStories, isLoading: storiesLoading } = useStories({ limit: 200 })

  const uid = useAuthStore((s) => s.user?.uid)
  const activeStoryId = usePlayerStore((s) => s.activeStoryId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const { playQueue } = usePlayerStore()

  const removeStory = useRemoveStoryFromPlaylist()
  const deletePlaylist = useDeletePlaylist()

  const isOwner = !!uid && playlist?.ownerId === uid
  const isCurated = playlist?.isCurated ?? false

  // Build ordered story list matching playlist.storyIds order
  const orderedStories = useMemo<Story[]>(() => {
    if (!playlist || !allStories) return []
    const storyMap = new Map(allStories.map((s) => [s.id, s]))
    return playlist.storyIds.flatMap((sid) => {
      const s = storyMap.get(sid)
      return s ? [s] : []
    })
  }, [playlist, allStories])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePlayAll = () => {
    if (orderedStories.length === 0) return
    playQueue(orderedStories.map((s) => s.id), 0)
  }

  const handleShuffle = () => {
    if (orderedStories.length === 0) return
    const shuffled = shuffle(orderedStories.map((s) => s.id))
    playQueue(shuffled, 0)
  }

  const handleRowPlay = (_story: Story, index: number) => {
    playQueue(orderedStories.map((s) => s.id), index)
  }

  const handleRemove = (storyId: string) => {
    if (!playlist) return
    removeStory.mutate({ playlistId: playlist.id, storyId })
  }

  const handleDelete = () => {
    if (!playlist) return
    deletePlaylist.mutate(playlist.id, {
      onSuccess: () => {
        navigate('/playlists')
      },
    })
  }

  const handleSelectOnMap = (story: Story) => {
    const idx = orderedStories.findIndex((s) => s.id === story.id)
    if (idx !== -1) handleRowPlay(story, idx)
  }

  // ── Loading / error states ───────────────────────────────────────────────────

  if (playlistLoading || storiesLoading) {
    return (
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 3, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Skeleton variant="rounded" width={200} height={200} sx={{ flexShrink: 0, bgcolor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 1 }} />
            <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2 }} />
            <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
          </Box>
        </Box>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
        ))}
      </Box>
    )
  }

  if (isError || !playlist) {
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Alert severity="error">
          Playlist not found or failed to load.
        </Alert>
      </Box>
    )
  }

  const coverImage = playlist.coverImageUrl

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
      {/* Back button */}
      <IconButton
        onClick={() => navigate('/playlists')}
        sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        aria-label="Back to playlists"
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Header */}
      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: 3, flexWrap: 'wrap' }}>
        {/* Cover art */}
        {coverImage ? (
          <Box
            component="img"
            src={coverImage}
            alt={playlist.title}
            sx={{
              width: { xs: 140, sm: 200 },
              height: { xs: 140, sm: 200 },
              borderRadius: 2,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />
        ) : (
          <Box
            sx={{
              width: { xs: 140, sm: 200 },
              height: { xs: 140, sm: 200 },
              borderRadius: 2,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${tokens.color.primary}33 0%, ${tokens.color.surface} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <QueueMusicIcon sx={{ fontSize: 72, color: tokens.color.primary, opacity: 0.7 }} />
          </Box>
        )}

        {/* Meta */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {playlist.isPublic && (
            <Typography variant="caption" sx={{ color: tokens.color.primary, fontWeight: 700, mb: 0.5, letterSpacing: 1, textTransform: 'uppercase', fontSize: 11 }}>
              Public Playlist
            </Typography>
          )}

          <Typography
            variant="h4"
            sx={{ fontWeight: 800, lineHeight: 1.2, mb: 1, wordBreak: 'break-word' }}
          >
            {playlist.title}
          </Typography>

          {playlist.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {playlist.description}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            {orderedStories.length} {orderedStories.length === 1 ? 'story' : 'stories'}
          </Typography>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handlePlayAll}
              disabled={orderedStories.length === 0}
              sx={{
                bgcolor: tokens.color.primary,
                color: tokens.color.bg,
                fontWeight: 700,
                '&:hover': { bgcolor: `${tokens.color.primary}cc` },
                '&:disabled': { bgcolor: `${tokens.color.primary}44` },
              }}
            >
              Play All
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={handleShuffle}
              disabled={orderedStories.length === 0}
              sx={{
                borderColor: `${tokens.color.primary}66`,
                color: tokens.color.primary,
                '&:hover': { borderColor: tokens.color.primary, bgcolor: `${tokens.color.primary}12` },
              }}
            >
              Shuffle
            </Button>
            {isOwner && !isCurated && (
              <Button
                variant="text"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ color: 'text.disabled', '&:hover': { color: 'error.light' }, ml: 'auto' }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v: 'stories' | 'map') => setTab(v)}
        sx={{
          mb: 2,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600 },
          '& .Mui-selected': { color: tokens.color.primary },
          '& .MuiTabs-indicator': { bgcolor: tokens.color.primary },
        }}
      >
        <Tab label="Stories" value="stories" />
        <Tab label="Map" value="map" />
      </Tabs>

      {/* Stories tab */}
      {tab === 'stories' && (
        <Box>
          {orderedStories.length === 0 ? (
            <Box
              sx={{
                py: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                color: 'text.secondary',
              }}
            >
              <QueueMusicIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              <Typography variant="body1">This playlist is empty</Typography>
              {isOwner && (
                <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
                  Browse stories and add them to this playlist from the Explore page.
                </Typography>
              )}
            </Box>
          ) : (
            orderedStories.map((story, index) => {
              const isActive = story.id === activeStoryId
              const isCurrentlyPlaying = isActive && isPlaying
              return (
                <PlaylistStoryRow
                  key={story.id}
                  story={story}
                  index={index}
                  isActive={isActive}
                  isPlaying={isCurrentlyPlaying}
                  onPlay={() => handleRowPlay(story, index)}
                  onRemove={
                    isOwner && !isCurated
                      ? () => handleRemove(story.id)
                      : undefined
                  }
                />
              )
            })
          )}
        </Box>
      )}

      {/* Map tab */}
      {tab === 'map' && (
        <PlaylistMapView
          stories={orderedStories}
          activeStoryId={activeStoryId}
          onSelectStory={handleSelectOnMap}
        />
      )}

      {/* Curator badge for curated playlists */}
      {isCurated && (
        <Box sx={{ mt: 3 }}>
          <Chip
            label="Curated by Voices"
            size="small"
            sx={{
              bgcolor: `${tokens.color.primary}22`,
              color: tokens.color.primary,
              border: `1px solid ${tokens.color.primary}44`,
              fontWeight: 600,
            }}
          />
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isPending={deletePlaylist.isPending}
      />
    </Box>
  )
}
