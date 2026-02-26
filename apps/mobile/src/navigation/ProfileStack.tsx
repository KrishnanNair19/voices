import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ProfileStackParamList } from './types'
import UserProfileScreen from '@/screens/Profile/UserProfileScreen'
import EditProfileScreen from '@/screens/Profile/EditProfileScreen'

const Stack = createNativeStackNavigator<ProfileStackParamList>()

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  )
}
