import { useState } from 'react'
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, Button } from '@/components/common'
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots'
import { colors, spacing, radius, typeScale } from '@/styles'
import { useOnboardingController } from './useOnboardingController'
import type { OnboardingScreenProps } from '@/navigation/types'

const BIO_LIMIT = 160

export default function OnboardingProfileScreen({
  navigation,
}: OnboardingScreenProps<'OnboardingProfile'>) {
  const { store, user, isSubmitting, error, submitProfile, skipProfile } =
    useOnboardingController()

  const [bio, setBio] = useState(store.draft.bio)
  const [useGooglePhoto, setUseGooglePhoto] = useState(false)

  const googlePhotoUrl = user?.photoURL ?? null
  const hasGooglePhoto = googlePhotoUrl !== null

  const handleNext = async () => {
    const photoUrl = useGooglePhoto ? googlePhotoUrl : null
    await submitProfile(bio, photoUrl)
    if (!error) navigation.navigate('OnboardingInterests')
  }

  const handleSkip = async () => {
    await skipProfile()
    if (!error) navigation.navigate('OnboardingInterests')
  }

  const charsLeft = BIO_LIMIT - bio.length

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <OnboardingProgressDots currentStep={3} />

          <View style={styles.content}>
            <Text variant="headingLarge" style={styles.title}>Set up your profile</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Add a photo and bio so listeners know who you are.
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text variant="captionMedium" style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Avatar section */}
            {hasGooglePhoto && (
              <View style={styles.avatarSection}>
                <Image
                  source={{ uri: googlePhotoUrl }}
                  style={[styles.avatar, useGooglePhoto && styles.avatarSelected]}
                />
                <View style={styles.avatarToggle}>
                  <Text variant="bodyMedium" style={styles.avatarLabel}>
                    Use Google photo
                  </Text>
                  <Button
                    label={useGooglePhoto ? 'Selected' : 'Use this'}
                    variant={useGooglePhoto ? 'primary' : 'outline'}
                    size="sm"
                    leftIcon={useGooglePhoto ? 'checkmark-circle' : undefined}
                    onPress={() => setUseGooglePhoto((v) => !v)}
                  />
                </View>
              </View>
            )}

            {/* Bio input */}
            <View>
              <View style={styles.bioLabelRow}>
                <Text variant="labelMedium" style={styles.bioLabel}>Bio</Text>
                <Text
                  variant="captionMedium"
                  style={[styles.charCount, charsLeft < 20 && styles.charCountWarn]}
                >
                  {charsLeft}
                </Text>
              </View>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={(text) => setBio(text.slice(0, BIO_LIMIT))}
                multiline
                numberOfLines={4}
                placeholder="Tell listeners a little about yourself…"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="default"
                accessibilityLabel="Bio"
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Next"
              variant="primary"
              size="lg"
              fullWidth
              rightIcon="arrow-forward"
              loading={isSubmitting}
              onPress={handleNext}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bgBase },
  flex:    { flex: 1 },
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

  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.borderDefault,
  },
  avatarSelected: {
    borderColor: colors.primary,
  },
  avatarToggle: {
    flex: 1,
    gap: spacing.xs,
  },
  avatarLabel: {
    color: colors.textPrimary,
  },

  // Bio
  bioLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bioLabel: { color: colors.textPrimary },
  charCount: { color: colors.textTertiary },
  charCountWarn: { color: colors.warning },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    ...typeScale.bodyMedium,
    height: 112,
    textAlignVertical: 'top',
  },

  // Actions
  actions: { gap: spacing.xs },
  skipBtn: { marginTop: -spacing.xs },
})
