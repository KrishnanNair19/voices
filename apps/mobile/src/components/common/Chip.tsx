import { StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, typeScale, spacing, radius } from '@/styles'
import { Text } from './Text'
import { PressableScale } from './PressableScale'

export type ChipVariant = 'filled' | 'outlined' | 'tinted'

export interface ChipProps {
  label: string
  variant?: ChipVariant
  selected?: boolean
  onPress?: () => void
  onDismiss?: () => void
  leftIcon?: React.ComponentProps<typeof Ionicons>['name']
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
}

// ── Variant tokens ─────────────────────────────────────────────────────────────

interface VariantStyle {
  container: ViewStyle
  selectedContainer: ViewStyle
  label: TextStyle
  selectedLabel: TextStyle
  iconColor: string
  selectedIconColor: string
}

const variantMap: Record<ChipVariant, VariantStyle> = {
  filled: {
    container: { backgroundColor: colors.neutral100 },
    selectedContainer: { backgroundColor: colors.primary },
    label: { color: colors.textPrimary },
    selectedLabel: { color: colors.textOnPrimary },
    iconColor: colors.textSecondary,
    selectedIconColor: colors.textOnPrimary,
  },
  outlined: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.borderDefault,
    },
    selectedContainer: {
      backgroundColor: colors.transparent,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    label: { color: colors.textPrimary },
    selectedLabel: { color: colors.primary },
    iconColor: colors.textSecondary,
    selectedIconColor: colors.primary,
  },
  tinted: {
    container: { backgroundColor: colors.primaryLight },
    selectedContainer: { backgroundColor: colors.primary },
    label: { color: colors.primaryDark },
    selectedLabel: { color: colors.textOnPrimary },
    iconColor: colors.primaryDark,
    selectedIconColor: colors.textOnPrimary,
  },
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Chip({
  label,
  variant = 'filled',
  selected = false,
  onPress,
  onDismiss,
  leftIcon,
  disabled = false,
  style,
  labelStyle,
}: ChipProps) {
  const v = variantMap[variant]
  const containerStyle = selected ? v.selectedContainer : v.container
  const textStyle = selected ? v.selectedLabel : v.label
  const iconColor = selected ? v.selectedIconColor : v.iconColor

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || !onPress}
      scaleOnPress={0.95}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.base, containerStyle, style]}
    >
      {leftIcon && (
        <Ionicons name={leftIcon} size={14} color={iconColor} style={styles.leftIcon} />
      )}
      <Text variant="labelMedium" style={[textStyle, labelStyle]}>
        {label}
      </Text>
      {onDismiss && (
        <PressableScale
          onPress={onDismiss}
          disabled={disabled}
          scaleOnPress={0.85}
          accessibilityLabel={`Remove ${label}`}
          style={styles.dismissButton}
        >
          <Ionicons name="close" size={12} color={iconColor} />
        </PressableScale>
      )}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  leftIcon: {
    marginRight: -2,
  },
  dismissButton: {
    marginLeft: -2,
    padding: 2,
  },
})
