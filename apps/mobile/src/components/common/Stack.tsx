import { View, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, FlexAlignType } from 'react-native'
import { spacing } from '@/styles'
import type { SpacingToken } from '@voices/core'

type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'

export interface StackProps {
  children: React.ReactNode
  gap?: SpacingToken
  align?: FlexAlignType
  justify?: JustifyContent
  flex?: number
  style?: StyleProp<ViewStyle>
}

export function Stack({
  children,
  gap,
  align = 'stretch',
  justify = 'flex-start',
  flex,
  style,
}: StackProps) {
  return (
    <View
      style={[
        styles.stack,
        gap && { gap: spacing[gap] },
        { alignItems: align, justifyContent: justify },
        flex !== undefined && { flex },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column' },
})
