import { StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { colors, spacing, radius, shadows } from '@/styles'
import type { SpacingToken } from '@voices/core'
import { PressableScale } from './PressableScale'

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost'

export interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  /** Spacing token key applied as uniform padding */
  padding?: SpacingToken
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: colors.bgSurface,
    ...shadows.sm,
  },
  outlined: {
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderDefault,
  },
  filled: {
    backgroundColor: colors.bgSurfaceSunken,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
}: CardProps) {
  const content = [
    styles.base,
    variantStyles[variant],
    { padding: spacing[padding] },
    style,
  ] as StyleProp<ViewStyle>

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={content}>
        {children}
      </PressableScale>
    )
  }

  // Non-pressable — use View directly (avoids unnecessary Animated overhead)
  const { View } = require('react-native')
  return <View style={content}>{children}</View>
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
})
