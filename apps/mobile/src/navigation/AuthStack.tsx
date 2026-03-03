import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { AuthStackParamList } from './types'
import LandingScreen from '@/screens/Auth/LandingScreen'
import EmailSignUpScreen from '@/screens/Auth/EmailSignUpScreen'
import EmailLoginScreen from '@/screens/Auth/EmailLoginScreen'
import ForgotPasswordScreen from '@/screens/Auth/ForgotPasswordScreen'
import EmailVerificationPendingScreen from '@/screens/Auth/EmailVerificationPendingScreen'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EmailVerificationPending" component={EmailVerificationPendingScreen} />
    </Stack.Navigator>
  )
}
