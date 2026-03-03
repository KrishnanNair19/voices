import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, Button } from '@/components/common'
import { colors, spacing } from '@/styles'
import { useAuthController } from './useAuthController'
import type { AuthScreenProps } from '@/navigation/types'

export default function EmailVerificationPendingScreen({
  route,
}: AuthScreenProps<'EmailVerificationPending'>) {
  const { email } = route.params
  const {
    error,
    resendCooldown,
    handleResendVerification,
    startVerificationPolling,
    stopVerificationPolling,
  } = useAuthController()

  // Start polling as soon as the screen mounts; stop on unmount.
  // When recheckStatus() detects emailVerified == true it sets status →
  // 'onboarding', which causes RootNavigator to swap to OnboardingStack.
  useEffect(() => {
    const cleanup = startVerificationPolling()
    return () => {
      stopVerificationPolling()
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.inner}>
        <View style={styles.icon}>
          <Ionicons name="mail-outline" size={56} color={colors.primary} />
        </View>

        <Text variant="headingLarge" style={styles.title}>Check your email</Text>
        <Text variant="bodyMedium" style={styles.body}>
          We sent a verification link to{' '}
          <Text variant="bodyMedium" style={styles.email}>{email}</Text>
          {'. Tap the link to continue — this screen will advance automatically.'}
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label={
            resendCooldown > 0
              ? `Resend email (${resendCooldown}s)`
              : 'Resend email'
          }
          variant="outline"
          size="md"
          fullWidth
          disabled={resendCooldown > 0}
          onPress={handleResendVerification}
          style={styles.resendBtn}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: colors.bgBase },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  icon:  { marginBottom: spacing.sm },
  title: { color: colors.textPrimary, textAlign: 'center' },
  body:  { color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  email: { color: colors.textPrimary, fontWeight: '600' },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    width: '100%',
  },
  errorText: { color: colors.error, textAlign: 'center' },
  resendBtn: { marginTop: spacing.sm },
})
