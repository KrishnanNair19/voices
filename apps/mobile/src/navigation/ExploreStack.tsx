import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { ExploreStackParamList } from './types'
import MainMapScreen from '@/screens/Explore/MainMapScreen'
import StoryListScreen from '@/screens/Explore/StoryListScreen'
import StoryListenScreen from '@/screens/Explore/StoryListenScreen'
import CreatorProfileScreen from '@/screens/Explore/CreatorProfileScreen'

const Stack = createNativeStackNavigator<ExploreStackParamList>()

export default function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainMap" component={MainMapScreen} />
      <Stack.Screen name="StoryList" component={StoryListScreen} />
      <Stack.Screen name="StoryListen" component={StoryListenScreen} />
      <Stack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
    </Stack.Navigator>
  )
}
