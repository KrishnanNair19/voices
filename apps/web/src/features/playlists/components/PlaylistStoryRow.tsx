/**
 * PlaylistStoryRow — a single story entry in the playlist detail list.
 *
 * Displays: index number, thumbnail, title (with animated bars when playing),
 * duration, and an optional remove button.
 *
 * Height: 56px — consistent Spotify-style row layout.
 */

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MicNoneIcon from '@mui/icons-material/MicNone'
import { tokens, formatDuration } from '@voices/core'
import type { Story } from '@voices/core'

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlaylistStoryRowProps {
  story: Story
  index: number
  isPlaying: boolean
  isActive: boolean
  onPlay: () => void
  onRemove?: () => void
}

// ── Animated playing bars ─────────────────────────────────────────────────────

const BAR_KEYFRAMES = {
  '@keyframes playingBar1': {
    '0%, 100%': { height: '4px' },
    '50%': { height: '12px' },
  },
  '@keyframes playingBar2': {
    '0%, 100%': { height: '8px' },
    '33%': { height: '3px' },
    '66%': { height: '14px' },
  },
  '@keyframes playingBar3': {
    '0%, 100%': { height: '6px' },
    '40%': { height: '14px' },
    '80%': { height: '3px' },
  },
}

function PlayingBars() {
  const barBase = {
    width: '3px',
    borderRadius: '2px',
    bgcolor: tokens.color.primary,
    display: 'inline-block',
    transformOrigin: 'bottom',
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
        height: 16,
        ml: 0.75,
        ...BAR_KEYFRAMES,
      }}
    >
      <Box sx={{ ...barBase, height: '4px', animation: 'playingBar1 0.9s ease-in-out infinite' }} />
      <Box sx={{ ...barBase, height: '8px', animation: 'playingBar2 1.1s ease-in-out infinite' }} />
      <Box sx={{ ...barBase, height: '6px', animation: 'playingBar3 0.8s ease-in-out infinite' }} />
    </Box>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlaylistStoryRow({
  story,
  index,
  isPlaying,
  isActive,
  onPlay,
  onRemove,
}: PlaylistStoryRowProps) {
  const thumbnail = story.coverImageUrl ?? story.thumbnailUrl
  const duration = story.durationMs != null ? formatDuration(story.durationMs) : null

  return (
    <Box
      onClick={onPlay}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        px: 1,
        gap: 1.5,
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.05)',
        },
        bgcolor: isActive ? 'rgba(29,219,181,0.06)' : 'transparent',
      }}
    >
      {/* Index number */}
      <Typography
        variant="body2"
        sx={{
          width: 24,
          textAlign: 'center',
          fontWeight: isActive ? 700 : 400,
          color: isActive ? tokens.color.primary : 'text.secondary',
          flexShrink: 0,
          fontSize: 13,
        }}
      >
        {index + 1}
      </Typography>

      {/* Thumbnail / icon */}
      <Avatar
        src={thumbnail}
        variant="rounded"
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          bgcolor: `${tokens.color.primary}1a`,
          border: isActive ? `1.5px solid ${tokens.color.primary}66` : '1.5px solid transparent',
        }}
      >
        <MicNoneIcon sx={{ color: tokens.color.primary, fontSize: 18 }} />
      </Avatar>

      {/* Title + author */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: isActive ? 700 : 500,
              color: isActive ? tokens.color.primary : 'text.primary',
              lineHeight: 1.3,
            }}
          >
            {story.title}
          </Typography>
          {isPlaying && isActive && <PlayingBars />}
        </Box>
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
          {story.authorId}
        </Typography>
      </Box>

      {/* Duration */}
      {duration && (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', flexShrink: 0, minWidth: 40, textAlign: 'right' }}
        >
          {duration}
        </Typography>
      )}

      {/* Remove button */}
      {onRemove && (
        <Tooltip title="Remove from playlist" placement="left">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            sx={{
              flexShrink: 0,
              color: 'text.disabled',
              '&:hover': { color: 'error.light' },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
