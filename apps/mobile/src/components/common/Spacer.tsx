import { View } from 'react-native'
import { spacing } from '@/styles'
import type { SpacingToken } from '@voices/core'

export interface SpacerProps {
  /** Spacing token key — sets both width and height */
  size?: SpacingToken
  /** Set only horizontal space (sets width, height = 0) */
  horizontal?: SpacingToken
  /** Set only vertical space (sets height, width = 0) */
  vertical?: SpacingToken
  /** Fills remaining flex space */
  flex?: boolean
}

export function Spacer({ size, horizontal, vertical, flex }: SpacerProps) {
  if (flex) return <View style={{ flex: 1 }} />

  const width = horizontal ? spacing[horizontal] : size ? spacing[size] : 0
  const height = vertical ? spacing[vertical] : size ? spacing[size] : 0

  return <View style={{ width, height }} />
}
