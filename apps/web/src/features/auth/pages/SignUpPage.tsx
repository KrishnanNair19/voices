import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FilledInput from '@mui/material/FilledInput'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { tokens } from '@voices/core'
import { useSignUpController } from '../hooks/useAuthController'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function SignUpPage() {
  const { fieldErrors, serverError, isLoading, handleEmailSignUp, handleGoogleSignUp } =
    useSignUpController()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Navigation is handled inside the controller:
    //   email sign-up → /verify-email
    //   Google sign-up → useAuthRedirect (onboarding or home)
    await handleEmailSignUp(email, password, confirmPassword)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: `radial-gradient(ellipse at 50% 0%, ${tokens.color.primary}18 0%, transparent 60%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.primaryDark})`,
              boxShadow: `0 0 16px ${tokens.color.primary}55`,
            }}
          />
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
            Voices
          </Typography>
        </Box>

        <Typography variant="h4" fontWeight={700} mb={0.5}>
          Create account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Start sharing your stories with the world.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        {/* Google sign-up */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          sx={{
            mb: 2,
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'text.primary',
            '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            or
          </Typography>
        </Divider>

        {/* Email/password form */}
        <Box component="form" onSubmit={onSubmit} noValidate>
          <FormControl fullWidth variant="filled" sx={{ mb: 2 }} error={!!fieldErrors.email}>
            <InputLabel>Email</InputLabel>
            <FilledInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            {fieldErrors.email && <FormHelperText>{fieldErrors.email}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth variant="filled" sx={{ mb: 2 }} error={!!fieldErrors.password}>
            <InputLabel>Password</InputLabel>
            <FilledInput
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {fieldErrors.password && <FormHelperText>{fieldErrors.password}</FormHelperText>}
          </FormControl>

          <FormControl
            fullWidth
            variant="filled"
            sx={{ mb: 3 }}
            error={!!fieldErrors.confirmPassword}
          >
            <InputLabel>Confirm password</InputLabel>
            <FilledInput
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((v) => !v)}
                    edge="end"
                    size="small"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {fieldErrors.confirmPassword && (
              <FormHelperText>{fieldErrors.confirmPassword}</FormHelperText>
            )}
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mb: 2.5 }}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" underline="hover" color="primary">
            Sign in
          </Link>
        </Typography>

        <Typography
          variant="caption"
          color="text.disabled"
          textAlign="center"
          display="block"
          mt={2}
        >
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </Typography>
      </Box>
    </Box>
  )
}
