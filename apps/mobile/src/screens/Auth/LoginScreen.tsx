import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
// Now using your custom barrel exports
import { Button, Text } from '@/components/common' 
import { spacing } from '@/styles'

interface LoginScreenProps {
  onAuthSuccess: () => void
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        {/* Using your 'variant' system instead of manual styles */}
        <Text variant="displayMedium" style={styles.wordmark}>
          Voices
        </Text>
        <Text variant="bodyLarge" style={styles.tagline}>
          Stories from everywhere.
        </Text>
      </View>

      <View style={styles.actions}>
        {/* Swapped TouchableOpacity for your Button component */}
        <Button 
          label="Get started" 
          variant="primary" 
          size="lg" 
          fullWidth 
          onPress={onAuthSuccess} 
        />
        
        <Button 
          label="I already have an account" 
          variant="ghost" 
          size="md" 
          fullWidth 
          onPress={onAuthSuccess} 
          style={styles.ghostMargin}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  tagline: {
    opacity: 0.7,
  },
  actions: {
    gap: spacing.sm, // Using gap instead of manual margins where possible
    paddingBottom: spacing.lg,
  },
  ghostMargin: {
    marginTop: spacing.xs,
  }
})