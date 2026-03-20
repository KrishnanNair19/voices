/**
 * Onboarding wizard page.
 *
 * Renders the correct step component based on onboardingStore.currentStep.
 * Step data is persisted to Firestore on each advance so the wizard is
 * resumable across devices and browser sessions.
 *
 * Step map:
 *   0 — Welcome
 *   1 — Display Name (required)
 *   2 — Username (required)
 *   3 — Profile / Bio (skippable)
 *   4 — Interests (skippable) → sets onboardingCompleted: true → redirects to /
 */

import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { tokens, ONBOARDING_TOTAL_STEPS } from '@voices/core'
import { useOnboardingController } from '../hooks/useOnboardingController'
import WelcomeStep from '../components/WelcomeStep'
import DisplayNameStep from '../components/DisplayNameStep'
import UsernameStep from '../components/UsernameStep'
import ProfileStep from '../components/ProfileStep'
import InterestsStep from '../components/InterestsStep'

export default function OnboardingPage() {
  const ctrl = useOnboardingController()
  const { store, user, isSubmitting, error, usernameStatus } = ctrl

  const step = store.currentStep
  const draft = store.draft

  // Progress: step 0 = 0%, step 4 = 100%
  const progress = Math.round((step / ONBOARDING_TOTAL_STEPS) * 100)

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <WelcomeStep
            displayName={user?.displayName ?? null}
            onNext={store.nextStep}
          />
        )
      case 1:
        return (
          <DisplayNameStep
            initialValue={draft.displayName || (user?.displayName ?? '')}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={ctrl.submitDisplayName}
          />
        )
      case 2:
        return (
          <UsernameStep
            initialValue={draft.username}
            usernameStatus={usernameStatus}
            isSubmitting={isSubmitting}
            error={error}
            onCheck={ctrl.checkUsernameAvailable}
            onSubmit={ctrl.submitUsername}
          />
        )
      case 3:
        return (
          <ProfileStep
            displayName={draft.displayName || (user?.displayName ?? 'You')}
            googlePhotoURL={user?.photoURL ?? null}
            initialBio={draft.bio}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={ctrl.submitProfile}
            onSkip={ctrl.skipProfile}
          />
        )
      case 4:
        return (
          <InterestsStep
            initialTags={draft.preferredTags}
            isSubmitting={isSubmitting}
            error={error}
            onFinish={ctrl.finishOnboarding}
            onSkip={ctrl.skipInterests}
          />
        )
      default:
        return null
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: `radial-gradient(ellipse at 50% 0%, ${tokens.color.primary}14 0%, transparent 55%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 460 }}>
        {/* Progress bar (hidden on welcome step) */}
        {step > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary">
                Step {step} of {ONBOARDING_TOTAL_STEPS}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: tokens.color.primary,
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        )}

        {/* Active step */}
        {renderStep()}
      </Box>
    </Box>
  )
}
