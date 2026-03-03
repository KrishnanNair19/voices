import { useState, useEffect } from 'react'
import { View, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, Button, FormField } from '@/components/common'
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots'
import { colors, spacing, radius, typeScale } from '@/styles'
import { validateUsername } from '@/screens/Auth/validation'
import { useOnboardingController } from './useOnboardingController'
import type { OnboardingScreenProps } from '@/navigation/types'

export default function OnboardingUsernameScreen({
  navigation,
}: OnboardingScreenProps<'OnboardingUsername'>) {
  const {
    store,
    isSubmitting,
    error,
    usernameStatus,
    submitUsername,
    checkUsernameAvailable,
  } = useOnboardingController()

  const [username, setUsername] = useState(store.draft.username)
  const [touched, setTouched]   = useState(false)

  const validationError = touched ? validateUsername(username) : null
  const isChecking  = usernameStatus === 'checking'
  const isTaken     = usernameStatus === 'taken'
  const isAvailable = usernameStatus === 'available'

  // Check availability whenever the value changes (validation passes)
  useEffect(() => {
    if (!validationError) checkUsernameAvailable(username)
  }, [username, validationError, checkUsernameAvailable])

  const canSubmit =
    !validationError && isAvailable && !isChecking && username.length >= 3

  const handleNext = async () => {
    setTouched(true)
    if (!canSubmit) return
    await submitUsername(username)
    if (!error) navigation.navigate('OnboardingProfile')
  }

  // Normalise on change: lowercase + strip disallowed chars
  const handleChange = (text: string) => {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
  }

  // Inline status indicator shown inside the field row
  const StatusIcon = () => {
    if (isChecking)  return <ActivityIndicator size="small" color={colors.textTertiary} />
    if (isAvailable) return <Ionicons name="checkmark-circle" size={20} color={colors.success} />
    if (isTaken)     return <Ionicons name="close-circle"     size={20} color={colors.error}   />
    return null
  }

  const statusMessage =
    isAvailable ? 'Username is available' :
    isTaken     ? 'Username is already taken' :
    null

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <OnboardingProgressDots currentStep={2} />

          <View style={styles.content}>
            <Text variant="headingLarge" style={styles.title}>Choose a username</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Lowercase letters, numbers, and underscores only.
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
              </View>
            )}

            <FormField
              label="Username"
              errorText={validationError ?? (isTaken ? 'Username is already taken' : undefined)}
              helperText={isAvailable ? statusMessage ?? undefined : '3–20 characters'}
              required
            >
              <View style={styles.inputRow}>
                <View style={styles.prefix}>
                  <Text variant="bodyMedium" style={styles.prefixText}>@</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    (validationError || isTaken) && styles.inputError,
                    isAvailable && styles.inputSuccess,
                  ]}
                  value={username}
                  onChangeText={handleChange}
                  onBlur={() => setTouched(true)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  placeholder="yourhandle"
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel="Username"
                />
                <View style={styles.statusIcon}>
                  <StatusIcon />
                </View>
              </View>
            </FormField>
          </View>

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
  root:    { flex: 1, backgroundColor: colors.bgBase },
  flex:    { flex: 1 },
  inner:   { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
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
  inputRow:  { flexDirection: 'row', alignItems: 'center' },
  prefix: {
    height: 48,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurfaceSunken,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.borderDefault,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  prefixText: { color: colors.textSecondary },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.xl + spacing.sm, // room for status icon
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    ...typeScale.bodyMedium,
  },
  inputError:   { borderColor: colors.error },
  inputSuccess: { borderColor: colors.success },
  statusIcon: {
    position: 'absolute',
    right: spacing.sm,
    height: 48,
    justifyContent: 'center',
  },
  cta: { marginTop: 'auto' },
})
