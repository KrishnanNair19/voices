/**
 * StoryActionMenu — 3-dot context menu for story cards.
 *
 * Actions:
 *   1. Add to Playlist (signed-in users only) — opens playlist picker dialog
 *   2. Add to Queue — appends story to player queue
 *   3. View Author — navigates to the author's profile page
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Avatar from '@mui/material/Avatar'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import {
  tokens,
  usePlaylists,
  useAddStoryToPlaylist,
  useAuthStore,
  usePlayerStore,
} from '@voices/core'
import CreatePlaylistModal from '@/features/playlists/components/CreatePlaylistModal'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoryActionMenuProps {
  storyId: string
  authorId: string
  /** Preferred for URL; falls back to authorId if not provided. */
  authorUsername?: string
  iconSize?: 'small' | 'medium'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoryActionMenu({
  storyId,
  authorId,
  authorUsername,
  iconSize = 'medium',
}: StoryActionMenuProps) {
  const navigate = useNavigate()
  const uid = useAuthStore((s) => s.user?.uid)
  const addToQueue = usePlayerStore((s) => s.addToQueue)

  // Main menu anchor
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(menuAnchor)

  // Playlist picker dialog
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false)

  // Create playlist modal
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Queue feedback
  const [queueAdded, setQueueAdded] = useState(false)

  // Track which playlists this story has been added to in this session
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set())

  // Data
  const { data: playlists, isLoading: playlistsLoading } = usePlaylists(uid ?? undefined)
  const addStory = useAddStoryToPlaylist()

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
  }

  const closeMenu = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setMenuAnchor(null)
  }

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    setPlaylistDialogOpen(true)
  }

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    addToQueue(storyId)
    setQueueAdded(true)
    setTimeout(() => setQueueAdded(false), 2000)
  }

  const handleViewAuthor = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeMenu()
    navigate(`/profile/${authorUsername ?? authorId}`)
  }

  const closePlaylistDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPlaylistDialogOpen(false)
    setAddedTo(new Set())
  }

  const handleAddToSpecificPlaylist = (
    e: React.MouseEvent,
    playlistId: string,
  ) => {
    e.stopPropagation()
    addStory.mutate(
      { playlistId, storyId },
      {
        onSuccess: () => {
          setAddedTo((prev) => new Set([...prev, playlistId]))
        },
      },
    )
  }

  const handleNewPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPlaylistDialogOpen(false)
    setCreateModalOpen(true)
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const ownPlaylists = (playlists ?? []).filter((pl) => pl.ownerId === uid)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger button */}
      <IconButton
        size={iconSize}
        onClick={openMenu}
        sx={{ color: 'text.secondary' }}
        aria-label="Story actions"
      >
        <MoreVertIcon fontSize={iconSize} />
      </IconButton>

      {/* Main menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={(e) => closeMenu(e as React.MouseEvent)}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              bgcolor: tokens.color.surface,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 1.5,
              minWidth: 200,
            },
          },
        }}
      >
        {/* Add to Playlist — only for signed-in users */}
        {uid && (
          <MenuItem onClick={handleAddToPlaylist}>
            <ListItemIcon>
              <PlaylistAddIcon sx={{ color: tokens.color.primary }} />
            </ListItemIcon>
            <ListItemText primary="Add to Playlist" />
          </MenuItem>
        )}

        {/* Add to Queue */}
        <MenuItem onClick={handleAddToQueue}>
          <ListItemIcon>
            {queueAdded ? (
              <CheckIcon sx={{ color: tokens.color.primary }} />
            ) : (
              <QueueMusicIcon />
            )}
          </ListItemIcon>
          <ListItemText primary={queueAdded ? 'Added!' : 'Add to Queue'} />
        </MenuItem>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* View Author */}
        <MenuItem onClick={handleViewAuthor}>
          <ListItemIcon>
            <PersonOutlineIcon />
          </ListItemIcon>
          <ListItemText primary="View Author" />
        </MenuItem>
      </Menu>

      {/* Playlist picker dialog */}
      <Dialog
        open={playlistDialogOpen}
        onClose={(e) => closePlaylistDialog(e as React.MouseEvent)}
        onClick={(e) => e.stopPropagation()}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: tokens.color.surface,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Add to Playlist</DialogTitle>

        <DialogContent sx={{ px: 0, pt: 0 }}>
          {playlistsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: tokens.color.primary }} />
            </Box>
          ) : ownPlaylists.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 3, py: 2 }}
            >
              No playlists yet. Create one below.
            </Typography>
          ) : (
            <List disablePadding>
              {ownPlaylists.map((pl) => {
                const alreadyAdded =
                  pl.storyIds.includes(storyId) || addedTo.has(pl.id)
                return (
                  <ListItemButton
                    key={pl.id}
                    disabled={alreadyAdded}
                    onClick={(e) =>
                      !alreadyAdded && handleAddToSpecificPlaylist(e, pl.id)
                    }
                    sx={{
                      px: 3,
                      py: 1,
                      ...(alreadyAdded && {
                        bgcolor: `${tokens.color.primary}10`,
                      }),
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                      },
                    }}
                  >
                    {/* Thumbnail */}
                    <Avatar
                      src={pl.coverImageUrl ?? undefined}
                      variant="rounded"
                      sx={{
                        width: 40,
                        height: 40,
                        mr: 1.5,
                        bgcolor: `${tokens.color.primary}30`,
                        borderRadius: 1,
                      }}
                    >
                      <QueueMusicIcon
                        sx={{ fontSize: 20, color: tokens.color.primary }}
                      />
                    </Avatar>

                    <ListItemText
                      primary={pl.title}
                      secondary={`${pl.storyIds.length} ${pl.storyIds.length === 1 ? 'story' : 'stories'}`}
                      slotProps={{
                        primary: { noWrap: true, variant: 'body2' },
                        secondary: { variant: 'caption' },
                      }}
                    />

                    <ListItemIcon sx={{ minWidth: 0, ml: 1 }}>
                      {alreadyAdded ? (
                        <CheckIcon
                          sx={{ color: tokens.color.primary, fontSize: 20 }}
                        />
                      ) : (
                        <AddIcon
                          sx={{ color: 'text.disabled', fontSize: 20 }}
                        />
                      )}
                    </ListItemIcon>
                  </ListItemButton>
                )
              })}
            </List>
          )}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 0, my: 1 }} />

          {/* New Playlist button */}
          <Box sx={{ px: 2 }}>
            <Button
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleNewPlaylist}
              sx={{
                justifyContent: 'flex-start',
                color: tokens.color.primary,
                '&:hover': { bgcolor: `${tokens.color.primary}15` },
              }}
            >
              New Playlist
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Create Playlist modal */}
      <CreatePlaylistModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(id) => {
          setCreateModalOpen(false)
          // Reopen playlist picker so user can confirm their addition
          setAddedTo((prev) => new Set([...prev, id]))
          setPlaylistDialogOpen(true)
        }}
      />
    </>
  )
}
