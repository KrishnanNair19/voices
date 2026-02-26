import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, typeScale, spacing } from '@/styles'
import type { ExploreScreenProps } from '@/navigation/types'

export default function CreatorProfileScreen({ route }: ExploreScreenProps<'CreatorProfile'>) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Creator</Text>
        <Text style={styles.subtitle}>Author: {route.params.authorId}</Text>
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
