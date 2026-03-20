import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import { tokens } from '@voices/core'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface UsernameStepProps {
  initialValue: string
  usernameStatus: UsernameStatus
  isSubmitting: boolean
  error: string | null
  onCheck: (username: string) => void
  onSubmit: (username: string) => Promise<boolean>
}

function StatusAdornment({ status }: { status: UsernameStatus }) {
  if (status === 'checking') return <CircularProgress size={16} />
  if (status === 'available') return <CheckCircleOutlineIcon sx={{ color: 'success.main' }} fontSize="small" />
  if (status === 'taken') return <HighlightOffIcon sx={{ color: 'error.main' }} fontSize="small" />
  return null
}

function helperText(status: UsernameStatus, value: string): { text: string; color?: string } {
  if (!value) return { text: '3–20 characters, letters, numbers and underscores only.' }
  if (status === 'invalid') return { text: 'Only letters, numbers, and underscores. Min 3 characters.', color: 'error.main' }
  if (status === 'checking') return { text: 'Checking availability…' }
  if (status === 'available') return { text: 'This username is available!', color: 'success.main' }
  if (status === 'taken') return { text: 'This username is already taken.', color: 'error.main' }
  return { text: '3–20 characters, letters, numbers and underscores only.' }
}

export default function UsernameStep({
  initialValue,
  usernameStatus,
  isSubmitting,
  error,
  onCheck,
  onSubmit,
}: UsernameStepProps) {
  const [username, setUsername] = useState(initialValue)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(val)
    onCheck(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus !== 'available') return
    await onSubmit(username)
  }

  const helper = helperText(usernameStatus, username)

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Choose a username
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Your unique handle on Voices. You can change it later.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl
        fullWidth
        variant="filled"
        error={usernameStatus === 'taken' || usernameStatus === 'invalid'}
        sx={{ mb: 3 }}
      >
        <InputLabel>Username</InputLabel>
        <FilledInput
          value={username}
          onChange={handleChange}
          inputProps={{ maxLength: 20 }}
          autoFocus
          startAdornment={
            <InputAdornment position="start">
              <Typography variant="body2" color="text.secondary" sx={{ mt: '18px' }}>
                @
              </Typography>
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end" sx={{ mr: 1 }}>
              <StatusAdornment status={usernameStatus} />
            </InputAdornment>
          }
        />
        <FormHelperText sx={{ color: helper.color ?? undefined }}>
          {helper.text}
        </FormHelperText>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isSubmitting || usernameStatus !== 'available'}
        sx={{
          ...(usernameStatus === 'available' && {
            boxShadow: `0 0 16px ${tokens.color.primary}44`,
          }),
        }}
      >
        {isSubmitting ? 'Saving…' : 'Continue'}
      </Button>
    </Box>
  )
}
