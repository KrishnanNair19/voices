/**
 * Step progress indicator for the Onboarding wizard (Steps 1–4).
 * Renders four dots; the active step's dot is filled with the brand teal.
 */

import { View, StyleSheet } from 'react-native'
import { colors, spacing } from '@/styles'

interface Props {
  /** 1-indexed current step (1 = Identity, 2 = Username, 3 = Profile, 4 = Interests) */
  currentStep: number
  totalSteps?: number
}

export function OnboardingProgressDots({ currentStep, totalSteps = 4 }: Props) {
  return (
    <View style={styles.row} accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isPast   = step < currentStep
        return (
          <View
            key={step}
            style={[styles.dot, isActive && styles.dotActive, isPast && styles.dotPast]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral200,
  },
  dotPast: {
    backgroundColor: colors.primaryLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
})
