import { View, StyleSheet } from 'react-native'
import { Screen, Text, Button, Divider } from '@/components/common'
import { colors, spacing } from '@/styles'
import { useAuthController } from './useAuthController'
import type { AuthScreenProps } from '@/navigation/types'
import { GoogleSigninButton } from '@react-native-google-signin/google-signin'

export default function LandingScreen({ navigation }: AuthScreenProps<'Landing'>) {
  const { isLoading, error, handleGoogleSignIn } = useAuthController()

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text variant="displayLarge" style={styles.wordmark}>Voices</Text>
        <Text variant="bodyLarge" style={styles.tagline}>
          Stories from everywhere.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {error && (
          <View style={styles.errorBanner}>
            <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label="Continue with Google"
          variant="primary"
          size="lg"
          fullWidth
          leftIcon="logo-google"
          loading={isLoading}
          onPress={handleGoogleSignIn}
          accessibilityLabel="Sign in with Google"
        />

        <Divider label="or" style={styles.divider} />

        <Button
          label="Sign up with email"
          variant="outline"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('EmailSignUp')}
          disabled={isLoading}
        />

        <Button
          label="Log in"
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => navigation.navigate('EmailLogin')}
          disabled={isLoading}
          style={styles.loginBtn}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  wordmark: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tagline: {
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  loginBtn: {
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
})
