import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { TabParamList } from './types'
import AppTabBar from './components/AppTabBar'
import ExploreStack from './ExploreStack'
import JourneysStack from './JourneysStack'
import ProfileStack from './ProfileStack'

const Tab = createBottomTabNavigator<TabParamList>()

export default function TabNavigator() {
  return (
    <Tab.Navigator
      // Fully custom tab bar — AppTabBar owns all layout and rendering.
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Lazy-load tabs so only the active tab mounts on first render.
        lazy: true,
      }}
    >
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Journeys" component={JourneysStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  )
}
