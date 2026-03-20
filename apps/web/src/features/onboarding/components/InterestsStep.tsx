import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { tokens } from '@voices/core'

const INTEREST_OPTIONS = [
  'Travel', 'History', 'Music', 'Nature', 'Food', 'Art',
  'Technology', 'Sports', 'Literature', 'Film', 'Science',
  'Architecture', 'Culture', 'Adventure', 'Photography',
  'Folklore', 'Meditation', 'Local Secrets',
]

interface InterestsStepProps {
  initialTags: string[]
  isSubmitting: boolean
  error: string | null
  onFinish: (tags: string[]) => Promise<boolean>
  onSkip: () => Promise<boolean>
}

export default function InterestsStep({
  initialTags,
  isSubmitting,
  error,
  onFinish,
  onSkip,
}: InterestsStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTags))

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }

  const handleFinish = async () => {
    await onFinish([...selected])
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        What interests you?
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        We&apos;ll use this to personalise your Explore feed. Pick as many as you like.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
        {INTEREST_OPTIONS.map((tag) => {
          const isSelected = selected.has(tag)
          return (
            <Chip
              key={tag}
              label={tag}
              onClick={() => toggle(tag)}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.15s',
                ...(isSelected
                  ? {
                      bgcolor: tokens.color.primary,
                      color: tokens.color.bg,
                      borderColor: tokens.color.primary,
                      '&:hover': { bgcolor: tokens.color.primaryDark },
                    }
                  : {
                      borderColor: 'rgba(255,255,255,0.15)',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: tokens.color.primary,
                        color: tokens.color.primary,
                        bgcolor: `${tokens.color.primary}12`,
                      },
                    }),
              }}
            />
          )
        })}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={isSubmitting}
        onClick={handleFinish}
        sx={{ mb: 1.5 }}
      >
        {isSubmitting
          ? 'Finishing…'
          : selected.size > 0
          ? `Finish (${selected.size} selected)`
          : 'Finish'}
      </Button>

      <Button
        variant="text"
        fullWidth
        disabled={isSubmitting}
        onClick={onSkip}
        sx={{ color: 'text.secondary' }}
      >
        Skip for now
      </Button>
    </Box>
  )
}
