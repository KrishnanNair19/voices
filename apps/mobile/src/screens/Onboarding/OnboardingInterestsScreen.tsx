import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, Button, Chip } from '@/components/common'
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots'
import { colors, spacing, radius } from '@/styles'
import { useOnboardingController } from './useOnboardingController'
import type { OnboardingScreenProps } from '@/navigation/types'

// ── Interest tags ─────────────────────────────────────────────────────────────

const INTEREST_TAGS = [
  { id: 'music',      label: 'Music' },
  { id: 'stories',    label: 'Stories' },
  { id: 'history',    label: 'History' },
  { id: 'comedy',     label: 'Comedy' },
  { id: 'nature',     label: 'Nature' },
  { id: 'urban',      label: 'Urban' },
  { id: 'food',       label: 'Food' },
  { id: 'travel',     label: 'Travel' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'news',       label: 'News' },
  { id: 'sports',     label: 'Sports' },
  { id: 'arts',       label: 'Arts' },
]

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OnboardingInterestsScreen({
  // navigation is not used — finishOnboarding advances the navigator via the auth store
}: OnboardingScreenProps<'OnboardingInterests'>) {
  const { isSubmitting, error, finishOnboarding, skipInterests } =
    useOnboardingController()

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleDone = () => finishOnboarding([...selected])
  const handleSkip = () => skipInterests()

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.inner}>
        <OnboardingProgressDots currentStep={4} />

        <View style={styles.content}>
          <Text variant="headingLarge" style={styles.title}>What do you love?</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Pick a few topics and we'll surface voices you'll enjoy.
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.chipGrid}>
            {INTEREST_TAGS.map(({ id, label }) => (
              <Chip
                key={id}
                label={label}
                variant="outlined"
                selected={selected.has(id)}
                onPress={() => toggle(id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={selected.size > 0 ? `Done (${selected.size} selected)` : 'Done'}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleDone}
          />
          <Button
            label="Skip for now"
            variant="ghost"
            size="md"
            fullWidth
            disabled={isSubmitting}
            onPress={handleSkip}
            style={styles.skipBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bgBase },
  inner:   { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  content: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  title:   { color: colors.textPrimary, marginTop: spacing.xl },
  subtitle: { color: colors.textSecondary },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: { color: colors.error },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions:  { gap: spacing.xs },
  skipBtn:  { marginTop: -spacing.xs },
})
