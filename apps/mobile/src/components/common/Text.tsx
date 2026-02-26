import { Text as RNText, StyleSheet } from 'react-native'
import type { TextProps as RNTextProps, StyleProp, TextStyle } from 'react-native'
import { colors, typeScale } from '@/styles'
import type { TypeScaleKey } from '@/styles/typography'

export interface TextProps extends RNTextProps {
  /** Maps to one of the 20 typeScale roles from typography.ts */
  variant?: TypeScaleKey
  /** Any key from the semantic color palette, or a raw hex/rgba string */
  color?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  /** Override on top of all variant + color styles */
  style?: StyleProp<TextStyle>
}

export function Text({
  variant = 'bodyMedium',
  color = colors.textPrimary,
  align,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[
        typeScale[variant],
        { color },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    />
  )
}
