/**
 * Story detail panel in the explore sidebar.
 *
 * Compact version of StoryListenPage — keeps the Leaflet map visible.
 * Shows audio player / text / images / video depending on contentType.
 */

import { useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import {
  tokens,
  useStory,
  useIncrementPlay,
  useUserProfile,
  relativeTime,
} from '@voices/core'
import AudioPlayer from '../../story/components/AudioPlayer'

interface Props {
  storyId: string
  onBack: () => void
}

export default function SidebarStoryDetail({ storyId, onBack }: Props) {
  const { data: story, isLoading } = useStory(storyId)
  const { data: author } = useUserProfile(story?.authorId ?? null)
  const { mutate: incrementPlay } = useIncrementPlay()
  const incrementedId = useRef<string | null>(null)

  useEffect(() => {
    if (story?.id && incrementedId.current !== story.id) {
      incrementedId.current = story.id
      incrementPlay(story.id)
    }
  }, [story?.id, incrementPlay])

  if (isLoading) {
    return (
      <Box sx={{ px: 2, py: 2, flex: 1 }}>
        <Skeleton width={80} height={28} sx={{ mb: 2 }} />
        <Skeleton width="70%" height={28} sx={{ mb: 1 }} />
        <Skeleton width="50%" height={16} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton height={16} sx={{ mb: 0.5 }} />
        <Skeleton height={16} width="80%" />
      </Box>
    )
  }

  if (!story) return null

  const hasAudio = !!story.audioUrl
  const hasText = !!story.textContent
  const hasImages = (story.mediaUrls?.length ?? 0) > 0
  const hasVideo = !!story.videoUrl

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Top bar */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.default',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ color: 'text.secondary', pl: 0, minWidth: 0 }}
        >
          Back
        </Button>
        <IconButton
          component={RouterLink}
          to={`/story/${storyId}`}
          size="small"
          sx={{ color: 'text.disabled' }}
          title="Open full page"
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 3 }}>
        {/* Title */}
        <Typography variant="h6" fontWeight={700} lineHeight={1.3} mt={2} mb={0.5}>
          {story.title}
        </Typography>

        {/* Description */}
        {story.description && (
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {story.description}
          </Typography>
        )}

        {/* Author + meta */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box
            component={RouterLink}
            to={`/profile/${author?.username ?? story.authorId}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              textDecoration: 'none',
            }}
          >
            <Avatar
              src={author?.profileImageUrl ?? undefined}
              sx={{
                width: 22,
                height: 22,
                bgcolor: tokens.color.primaryDark,
                fontSize: '0.65rem',
              }}
            >
              {author?.displayName?.[0]?.toUpperCase() ?? '?'}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {author?.displayName ?? 'Anonymous'}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.disabled">
            {relativeTime(story.createdAt)}
          </Typography>

          {story.locationName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                {story.locationName}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <PlayCircleOutlineIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              {story.playCount}
            </Typography>
          </Box>
        </Box>

        {/* Tags */}
        {story.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {story.tags.map((tag) => (
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

        {/* Audio player */}
        {hasAudio && story.audioUrl && (
          <Box sx={{ mb: 2 }}>
            <AudioPlayer src={story.audioUrl} title="Voice recording" />
          </Box>
        )}

        {/* Text content */}
        {hasText && story.textContent && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
            >
              {story.textContent.length > 400
                ? story.textContent.slice(0, 400) + '…'
                : story.textContent}
            </Typography>
            {story.textContent.length > 400 && (
              <Button
                component={RouterLink}
                to={`/story/${storyId}`}
                size="small"
                sx={{ mt: 0.5, color: tokens.color.primary, pl: 0 }}
              >
                Read more
              </Button>
            )}
          </Box>
        )}

        {/* Images */}
        {hasImages && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                story.mediaUrls!.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 1,
              mb: 2,
            }}
          >
            {story.mediaUrls!.slice(0, 4).map((url, i) => (
              <Box
                key={i}
                sx={{ borderRadius: 1.5, overflow: 'hidden', aspectRatio: '1' }}
              >
                <img
                  src={url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Video */}
        {hasVideo && story.videoUrl && (
          <Box
            sx={{
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#000',
              aspectRatio: '16/9',
            }}
          >
            <video
              src={story.videoUrl}
              controls
              style={{ width: '100%', height: '100%', display: 'block' }}
              poster={story.thumbnailUrl}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
