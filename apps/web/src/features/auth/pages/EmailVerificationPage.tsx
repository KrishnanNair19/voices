/**
 * Email verification pending page.
 *
 * Shown after email/password sign-up. The user must verify their email before
 * the auth listener advances them to the onboarding wizard.
 *
 * Polls Firebase every 5 seconds by calling recheckStatus() so the user doesn't
 * have to manually click "I've verified" — the app auto-advances on verification.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { useAuthStore, getFirebaseAuth, resendVerificationEmail } from '@voices/core'
import { tokens } from '@voices/core'

const POLL_INTERVAL_MS = 5_000

export default function EmailVerificationPage() {
  const navigate = useNavigate()
  const { user, status, recheckStatus } = useAuthStore()
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [resendLoading, setResendLoading] = useState(false)

  // Advance to onboarding once the user verifies their email
  useEffect(() => {
    if (status === 'onboarding' || status === 'authenticated') {
      navigate('/onboarding', { replace: true })
    }
  }, [status, navigate])

  // Poll Firebase auth state every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      recheckStatus().catch(() => {
        // Non-critical polling failure — ignore
      })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [recheckStatus])

  const handleResend = async () => {
    setResendLoading(true)
    setResendStatus('idle')
    try {
      const auth = getFirebaseAuth()
      await resendVerificationEmail(auth)
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    } finally {
      setResendLoading(false)
    }
  }

  const handleCheckNow = () => {
    recheckStatus().catch(() => {
      // ignore
    })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: `radial-gradient(ellipse at 50% 0%, ${tokens.color.primary}14 0%, transparent 60%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        {/* Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${tokens.color.primary}22, ${tokens.color.primary}44)`,
            border: `2px solid ${tokens.color.primary}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <MarkEmailReadOutlinedIcon sx={{ fontSize: 36, color: tokens.color.primary }} />
        </Box>

        <Typography variant="h4" fontWeight={700} mb={1}>
          Check your email
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={0.5}>
          We sent a verification link to
        </Typography>
        <Typography variant="body1" fontWeight={600} mb={3}>
          {user?.email ?? 'your email address'}
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={4}>
          Click the link in the email to verify your account. This page will automatically
          advance once your email is verified.
        </Typography>

        {resendStatus === 'sent' && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            Verification email sent. Check your inbox (and spam folder).
          </Alert>
        )}
        {resendStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            Failed to resend. Please try again in a moment.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleCheckNow}
          >
            I&apos;ve verified my email
          </Button>

          <Button
            variant="outlined"
            onClick={handleResend}
            disabled={resendLoading}
            sx={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'text.secondary',
              '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
            }}
          >
            {resendLoading ? 'Sending…' : 'Resend verification email'}
          </Button>

          <Button
            variant="text"
            size="small"
            color="inherit"
            sx={{ color: 'text.disabled' }}
            onClick={async () => {
              await getFirebaseAuth().signOut()
              navigate('/login', { replace: true })
            }}
          >
            Back to sign in
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
