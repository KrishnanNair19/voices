import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

interface DisplayNameStepProps {
  initialValue: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (displayName: string) => Promise<boolean>
}

export default function DisplayNameStep({
  initialValue,
  isSubmitting,
  error,
  onSubmit,
}: DisplayNameStepProps) {
  const [displayName, setDisplayName] = useState(initialValue)
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) {
      setFieldError('Display name is required.')
      return
    }
    if (trimmed.length < 2) {
      setFieldError('Must be at least 2 characters.')
      return
    }
    if (trimmed.length > 50) {
      setFieldError('Must be 50 characters or fewer.')
      return
    }
    setFieldError('')
    await onSubmit(trimmed)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        What should we call you?
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        This is the name other users will see on your profile and stories.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth variant="filled" error={!!fieldError} sx={{ mb: 3 }}>
        <InputLabel>Display name</InputLabel>
        <FilledInput
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          inputProps={{ maxLength: 50 }}
          autoFocus
        />
        <FormHelperText>
          {fieldError || `${displayName.length}/50`}
        </FormHelperText>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving…' : 'Continue'}
      </Button>
    </Box>
  )
}
