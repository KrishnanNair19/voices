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

export interface RowProps {
  children: React.ReactNode
  gap?: SpacingToken
  align?: FlexAlignType
  justify?: JustifyContent
  wrap?: boolean
  flex?: number
  style?: StyleProp<ViewStyle>
}

export function Row({
  children,
  gap,
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  flex,
  style,
}: RowProps) {
  return (
    <View
      style={[
        styles.row,
        gap && { gap: spacing[gap] },
        { alignItems: align, justifyContent: justify },
        wrap && styles.wrap,
        flex !== undefined && { flex },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  wrap: { flexWrap: 'wrap' },
})
