import { View, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import { colors, spacing } from '@/styles'
import { Text } from './Text'
import type { SpacingToken } from '@voices/core'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  color?: string
  thickness?: number
  /** Adds margin on both sides of the divider */
  margin?: SpacingToken
  /** Text to display within the divider (horizontal only) */
  label?: string
  /** Custom style for the label text */
  labelStyle?: StyleProp<TextStyle>
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>
}

export function Divider({
  orientation = 'horizontal',
  color = colors.borderDefault,
  thickness = StyleSheet.hairlineWidth,
  margin,
  label,
  labelStyle,
  style,
}: DividerProps) {
  const isVertical = orientation === 'vertical'
  const marginValue = margin ? spacing[margin] : 0

  const lineStyle = [
    isVertical ? styles.verticalLine : styles.horizontalLine,
    { backgroundColor: color },
    isVertical ? { width: thickness } : { height: thickness },
  ]

  // Vertical dividers usually don't support labels well in standard UI kits,
  // so we'll stick to the original logic for vertical.
  if (isVertical) {
    return (
      <View
        style={[
          lineStyle,
          { marginHorizontal: marginValue },
          style,
        ]}
      />
    )
  }

  return (
    <View 
      style={[
        styles.horizontalContainer, 
        { marginVertical: marginValue }, 
        style
      ]}
    >
      <View style={[lineStyle, styles.flex]} />
      
      {label && (
        <Text variant="captionMedium" style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      {label && <View style={[lineStyle, styles.flex]} />}
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  horizontalLine: {
    // Height is handled by props
  },
  verticalLine: {
    alignSelf: 'stretch',
  },
  flex: {
    flex: 1,
  },
  label: {
    paddingHorizontal: spacing.sm, // Or your preferred token
    color: colors.textSecondary
  },
})