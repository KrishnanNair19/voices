/**
 * PlaylistCard — compact card for a single playlist in the grid view.
 */

import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import QueueMusicIcon from '@mui/icons-material/QueueMusic'
import { tokens } from '@voices/core'
import type { Playlist } from '@voices/core'

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlaylistCardProps {
  playlist: Playlist
  onClick: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const { title, description, coverImageUrl, storyIds, isPublic } = playlist

  return (
    <Card
      sx={{
        bgcolor: tokens.color.surface,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 2,
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          borderColor: tokens.color.primary,
          boxShadow: `0 0 0 1px ${tokens.color.primary}55, 0 4px 24px rgba(0,0,0,0.4)`,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        {/* Cover image or gradient placeholder */}
        {coverImageUrl ? (
          <CardMedia
            component="img"
            height={160}
            image={coverImageUrl}
            alt={title}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${tokens.color.primary}33 0%, ${tokens.color.surface} 100%)`,
            }}
          >
            <QueueMusicIcon sx={{ fontSize: 56, color: tokens.color.primary, opacity: 0.7 }} />
          </Box>
        )}

        <CardContent sx={{ pb: '12px !important' }}>
          {/* Title */}
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
          >
            {title}
          </Typography>

          {/* Description snippet */}
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {description}
            </Typography>
          )}

          {/* Footer row: story count + public chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: description ? 0 : 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
              {storyIds.length} {storyIds.length === 1 ? 'story' : 'stories'}
            </Typography>
            {isPublic && (
              <Chip
                label="Public"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 600,
                  bgcolor: `${tokens.color.primary}22`,
                  color: tokens.color.primary,
                  border: `1px solid ${tokens.color.primary}44`,
                }}
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
