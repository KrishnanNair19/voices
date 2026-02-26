import { Pressable } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const SPRING_CONFIG = { mass: 0.4, stiffness: 300, damping: 20 }

export interface PressableScaleProps {
  children: React.ReactNode
  onPress?: () => void
  onLongPress?: () => void
  /** Target scale on press-in. Default 0.96 */
  scaleOnPress?: number
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  accessibilityRole?: 'button' | 'link' | 'none'
  accessibilityState?: { disabled?: boolean; selected?: boolean }
  testID?: string
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  scaleOnPress = 0.96,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
}: PressableScaleProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }))

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(scaleOnPress, SPRING_CONFIG)
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG)
      }}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      style={[animatedStyle, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
    >
      {children}
    </AnimatedPressable>
  )
}
