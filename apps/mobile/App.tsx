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
import { appTheme } from '@/styles'
import RootNavigator from '@/navigation/RootNavigator'

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

  // Hold the splash screen until fonts are ready.
  // TODO: Replace null return with SplashScreen.preventAutoHideAsync() pattern
  // once expo-splash-screen is added in the polish phase.
  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  )
}
