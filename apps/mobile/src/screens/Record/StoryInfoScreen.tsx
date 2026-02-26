import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, typeScale, spacing } from '@/styles'
import type { RecordScreenProps } from '@/navigation/types'

export default function StoryInfoScreen(_: RecordScreenProps<'StoryInfo'>) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Story Details</Text>
        <Text style={styles.subtitle}>Add title, tags, and cover photo — coming soon</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typeScale.headingLarge, color: colors.textPrimary },
  subtitle: { ...typeScale.bodyMedium, color: colors.textSecondary, marginTop: spacing.xs },
})
