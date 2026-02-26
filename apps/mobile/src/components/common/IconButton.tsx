import { StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, shadows } from '@/styles'
import { PressableScale } from './PressableScale'

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'
type IoniconName = React.ComponentProps<typeof Ionicons>['name']

export interface IconButtonProps {
  icon: IoniconName
  onPress?: () => void
  variant?: IconButtonVariant
  size?: IconButtonSize
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel: string
}

// ── Variant tokens ─────────────────────────────────────────────────────────────

interface VariantStyle {
  container: ViewStyle
  iconColor: string
}

const variantMap: Record<IconButtonVariant, VariantStyle> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.primarySm,
    },
    iconColor: colors.textOnPrimary,
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    iconColor: colors.textOnSecondary,
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    iconColor: colors.primary,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    iconColor: colors.primary,
  },
  danger: {
    container: { backgroundColor: colors.error },
    iconColor: colors.white,
  },
}

// ── Size tokens ────────────────────────────────────────────────────────────────

interface SizeStyle {
  containerSize: number
  iconSize: number
}

const sizeMap: Record<IconButtonSize, SizeStyle> = {
  sm: { containerSize: 32, iconSize: 16 },
  md: { containerSize: 40, iconSize: 20 },
  lg: { containerSize: 48, iconSize: 24 },
}

// ── Component ──────────────────────────────────────────────────────────────────

export function IconButton({
  icon,
  onPress,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const v = variantMap[variant]
  const s = sizeMap[size]

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleOnPress={0.9}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        v.container,
        { width: s.containerSize, height: s.containerSize },
        style,
      ]}
    >
      <Ionicons name={icon} size={s.iconSize} color={v.iconColor} />
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
})
