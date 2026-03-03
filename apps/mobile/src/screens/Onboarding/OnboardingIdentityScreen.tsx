import { useState } from 'react'
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, Button, FormField } from '@/components/common'
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots'
import { colors, spacing, radius, typeScale } from '@/styles'
import { validateDisplayName } from '@/screens/Auth/validation'
import { useOnboardingController } from './useOnboardingController'
import type { OnboardingScreenProps } from '@/navigation/types'

export default function OnboardingIdentityScreen({
  navigation,
}: OnboardingScreenProps<'OnboardingIdentity'>) {
  const { store, user, isSubmitting, error, submitDisplayName } = useOnboardingController()

  // Pre-fill with Firebase Auth displayName (populated for Google users)
  const [name, setName] = useState(user?.displayName ?? store.draft.displayName)
  const [touched, setTouched] = useState(false)

  const fieldError = touched ? validateDisplayName(name) : null
  const canSubmit  = !fieldError && name.trim().length >= 2

  const handleNext = async () => {
    setTouched(true)
    if (!canSubmit) return
    await submitDisplayName(name)
    if (!error) navigation.navigate('OnboardingUsername')
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          {/* Progress */}
          <OnboardingProgressDots currentStep={1} />

          {/* Content */}
          <View style={styles.content}>
            <Text variant="headingLarge" style={styles.title}>What's your name?</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              This is how you'll appear to other listeners.
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
              </View>
            )}

            <FormField
              label="Display name"
              errorText={fieldError ?? undefined}
              helperText="2–50 characters"
              required
            >
              <TextInput
                style={[styles.input, fieldError && styles.inputError]}
                value={name}
                onChangeText={setName}
                onBlur={() => setTouched(true)}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="done"
                onSubmitEditing={handleNext}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Display name"
              />
            </FormField>
          </View>

          {/* CTA */}
          <Button
            label="Next"
            variant="primary"
            size="lg"
            fullWidth
            rightIcon="arrow-forward"
            loading={isSubmitting}
            disabled={!canSubmit}
            onPress={handleNext}
            style={styles.cta}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bgBase },
  flex:   { flex: 1 },
  inner:  { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  content: { flex: 1, justifyContent: 'center', gap: spacing.md },
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
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    ...typeScale.bodyMedium,
  },
  inputError: { borderColor: colors.error },
  cta: { marginTop: 'auto' },
})
