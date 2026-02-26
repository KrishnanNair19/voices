import { ScrollView, KeyboardAvoidingView, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Edge } from 'react-native-safe-area-context'
import { colors, spacing } from '@/styles'

export interface ScreenProps {
  children: React.ReactNode
  /** Defaults to all 4 edges */
  edges?: Edge[]
  backgroundColor?: string
  /** Wraps children in a ScrollView */
  scrollable?: boolean
  /** Adds horizontal + vertical padding inside the screen */
  padded?: boolean
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
}

export function Screen({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor = colors.bgBase,
  scrollable = false,
  padded = false,
  style,
  contentStyle,
}: ScreenProps) {
  const inner = scrollable ? (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[padded && styles.padded, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    children
  )

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor }, style]}
      edges={edges}
    >
      {inner}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
})
