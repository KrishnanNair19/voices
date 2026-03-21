/**
 * Media attachment picker — up to 3 images + 1 video.
 * Images are shown as a thumbnail grid; video shows filename + remove button.
 */

import { useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import VideoFileOutlinedIcon from '@mui/icons-material/VideoFileOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { tokens } from '@voices/core'

interface MediaAttachmentsProps {
  images: File[]
  video: File | null
  maxImages: number
  onAddImages: (files: File[]) => void
  onRemoveImage: (index: number) => void
  onSetVideo: (file: File | null) => void
}

export default function MediaAttachments({
  images,
  video,
  maxImages,
  onAddImages,
  onRemoveImage,
  onSetVideo,
}: MediaAttachmentsProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onAddImages(files)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onSetVideo(file)
    e.target.value = ''
  }

  const canAddImages = images.length < maxImages

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} mb={1.5}>
        Attachments{' '}
        <Typography component="span" variant="caption" color="text.secondary">
          (optional)
        </Typography>
      </Typography>

      {/* ── Images ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {images.map((file, i) => {
          const url = URL.createObjectURL(file)
          return (
            <Box
              key={i}
              sx={{
                position: 'relative',
                width: 88,
                height: 88,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <img
                src={url}
                alt={`attachment-${i}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onLoad={() => URL.revokeObjectURL(url)}
              />
              <IconButton
                size="small"
                onClick={() => onRemoveImage(i)}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  bgcolor: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  p: 0.25,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )
        })}

        {canAddImages && (
          <Tooltip title={`Add photo (${images.length}/${maxImages})`}>
            <Box
              onClick={() => imageInputRef.current?.click()}
              sx={{
                width: 88,
                height: 88,
                borderRadius: 2,
                border: `2px dashed`,
                borderColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: tokens.color.primary },
              }}
            >
              <AddPhotoAlternateOutlinedIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                {images.length}/{maxImages}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Box>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleImageFiles}
      />

      {/* ── Video ────────────────────────────────────────────────────────────── */}
      {video ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(255,255,255,0.03)',
          }}
        >
          <VideoFileOutlinedIcon sx={{ color: tokens.color.primary, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, wordBreak: 'break-all' }}>
            {video.name}
          </Typography>
          <IconButton size="small" onClick={() => onSetVideo(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<VideoFileOutlinedIcon />}
          size="small"
          onClick={() => videoInputRef.current?.click()}
          sx={{
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'text.secondary',
            '&:hover': { borderColor: 'rgba(255,255,255,0.25)' },
          }}
        >
          Add video
        </Button>
      )}

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleVideoFile}
      />
    </Box>
  )
}
