/**
 * CreatePlaylistModal — dialog for creating a new playlist.
 *
 * Calls useCreatePlaylist() and notifies the parent via onCreated(id).
 */

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { useCreatePlaylist, useAuthStore, tokens } from '@voices/core'

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreatePlaylistModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreatePlaylistModal({
  open,
  onClose,
  onCreated,
}: CreatePlaylistModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const uid = useAuthStore((s) => s.user?.uid)
  const createPlaylist = useCreatePlaylist()

  const handleClose = () => {
    if (createPlaylist.isPending) return
    setTitle('')
    setDescription('')
    setIsPublic(false)
    createPlaylist.reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!title.trim() || !uid) return

    const newId = await createPlaylist.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      ownerId: uid,
      isPublic,
    })

    setTitle('')
    setDescription('')
    setIsPublic(false)
    onClose()
    onCreated?.(newId)
  }

  const canSubmit = title.trim().length > 0 && !!uid && !createPlaylist.isPending

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: tokens.color.surface,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          New Playlist
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title field */}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            autoFocus
            inputProps={{ maxLength: 120 }}
            disabled={createPlaylist.isPending}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />

          {/* Description field */}
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            inputProps={{ maxLength: 500 }}
            disabled={createPlaylist.isPending}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />

          {/* Public toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={createPlaylist.isPending}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: tokens.color.primary },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: tokens.color.primary,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Make public
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Anyone can discover and listen to this playlist
                </Typography>
              </Box>
            }
          />

          {/* Error display */}
          {createPlaylist.isError && (
            <Alert severity="error" sx={{ borderRadius: 1.5 }}>
              {createPlaylist.error?.message ?? 'Failed to create playlist. Please try again.'}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={createPlaylist.isPending}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          startIcon={
            createPlaylist.isPending ? (
              <CircularProgress size={16} sx={{ color: 'inherit' }} />
            ) : undefined
          }
          sx={{
            bgcolor: tokens.color.primary,
            color: tokens.color.bg,
            fontWeight: 700,
            '&:hover': { bgcolor: `${tokens.color.primary}cc` },
            '&:disabled': { bgcolor: `${tokens.color.primary}44` },
          }}
        >
          {createPlaylist.isPending ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
