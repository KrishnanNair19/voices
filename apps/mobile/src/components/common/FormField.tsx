import { View, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { colors, typeScale, spacing } from '@/styles'
import { Text } from './Text'

export interface FormFieldProps {
  label?: string
  helperText?: string
  errorText?: string
  required?: boolean
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function FormField({
  label,
  helperText,
  errorText,
  required = false,
  children,
  style,
}: FormFieldProps) {
  const hasError = Boolean(errorText)

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text variant="labelLarge" style={styles.label}>
            {label}
          </Text>
          {required && (
            <Text variant="labelLarge" style={styles.required}>
              {' *'}
            </Text>
          )}
        </View>
      )}

      {children}

      {hasError ? (
        <Text variant="captionSmall" style={styles.errorText}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="captionSmall" style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: colors.textPrimary,
  },
  required: {
    color: colors.error,
  },
  helperText: {
    color: colors.textTertiary,
  },
  errorText: {
    color: colors.error,
  },
})
