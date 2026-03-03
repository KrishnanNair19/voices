/**
 * App entry point.
 *
 * Firebase initialisation order (module-level, before first render):
 *   1. initFirebase(config)    — registers the Firebase app with the web SDK
 *   2. initializeAuth(...)     — configures AsyncStorage-backed session persistence
 *
 * QueryClientProvider wraps the tree so TanStack Query hooks work in all screens.
 */

// ── Imports ───────────────────────────────────────────────────────────────────

// @firebase/auth (not firebase/auth) so TypeScript resolves the react-native
// export condition, which includes getReactNativePersistence.
import { initializeAuth, getReactNativePersistence } from '@firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import {
  useFonts,
  Inter_100Thin,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter'
import { initFirebase, getFirebaseApp } from '@voices/core'
import { appTheme } from '@/styles'
import RootNavigator from '@/navigation/RootNavigator'
import { firebaseConfig } from '@/lib/firebaseConfig'

// ── Firebase initialisation ───────────────────────────────────────────────────
// Runs at module evaluation time, before any React rendering.

console.log(firebaseConfig)
initFirebase(firebaseConfig)

// initializeAuth must be called exactly once. The try/catch guards against a
// duplicate call on Expo Fast Refresh hot-reload cycles.
try {
  initializeAuth(getFirebaseApp(), {
    persistence: getReactNativePersistence(AsyncStorage),
  })
} catch {
  // Already initialised on a previous hot-reload — safe to ignore
}

// ── TanStack Query client ─────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  })

  if (!fontsLoaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PaperProvider theme={appTheme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
