import { ActivityIndicator, StyleSheet, View } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, typeScale, spacing, radius, shadows } from '@/styles'
import { Text } from './Text'
import { PressableScale } from './PressableScale'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
type IoniconName = React.ComponentProps<typeof Ionicons>['name']

export interface ButtonProps {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  leftIcon?: IoniconName
  rightIcon?: IoniconName
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  accessibilityLabel?: string
}

// ── Variant tokens ────────────────────────────────────────────────────────────

interface VariantStyle {
  container: ViewStyle
  label: TextStyle
  iconColor: string
  indicator: string
}

const variantMap: Record<ButtonVariant, VariantStyle> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.primarySm,
    },
    label: { color: colors.textOnPrimary },
    iconColor: colors.textOnPrimary,
    indicator: colors.textOnPrimary,
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    label: { color: colors.textOnSecondary },
    iconColor: colors.textOnSecondary,
    indicator: colors.textOnSecondary,
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    label: { color: colors.primary },
    iconColor: colors.primary,
    indicator: colors.primary,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    label: { color: colors.primary },
    iconColor: colors.primary,
    indicator: colors.primary,
  },
  danger: {
    container: { backgroundColor: colors.error },
    label: { color: colors.white },
    iconColor: colors.white,
    indicator: colors.white,
  },
  link: {
    container: { backgroundColor: colors.transparent, paddingHorizontal: 0 },
    label: { color: colors.textLink, textDecorationLine: 'underline' },
    iconColor: colors.textLink,
    indicator: colors.textLink,
  },
}

// ── Size tokens ───────────────────────────────────────────────────────────────

interface SizeStyle {
  container: ViewStyle
  labelVariant: keyof typeof typeScale
  iconSize: number
}

const sizeMap: Record<ButtonSize, SizeStyle> = {
  sm: {
    container: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill },
    labelVariant: 'labelMedium',
    iconSize: 14,
  },
  md: {
    container: { height: 44, paddingHorizontal: spacing.lg, borderRadius: radius.pill },
    labelVariant: 'labelLarge',
    iconSize: 16,
  },
  lg: {
    container: { height: 52, paddingHorizontal: spacing.xl, borderRadius: radius.pill },
    labelVariant: 'labelLarge',
    iconSize: 18,
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  labelStyle,
  accessibilityLabel,
}: ButtonProps) {
  const v = variantMap[variant]
  const s = sizeMap[size]

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      scaleOnPress={0.97}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.indicator} />
      ) : (
        <View style={styles.inner}>
          {leftIcon && (
            <Ionicons name={leftIcon} size={s.iconSize} color={v.iconColor} />
          )}
          <Text
            variant={s.labelVariant}
            style={[v.label, labelStyle]}
          >
            {label}
          </Text>
          {rightIcon && (
            <Ionicons name={rightIcon} size={s.iconSize} color={v.iconColor} />
          )}
        </View>
      )}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
})
