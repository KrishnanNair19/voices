import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, Button } from '@/components/common'
import { colors, spacing } from '@/styles'
import type { OnboardingScreenProps } from '@/navigation/types'

export default function OnboardingWelcomeScreen({
  navigation,
}: OnboardingScreenProps<'OnboardingWelcome'>) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [opacity, translateY])

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View style={[styles.hero, { opacity, transform: [{ translateY }] }]}>
        <Text variant="displayLarge" style={styles.wordmark}>Voices</Text>
        <Text variant="bodyLarge" style={styles.tagline}>
          Let's build your profile.
        </Text>
      </Animated.View>

      <View style={styles.actions}>
        <Button
          label="Let's get started"
          variant="primary"
          size="lg"
          fullWidth
          rightIcon="arrow-forward"
          onPress={() => navigation.navigate('OnboardingIdentity')}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  wordmark: { color: colors.textPrimary, fontWeight: '700' },
  tagline:  { color: colors.textSecondary },
  actions:  { paddingBottom: spacing.xl },
})
