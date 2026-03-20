import { useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { tokens } from '@voices/core'

interface ProfileStepProps {
  displayName: string
  googlePhotoURL: string | null
  initialBio: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (bio: string, profileImageUrl: string | null) => Promise<boolean>
  onSkip: () => Promise<boolean>
}

export default function ProfileStep({
  displayName,
  googlePhotoURL,
  initialBio,
  isSubmitting,
  error,
  onSubmit,
  onSkip,
}: ProfileStepProps) {
  const [bio, setBio] = useState(initialBio)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(bio, googlePhotoURL)
  }

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Set up your profile
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Add a short bio. You can always update this later.
      </Typography>

      {/* Avatar preview */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Avatar
          src={googlePhotoURL ?? undefined}
          sx={{
            width: 80,
            height: 80,
            bgcolor: tokens.color.primaryDark,
            fontSize: '1.5rem',
            border: `3px solid ${tokens.color.primary}44`,
          }}
        >
          {initials}
        </Avatar>
      </Box>

      {googlePhotoURL && (
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={3}>
          Using your Google profile photo
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth variant="filled" sx={{ mb: 3 }}>
        <InputLabel>Bio (optional)</InputLabel>
        <FilledInput
          multiline
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          inputProps={{ maxLength: 160 }}
          autoFocus
        />
        <FormHelperText sx={{ textAlign: 'right' }}>{bio.length}/160</FormHelperText>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isSubmitting}
        sx={{ mb: 1.5 }}
      >
        {isSubmitting ? 'Saving…' : 'Continue'}
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
