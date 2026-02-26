import { View, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { colors, spacing } from '@/styles'
import type { SpacingToken } from '@voices/core'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  color?: string
  thickness?: number
  /** Adds margin on both sides of the divider */
  margin?: SpacingToken
  style?: StyleProp<ViewStyle>
}

export function Divider({
  orientation = 'horizontal',
  color = colors.borderDefault,
  thickness = StyleSheet.hairlineWidth,
  margin,
  style,
}: DividerProps) {
  const isVertical = orientation === 'vertical'
  return (
    <View
      style={[
        isVertical ? styles.vertical : styles.horizontal,
        isVertical
          ? { width: thickness, marginHorizontal: margin ? spacing[margin] : 0 }
          : { height: thickness, marginVertical: margin ? spacing[margin] : 0 },
        { backgroundColor: color },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  horizontal: { width: '100%' },
  vertical: { alignSelf: 'stretch' },
})
