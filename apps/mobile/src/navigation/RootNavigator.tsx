/**
 * RootNavigator — top-level navigator for @voices/mobile.
 *
 * Reads auth status from useAuthStore and renders exactly one of:
 *   - AuthStack       (unauthenticated, or email not yet verified)
 *   - OnboardingStack (authenticated but wizard not complete)
 *   - MainApp + RecordModal (fully authenticated)
 *
 * initAuthListener() subscribes to Firebase Auth state changes and drives
 * the store. It is started once on mount and torn down on unmount.
 */

import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DefaultTheme } from '@react-navigation/native'
import { enableScreens } from 'react-native-screens'
import { useAuthStore, initAuthListener } from '@voices/core'
import type { RootStackParamList } from './types'
import TabNavigator from './TabNavigator'
import RecordStack from './RecordStack'
import AuthStack from './AuthStack'
import OnboardingStack from './OnboardingStack'
import { colors } from '@/styles'

enableScreens()

const Stack = createNativeStackNavigator<RootStackParamList>()

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:      colors.primary,
    background:   colors.bgBase,
    card:         colors.bgSurface,
    text:         colors.textPrimary,
    border:       colors.borderDefault,
    notification: colors.primary,
  },
}

export default function RootNavigator() {
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    const unsubscribe = initAuthListener()
    return unsubscribe
  }, [])

  // Branded splash while Firebase resolves the initial auth state from cache
  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'unauthenticated' && (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
        {status === 'onboarding' && (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        )}
        {status === 'authenticated' && (
          <>
            <Stack.Screen name="MainApp" component={TabNavigator} />
            <Stack.Screen
              name="RecordModal"
              component={RecordStack}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBase,
  },
})
