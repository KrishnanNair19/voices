import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import MicNoneIcon from '@mui/icons-material/MicNone'
import NotesIcon from '@mui/icons-material/Notes'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import VideoFileOutlinedIcon from '@mui/icons-material/VideoFileOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { tokens, formatDuration, relativeTime } from '@voices/core'
import type { Story } from '@voices/core'

interface StoryCardProps {
  story: Story
  isSelected: boolean
  onClick: () => void
}

function ContentTypeIcon({ type }: { type: Story['contentType'] }) {
  const sx = { fontSize: 14 }
  if (type === 'audio') return <MicNoneIcon sx={sx} />
  if (type === 'text') return <NotesIcon sx={sx} />
  if (type === 'image') return <ImageOutlinedIcon sx={sx} />
  if (type === 'video') return <VideoFileOutlinedIcon sx={sx} />
  // mixed
  return <MicNoneIcon sx={sx} />
}

export default function StoryCard({ story, isSelected, onClick }: StoryCardProps) {
  const hasCover = story.mediaUrls?.[0] ?? story.thumbnailUrl

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        borderLeft: '3px solid',
        borderLeftColor: isSelected ? tokens.color.primary : 'transparent',
        bgcolor: isSelected ? `${tokens.color.primary}0a` : 'transparent',
        transition: 'all 0.15s',
        '&:hover': {
          bgcolor: isSelected ? `${tokens.color.primary}0a` : 'rgba(255,255,255,0.03)',
        },
      }}
    >
      {/* Thumbnail or placeholder */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 1.5,
          flexShrink: 0,
          overflow: 'hidden',
          bgcolor: `${tokens.color.primary}18`,
          border: `1px solid ${tokens.color.primary}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasCover ? (
          <img
            src={hasCover}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ color: tokens.color.primary, opacity: 0.6 }}>
            <ContentTypeIcon type={story.contentType} />
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Title — clickable to listen page */}
        <Typography
          component={Link}
          to={`/story/${story.id}`}
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{
            display: 'block',
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { color: tokens.color.primary },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {story.title}
        </Typography>

        {/* Meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
          <ContentTypeIcon type={story.contentType} />
          {story.durationMs && (
            <Typography variant="caption" color="text.disabled">
              {formatDuration(story.durationMs)}
            </Typography>
          )}
          {story.locationName && (
            <>
              <Typography variant="caption" color="text.disabled">·</Typography>
              <LocationOnOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" noWrap>
                {story.locationName}
              </Typography>
            </>
          )}
          <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
            {relativeTime(story.createdAt)}
          </Typography>
        </Box>

        {/* Tags */}
        {story.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
            {story.tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  bgcolor: `${tokens.color.primary}15`,
                  color: tokens.color.primary,
                  border: `1px solid ${tokens.color.primary}25`,
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
