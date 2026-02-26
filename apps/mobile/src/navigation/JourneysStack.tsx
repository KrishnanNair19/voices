import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { JourneysStackParamList } from './types'
import JourneysHomeScreen from '@/screens/Journeys/JourneysHomeScreen'
import JourneyDetailScreen from '@/screens/Journeys/JourneyDetailScreen'
import JourneyMapScreen from '@/screens/Journeys/JourneyMapScreen'

const Stack = createNativeStackNavigator<JourneysStackParamList>()

export default function JourneysStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JourneysHome" component={JourneysHomeScreen} />
      <Stack.Screen name="JourneyDetail" component={JourneyDetailScreen} />
      <Stack.Screen name="JourneyMap" component={JourneyMapScreen} />
    </Stack.Navigator>
  )
}
