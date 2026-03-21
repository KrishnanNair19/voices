/**
 * Voice recorder UI component.
 * Uses useWebAudio internally; exposes the recorded Blob upward via onRecorded.
 */

import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import MicIcon from '@mui/icons-material/Mic'
import StopIcon from '@mui/icons-material/Stop'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { tokens } from '@voices/core'
import { useWebAudio } from '../hooks/useWebAudio'
import { formatDuration } from '@voices/core'

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, durationMs: number) => void
  onReset: () => void
  hasRecording: boolean
}

/** Animated waveform bars using the AnalyserNode. */
function WaveformBars({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!analyser || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = 32
      const barWidth = canvas.width / barCount - 2
      let x = 0

      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * bufferLength)
        const value = (dataArray[idx] ?? 0) / 255
        const barHeight = Math.max(4, value * canvas.height)
        const alpha = 0.4 + value * 0.6
        ctx.fillStyle = `rgba(29, 219, 181, ${alpha})`
        ctx.beginPath()
        ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight, 2)
        ctx.fill()
        x += barWidth + 2
      }
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={60}
      style={{ width: '100%', height: 60, borderRadius: 8 }}
    />
  )
}

export default function VoiceRecorder({ onRecorded, onReset, hasRecording }: VoiceRecorderProps) {
  const audio = useWebAudio()

  // Bubble recorded blob up when recording stops
  useEffect(() => {
    if (audio.recordingState === 'done' && audio.audioBlob) {
      onRecorded(audio.audioBlob, audio.durationMs)
    }
  }, [audio.recordingState, audio.audioBlob, audio.durationMs, onRecorded])

  const handleReset = () => {
    audio.reset()
    onReset()
  }

  const isRecording = audio.recordingState === 'recording'
  const isPaused = audio.recordingState === 'paused'
  const isDone = audio.recordingState === 'done'
  const isIdle = audio.recordingState === 'idle'

  return (
    <Box>
      {audio.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {audio.error}
        </Alert>
      )}

      {/* Waveform / idle graphic */}
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3,
          p: 2,
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {isRecording || isPaused ? (
          <WaveformBars analyser={audio.analyser} />
        ) : (
          <Box
            sx={{
              height: 60,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MicIcon sx={{ fontSize: 36, color: isDone ? tokens.color.primary : 'text.disabled' }} />
          </Box>
        )}

        <Typography
          variant="h4"
          fontWeight={700}
          fontFamily="monospace"
          color={isRecording ? tokens.color.primary : 'text.primary'}
        >
          {formatDuration(audio.durationMs)}
        </Typography>

        {isPaused && (
          <Typography variant="caption" color="warning.main">
            Paused
          </Typography>
        )}
        {isDone && (
          <Typography variant="caption" color="success.main">
            Recording complete
          </Typography>
        )}
      </Box>

      {/* Playback (after recording) */}
      {isDone && audio.audioUrl && (
        <Box sx={{ mb: 2 }}>
          <audio controls src={audio.audioUrl} style={{ width: '100%', borderRadius: 8 }} />
        </Box>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
        {isIdle && !hasRecording && (
          <Button
            variant="contained"
            startIcon={<MicIcon />}
            onClick={audio.startRecording}
            size="large"
            sx={{ flex: 1 }}
          >
            Start recording
          </Button>
        )}

        {isRecording && (
          <>
            <IconButton
              onClick={audio.pauseRecording}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
              }}
            >
              <PauseIcon />
            </IconButton>
            <IconButton
              onClick={audio.stopRecording}
              size="large"
              sx={{
                bgcolor: 'error.main',
                color: '#fff',
                width: 56,
                height: 56,
                '&:hover': { bgcolor: 'error.dark' },
              }}
            >
              <StopIcon />
            </IconButton>
          </>
        )}

        {isPaused && (
          <>
            <Button
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              onClick={audio.resumeRecording}
              sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Resume
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={audio.stopRecording}
              sx={{ flex: 1 }}
            >
              Finish
            </Button>
          </>
        )}

        {isDone && (
          <Button
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleReset}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}
          >
            Re-record
          </Button>
        )}
      </Box>
    </Box>
  )
}
