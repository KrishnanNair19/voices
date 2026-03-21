/**
 * Story listen / detail page — /story/:id
 *
 * Renders the full story based on its contentType:
 *   audio  → AudioPlayer
 *   text   → formatted text body
 *   image  → image gallery
 *   video  → <video> element
 *   mixed  → all applicable sections
 */

import { useEffect, useRef } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import StoryActionMenu from '@/shared/components/StoryActionMenu'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import { tokens, useStory, useIncrementPlay, useUserProfile, relativeTime } from '@voices/core'
import AudioPlayer from '../components/AudioPlayer'

export default function StoryListenPage() {
  const { id } = useParams<{ id: string }>()
  const { data: story, isLoading, error } = useStory(id ?? '')
  const { data: author } = useUserProfile(story?.authorId ?? null)
  const { mutate: incrementPlay } = useIncrementPlay()
  const incrementedId = useRef<string | null>(null)

  // Fire play count once when the story first loads — must be in useEffect,
  // never during render (calling mutate during render causes infinite loops).
  useEffect(() => {
    if (story?.id && incrementedId.current !== story.id) {
      incrementedId.current = story.id
      incrementPlay(story.id)
    }
  }, [story?.id, incrementPlay])

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 3, py: 5 }}>
        <Skeleton width={120} height={32} sx={{ mb: 3 }} />
        <Skeleton width="60%" height={40} sx={{ mb: 1.5 }} />
        <Skeleton width="40%" height={20} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton height={18} sx={{ mb: 1 }} />
        <Skeleton height={18} sx={{ mb: 1 }} />
        <Skeleton width="80%" height={18} />
      </Box>
    )
  }

  if (error || !story) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 3, py: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.message ?? 'Story not found.'}
        </Alert>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Back to Explore
        </Button>
      </Box>
    )
  }

  const hasAudio = !!story.audioUrl
  const hasText = !!story.textContent
  const hasImages = (story.mediaUrls?.length ?? 0) > 0
  const hasVideo = !!story.videoUrl

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 }, py: 5 }}>
      {/* Back + Actions row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          component={RouterLink}
          to="/"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ color: 'text.secondary', pl: 0 }}
        >
          Explore
        </Button>
        <StoryActionMenu
          storyId={story.id}
          authorId={story.authorId}
          authorUsername={author?.username}
        />
      </Box>

      {/* Header */}
      <Typography variant="h4" fontWeight={700} mb={1} lineHeight={1.2}>
        {story.title}
      </Typography>

      {story.description && (
        <Typography variant="body1" color="text.secondary" mb={2}>
          {story.description}
        </Typography>
      )}

      {/* Meta */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Author */}
        <Box
          component={RouterLink}
          to={`/profile/${author?.username ?? story.authorId}`}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
        >
          <Avatar
            src={author?.profileImageUrl ?? undefined}
            sx={{ width: 28, height: 28, bgcolor: tokens.color.primaryDark, fontSize: '0.75rem' }}
          >
            {author?.displayName?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {author?.displayName ?? 'Anonymous'}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.disabled">
          {relativeTime(story.createdAt)}
        </Typography>

        {story.locationName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              {story.locationName}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PlayCircleOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            {story.playCount}
          </Typography>
        </Box>
      </Box>

      {/* Tags */}
      {story.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
          {story.tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              sx={{
                bgcolor: `${tokens.color.primary}18`,
                color: tokens.color.primary,
                border: `1px solid ${tokens.color.primary}33`,
                fontSize: '0.75rem',
              }}
            />
          ))}
        </Box>
      )}

      {/* ── Audio player ──────────────────────────────────────────────────── */}
      {hasAudio && story.audioUrl && (
        <Box sx={{ mb: 4 }}>
          <AudioPlayer src={story.audioUrl} title="Voice recording" />
        </Box>
      )}

      {/* ── Text content ──────────────────────────────────────────────────── */}
      {hasText && story.textContent && (
        <Box
          sx={{
            mb: 4,
            p: 3,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 3,
          }}
        >
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
          >
            {story.textContent}
          </Typography>
        </Box>
      )}

      {/* ── Images ────────────────────────────────────────────────────────── */}
      {hasImages && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: story.mediaUrls!.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 1.5,
            mb: 4,
          }}
        >
          {story.mediaUrls!.map((url, i) => (
            <Box
              key={i}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                aspectRatio: story.mediaUrls!.length === 1 ? '16/9' : '1',
              }}
            >
              <img
                src={url}
                alt={`${story.title} — image ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* ── Video ─────────────────────────────────────────────────────────── */}
      {hasVideo && story.videoUrl && (
        <Box
          sx={{
            mb: 4,
            borderRadius: 3,
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

      {/* Related stories CTA */}
      <Box sx={{ pt: 3, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
        <Button component={RouterLink} to="/" variant="outlined" startIcon={<ArrowBackIcon />}
          sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}>
          Discover more stories
        </Button>
      </Box>
    </Box>
  )
}
