import { useState, useEffect, useRef } from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, Button, FormField } from '@/components/common'
import { colors, spacing, radius, typeScale } from '@/styles'
import { validateEmail } from './validation'
import { useAuthController } from './useAuthController'
import type { AuthScreenProps } from '@/navigation/types'

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { isLoading, error, clearError, handlePasswordReset } = useAuthController()

  const [email, setEmail]       = useState('')
  const [touched, setTouched]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess]   = useState(false)

  const emailError = (touched || submitted) ? validateEmail(email) : null

  // Auto-navigate back 3 seconds after success
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (success) {
      timerRef.current = setTimeout(() => navigation.goBack(), 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [success, navigation])

  const handleSubmit = async () => {
    setSubmitted(true)
    clearError()
    if (emailError) return
    const ok = await handlePasswordReset(email.trim())
    if (ok) setSuccess(true)
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text variant="headingLarge" style={styles.title}>Reset password</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            We'll send a reset link to your email.
          </Text>
        </View>

        {success ? (
          /* Success state */
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text variant="bodyMedium" style={styles.successText}>
              Check your email for a reset link. Taking you back…
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <View style={styles.errorBanner}>
                <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
              </View>
            )}

            <FormField label="Email" errorText={emailError ?? undefined} required style={styles.field}>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                value={email}
                onChangeText={(v) => { setEmail(v); clearError() }}
                onBlur={() => setTouched(true)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="done"
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Email address"
              />
            </FormField>

            <Button
              label="Send reset link"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSubmit}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bgBase },
  inner: { flex: 1, paddingHorizontal: spacing.xl },
  header: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  backBtn:  { marginBottom: spacing.sm, alignSelf: 'flex-start' },
  title:    { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary },
  field:    { marginBottom: spacing.xl },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: { color: colors.error, textAlign: 'center' },
  successBanner: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  successText: { color: colors.success, textAlign: 'center' },
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
})
