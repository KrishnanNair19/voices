import { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, Button, FormField } from '@/components/common'
import { colors, spacing, radius, typeScale } from '@/styles'
import { validateEmail } from './validation'
import { useAuthController } from './useAuthController'
import type { AuthScreenProps } from '@/navigation/types'

export default function EmailLoginScreen({ navigation }: AuthScreenProps<'EmailLogin'>) {
  const { isLoading, error, clearError, handleEmailSignIn } = useAuthController()

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched]       = useState({ email: false })
  const [submitted, setSubmitted]   = useState(false)

  const emailError = (touched.email || submitted) ? validateEmail(email) : null

  const handleSubmit = async () => {
    setSubmitted(true)
    clearError()
    if (emailError || !password) return
    await handleEmailSignIn(email.trim(), password)
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text variant="headingLarge" style={styles.title}>Welcome back</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in to continue.
            </Text>
          </View>

          {/* Firebase error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <FormField label="Email" errorText={emailError ?? undefined} required>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                value={email}
                onChangeText={(v) => { setEmail(v); clearError() }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Email address"
              />
            </FormField>

            <FormField label="Password" required>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError() }}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  returnKeyType="done"
                  placeholder="Your password"
                  placeholderTextColor={colors.textTertiary}
                  onSubmitEditing={handleSubmit}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </FormField>

            <Button
              label="Forgot password?"
              variant="link"
              size="sm"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            />
          </View>

          <Button
            label="Log in"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bgBase },
  flex:   { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  header: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs },
  backBtn: { marginBottom: spacing.sm, alignSelf: 'flex-start' },
  title:   { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: { color: colors.error, textAlign: 'center' },
  form: { gap: spacing.md, marginBottom: spacing.xl },
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
  inputFlex:  { flex: 1 },
  inputError: { borderColor: colors.error },
  inputRow:   { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: {
    position: 'absolute',
    right: spacing.sm,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  forgotBtn: { alignSelf: 'flex-end' },
})
