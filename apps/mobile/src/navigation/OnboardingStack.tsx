import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useOnboardingStore } from '@voices/core'
import type { OnboardingStackParamList } from './types'
import OnboardingWelcomeScreen from '@/screens/Onboarding/OnboardingWelcomeScreen'
import OnboardingIdentityScreen from '@/screens/Onboarding/OnboardingIdentityScreen'
import OnboardingUsernameScreen from '@/screens/Onboarding/OnboardingUsernameScreen'
import OnboardingProfileScreen from '@/screens/Onboarding/OnboardingProfileScreen'
import OnboardingInterestsScreen from '@/screens/Onboarding/OnboardingInterestsScreen'

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

const stepToRoute: Record<number, keyof OnboardingStackParamList> = {
  0: 'OnboardingWelcome',
  1: 'OnboardingIdentity',
  2: 'OnboardingUsername',
  3: 'OnboardingProfile',
  4: 'OnboardingInterests',
}

export default function OnboardingStack() {
  const currentStep = useOnboardingStore((s) => s.currentStep)
  // Resume from the saved Firestore step set by initAuthListener
  const initialRouteName = stepToRoute[currentStep] ?? 'OnboardingWelcome'

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingIdentity" component={OnboardingIdentityScreen} />
      <Stack.Screen name="OnboardingUsername" component={OnboardingUsernameScreen} />
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
      <Stack.Screen name="OnboardingInterests" component={OnboardingInterestsScreen} />
    </Stack.Navigator>
  )
}
