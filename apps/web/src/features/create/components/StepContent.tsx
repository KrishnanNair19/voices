import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import VoiceRecorder from './VoiceRecorder'
import MediaAttachments from './MediaAttachments'
import type { PrimaryType } from '../hooks/useCreateStoryController'

interface StepContentProps {
  primaryType: PrimaryType

  // Text
  textContent: string
  onTextChange: (v: string) => void

  // Audio
  onRecorded: (blob: Blob, durationMs: number) => void
  onResetRecording: () => void
  hasRecording: boolean

  // Media
  images: File[]
  video: File | null
  maxImages: number
  onAddImages: (files: File[]) => void
  onRemoveImage: (index: number) => void
  onSetVideo: (file: File | null) => void

  // Navigation
  canProceed: boolean
  onBack: () => void
  onNext: () => void
}

const TEXT_MAX = 5000

export default function StepContent({
  primaryType,
  textContent,
  onTextChange,
  onRecorded,
  onResetRecording,
  hasRecording,
  images,
  video,
  maxImages,
  onAddImages,
  onRemoveImage,
  onSetVideo,
  canProceed,
  onBack,
  onNext,
}: StepContentProps) {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        {primaryType === 'text' ? 'Write your story' : 'Record your story'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {primaryType === 'text'
          ? 'Share your thoughts, memories, or observations.'
          : 'Hit record and speak freely. You can pause and re-record.'}
      </Typography>

      {/* ── Primary content ───────────────────────────────────────────────── */}
      {primaryType === 'text' ? (
        <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
          <InputLabel shrink>Story</InputLabel>
          <FilledInput
            multiline
            minRows={8}
            maxRows={20}
            value={textContent}
            onChange={(e) => onTextChange(e.target.value)}
            inputProps={{ maxLength: TEXT_MAX }}
            autoFocus
            sx={{ alignItems: 'flex-start', pt: 3 }}
          />
          <FormHelperText sx={{ textAlign: 'right' }}>
            {textContent.length}/{TEXT_MAX}
          </FormHelperText>
        </FormControl>
      ) : (
        <Box sx={{ mb: 3 }}>
          <VoiceRecorder
            onRecorded={onRecorded}
            onReset={onResetRecording}
            hasRecording={hasRecording}
          />
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* ── Media attachments ─────────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <MediaAttachments
          images={images}
          video={video}
          maxImages={maxImages}
          onAddImages={onAddImages}
          onRemoveImage={onRemoveImage}
          onSetVideo={onSetVideo}
        />
      </Box>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!canProceed}
          sx={{ flex: 1 }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  )
}
