/**
 * MiniPlayer — fixed bottom audio player bar.
 *
 * Renders only when a story is active in usePlayerStore.
 * Drives a hidden <audio> element and syncs state back to the store.
 * Supports queue navigation (prev/next) and auto-advances on track end.
 */

import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import CloseIcon from '@mui/icons-material/Close'
import MicNoneIcon from '@mui/icons-material/MicNone'
import { usePlayerStore, useStory, tokens, formatDuration } from '@voices/core'

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAYER_HEIGHT = 72

// ── MiniPlayer ────────────────────────────────────────────────────────────────

export default function MiniPlayer() {
  const activeStoryId = usePlayerStore((s) => s.activeStoryId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs)
  const durationMs = usePlayerStore((s) => s.durationMs)
  const queue = usePlayerStore((s) => s.queue || [])
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const { play, pause, seek, setCurrentTime, setDuration, reset, nextInQueue, prevInQueue } =
    usePlayerStore()

  const { data: story } = useStory(activeStoryId)
  const audioRef = useRef<HTMLAudioElement>(null)

  const hasPrev = queueIndex > 0
  const hasNext = queueIndex < queue.length - 1

  // ── Sync audio src when activeStoryId changes ──────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !story) return

    const newSrc = story.audioUrl ?? ''
    if (audio.src !== newSrc) {
      audio.src = newSrc
      audio.load()
    }

    if (isPlaying && newSrc) {
      void audio.play().catch(() => {
        // Autoplay may be blocked; pause store to reflect reality
        pause()
      })
    }
    // We intentionally don't list isPlaying here — handled by next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoryId, story])

  // ── Sync play/pause state ──────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      if (audio.src && audio.paused) {
        void audio.play().catch(() => {
          pause()
        })
      }
    } else {
      if (!audio.paused) {
        audio.pause()
      }
    }
  }, [isPlaying, pause])

  // ── Audio event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime * 1000)
    }
    const onLoadedMetadata = () => {
      setDuration(audio.duration * 1000)
    }
    const onEnded = () => {
      nextInQueue()
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [setCurrentTime, setDuration, nextInQueue])

  // ── Don't render when idle ─────────────────────────────────────────────────
  if (!activeStoryId) return null

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play(activeStoryId)
    }
  }

  const handleSeek = (_: Event, value: number | number[]) => {
    const ms = Array.isArray(value) ? value[0] : value
    if (ms === undefined) return
    seek(ms)
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = ms / 1000
    }
  }

  const handleClose = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
    }
    reset()
  }

  const thumbnail = story?.coverImageUrl ?? story?.thumbnailUrl
  const title = story?.title ?? 'Loading…'
  const authorId = story?.authorId ?? ''

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="metadata" />

      {/* Player bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          height: `${PLAYER_HEIGHT}px`,
          bgcolor: tokens.color.surface,
          borderTop: `1px solid rgba(255,255,255,0.08)`,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          gap: 1.5,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Progress slider (spans full width at the very top of bar) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            px: 0,
          }}
        >
          <Slider
            size="small"
            min={0}
            max={durationMs || 100}
            value={currentTimeMs}
            onChange={handleSeek}
            aria-label="Playback position"
            sx={{
              color: tokens.color.primary,
              height: 3,
              borderRadius: 0,
              p: 0,
              '& .MuiSlider-thumb': {
                width: 10,
                height: 10,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 0 6px ${tokens.color.primary}33`,
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.2,
              },
            }}
          />
        </Box>

        {/* Thumbnail / icon */}
        <Avatar
          src={thumbnail}
          variant="rounded"
          sx={{
            width: 44,
            height: 44,
            bgcolor: `${tokens.color.primary}22`,
            flexShrink: 0,
            mt: '3px', // slight offset for slider
          }}
        >
          <MicNoneIcon sx={{ color: tokens.color.primary, fontSize: 22 }} />
        </Avatar>

        {/* Title + time */}
        <Box sx={{ flex: 1, minWidth: 0, mt: '3px' }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{ color: 'text.secondary', lineHeight: 1.3 }}
          >
            {authorId ? `by ${authorId}` : '\u00A0'}
          </Typography>
        </Box>

        {/* Time display */}
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', flexShrink: 0, mt: '3px', minWidth: 72, textAlign: 'right' }}
        >
          {formatDuration(currentTimeMs)}{durationMs > 0 ? ` / ${formatDuration(durationMs)}` : ''}
        </Typography>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: '3px', flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={prevInQueue}
            disabled={!hasPrev}
            aria-label="Previous story"
            sx={{ color: hasPrev ? 'text.primary' : 'text.disabled' }}
          >
            <SkipPreviousIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="medium"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            sx={{
              color: tokens.color.primary,
              bgcolor: `${tokens.color.primary}18`,
              '&:hover': { bgcolor: `${tokens.color.primary}30` },
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>

          <IconButton
            size="small"
            onClick={nextInQueue}
            disabled={!hasNext}
            aria-label="Next story"
            sx={{ color: hasNext ? 'text.primary' : 'text.disabled' }}
          >
            <SkipNextIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleClose}
            aria-label="Close player"
            sx={{ color: 'text.secondary', ml: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </>
  )
}
