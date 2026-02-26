/**
 * RootNavigator — top-level navigator for @voices/mobile.
 *
 * Manages two concerns:
 *   1. Auth gate: shows Auth stack when unauthenticated, Main app when signed in.
 *   2. Record modal: the Record flow lives here (above the tab bar) so the
 *      tab bar disappears during recording and the modal can slide up natively.
 *
 * TODO Phase 1: Replace `isAuthenticated` local state with `useAuthStore()`
 * from `@voices/core` once Firebase Auth is wired up.
 */

import React, { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DefaultTheme } from '@react-navigation/native'
import { enableScreens } from 'react-native-screens'
import type { RootStackParamList } from './types'
import TabNavigator from './TabNavigator'
import RecordStack from './RecordStack'
import LoginScreen from '@/screens/Auth/LoginScreen'
import { colors } from '@/styles'

// Enable react-native-screens for native navigation performance.
enableScreens()

const Stack = createNativeStackNavigator<RootStackParamList>()

// ── Navigation theme ──────────────────────────────────────────────────────────
// Overrides React Navigation's default colours to match our design system so
// native headers (if ever shown) and the background are on-brand.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bgBase,
    card: colors.bgSurface,
    text: colors.textPrimary,
    border: colors.borderDefault,
    notification: colors.primary,
  },
}

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Grouping Authenticated Screens
          <Stack.Group>
            <Stack.Screen name="MainApp" component={TabNavigator} />
            <Stack.Screen
              name="RecordModal"
              component={RecordStack}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack.Group>
        ) : (
          // Grouping Unauthenticated Screens
          <Stack.Group>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen 
                  {...props} 
                  onAuthSuccess={() => setIsAuthenticated(true)} 
                />
              )}
            </Stack.Screen>
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}