import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { tokens } from '@voices/core'

interface StepDetailsProps {
  title: string
  titleError: string
  onTitleChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  isPublic: boolean
  onIsPublicChange: (v: boolean) => void
  onBack: () => void
  onNext: () => void
  onValidate: () => boolean
}

const TITLE_MAX = 120
const DESC_MAX = 300
const SUGGESTED_TAGS = ['travel', 'nature', 'history', 'local', 'music', 'food', 'culture', 'art']

export default function StepDetails({
  title,
  titleError,
  onTitleChange,
  description,
  onDescriptionChange,
  tags,
  onAddTag,
  onRemoveTag,
  isPublic,
  onIsPublicChange,
  onBack,
  onNext,
  onValidate,
}: StepDetailsProps) {
  const [tagInput, setTagInput] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  const commitTag = () => {
    if (tagInput.trim()) {
      onAddTag(tagInput)
      setTagInput('')
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag()
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1] ?? '')
    }
  }

  const handleNext = () => {
    commitTag()
    if (onValidate()) onNext()
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Story details
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Give your story a title and help others discover it.
      </Typography>

      {/* Title */}
      <FormControl fullWidth variant="filled" sx={{ mb: 2.5 }} error={!!titleError}>
        <InputLabel>Title *</InputLabel>
        <FilledInput
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          inputProps={{ maxLength: TITLE_MAX }}
          autoFocus
        />
        <FormHelperText sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{titleError}</span>
          <span>{title.length}/{TITLE_MAX}</span>
        </FormHelperText>
      </FormControl>

      {/* Description */}
      <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
        <InputLabel>Description (optional)</InputLabel>
        <FilledInput
          multiline
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          inputProps={{ maxLength: DESC_MAX }}
        />
        <FormHelperText sx={{ textAlign: 'right' }}>{description.length}/{DESC_MAX}</FormHelperText>
      </FormControl>

      {/* Tags */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} mb={1}>
          Tags{' '}
          <Typography component="span" variant="caption" color="text.secondary">
            (optional, up to 10)
          </Typography>
        </Typography>

        {/* Tag chips + input */}
        <Box
          onClick={() => tagInputRef.current?.focus()}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            minHeight: 48,
            cursor: 'text',
            '&:focus-within': {
              borderColor: tokens.color.primary,
            },
          }}
        >
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              onDelete={() => onRemoveTag(tag)}
              sx={{
                bgcolor: `${tokens.color.primary}22`,
                color: tokens.color.primary,
                borderColor: `${tokens.color.primary}44`,
                border: '1px solid',
                '& .MuiChip-deleteIcon': { color: tokens.color.primary, opacity: 0.6 },
              }}
            />
          ))}
          {tags.length < 10 && (
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.replace(/[^a-z0-9-\s]/gi, ''))}
              onKeyDown={handleTagKeyDown}
              onBlur={commitTag}
              placeholder={tags.length === 0 ? 'Add tags…' : ''}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'inherit',
                fontSize: '0.875rem',
                minWidth: 80,
                flex: 1,
              }}
            />
          )}
        </Box>

        {/* Suggested tags */}
        {tags.length < 10 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).slice(0, 6).map((t) => (
              <Chip
                key={t}
                label={`#${t}`}
                size="small"
                onClick={() => onAddTag(t)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'text.secondary',
                  border: '1px solid',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  '&:hover': { borderColor: tokens.color.primary, color: tokens.color.primary },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Visibility */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(255,255,255,0.03)',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {isPublic ? 'Public' : 'Private'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isPublic
              ? 'Anyone can discover this story on the map.'
              : 'Only you can see this story.'}
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => onIsPublicChange(e.target.checked)}
              sx={{
                '& .MuiSwitch-thumb': { bgcolor: isPublic ? tokens.color.primary : undefined },
                '& .Mui-checked + .MuiSwitch-track': { bgcolor: `${tokens.color.primary}55` },
              }}
            />
          }
          label=""
          sx={{ m: 0 }}
        />
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}
        >
          Back
        </Button>
        <Button variant="contained" onClick={handleNext} sx={{ flex: 1 }}>
          Continue
        </Button>
      </Box>
    </Box>
  )
}
