/**
 * AudioPlayer — HTML5 audio with custom MUI controls.
 *
 * Features:
 *   - Play / Pause
 *   - MUI Slider scrubber (syncs with audio currentTime)
 *   - Current time / duration display
 *   - Volume slider
 *   - Keyboard shortcut: Space = play/pause
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import Replay10Icon from '@mui/icons-material/Replay10'
import Forward10Icon from '@mui/icons-material/Forward10'
import { tokens, formatDuration } from '@voices/core'

interface AudioPlayerProps {
  src: string
  title?: string
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      void audio.play()
    }
  }, [isPlaying])

  // Keyboard shortcut: Space = play/pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const v = value as number
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
    setIsMuted(v === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const muted = !isMuted
    setIsMuted(muted)
    audio.muted = muted
  }

  const progress = duration > 0 ? (isSeeking ? seekValue : currentTime) / duration * 100 : 0

  return (
    <Box
      sx={{
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 3,
        p: 2.5,
      }}
    >
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (!isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        onDurationChange={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        preload="metadata"
      />

      {title && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1.5} noWrap>
          {title}
        </Typography>
      )}

      {/* Scrubber */}
      <Slider
        value={progress}
        onChange={(_, v) => {
          setIsSeeking(true)
          setSeekValue(((v as number) / 100) * duration)
        }}
        onChangeCommitted={(_, v) => {
          setIsSeeking(false)
          if (audioRef.current) {
            audioRef.current.currentTime = ((v as number) / 100) * duration
          }
        }}
        sx={{
          color: tokens.color.primary,
          height: 3,
          p: 0,
          mb: 0.5,
          '& .MuiSlider-thumb': {
            width: 12,
            height: 12,
            opacity: 0,
            transition: 'opacity 0.15s',
            '&:hover, &.Mui-focusVisible': { opacity: 1, boxShadow: `0 0 0 6px ${tokens.color.primary}28` },
          },
          '&:hover .MuiSlider-thumb': { opacity: 1 },
          '& .MuiSlider-track': { border: 'none' },
          '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.12)' },
        }}
      />

      {/* Time stamps */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.disabled" fontFamily="monospace">
          {formatDuration((isSeeking ? seekValue : currentTime) * 1000)}
        </Typography>
        <Typography variant="caption" color="text.disabled" fontFamily="monospace">
          {duration > 0 ? formatDuration(duration * 1000) : '--:--'}
        </Typography>
      </Box>

      {/* Controls row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Skip back */}
        <IconButton size="small" onClick={() => skip(-10)} sx={{ color: 'text.secondary' }}>
          <Replay10Icon fontSize="small" />
        </IconButton>

        {/* Play / Pause */}
        <IconButton
          onClick={togglePlay}
          sx={{
            width: 48,
            height: 48,
            bgcolor: tokens.color.primary,
            color: tokens.color.bg,
            mx: 0.5,
            '&:hover': { bgcolor: tokens.color.primaryDark },
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        {/* Skip forward */}
        <IconButton size="small" onClick={() => skip(10)} sx={{ color: 'text.secondary' }}>
          <Forward10Icon fontSize="small" />
        </IconButton>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Volume */}
        <IconButton size="small" onClick={toggleMute} sx={{ color: 'text.secondary' }}>
          {isMuted || volume === 0 ? (
            <VolumeOffIcon fontSize="small" />
          ) : (
            <VolumeUpIcon fontSize="small" />
          )}
        </IconButton>
        <Slider
          value={isMuted ? 0 : volume}
          min={0}
          max={1}
          step={0.05}
          onChange={handleVolumeChange}
          sx={{
            width: 72,
            color: tokens.color.primary,
            height: 3,
            '& .MuiSlider-thumb': { width: 10, height: 10 },
            '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.12)' },
          }}
        />
      </Box>
    </Box>
  )
}
