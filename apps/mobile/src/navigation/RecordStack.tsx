import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RecordStackParamList } from './types'
import RecordHomeScreen from '@/screens/Record/RecordHomeScreen'
import EditStoryScreen from '@/screens/Record/EditStoryScreen'
import StoryInfoScreen from '@/screens/Record/StoryInfoScreen'
import ConfirmLocationScreen from '@/screens/Record/ConfirmLocationScreen'
import TakePhotoScreen from '@/screens/Record/TakePhotoScreen'
import PhotoPreviewScreen from '@/screens/Record/PhotoPreviewScreen'
import { colors } from '@/styles'

const Stack = createNativeStackNavigator<RecordStackParamList>()

export default function RecordStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgBase },
      }}
    >
      <Stack.Screen name="RecordHome" component={RecordHomeScreen} />
      <Stack.Screen name="EditStory" component={EditStoryScreen} />
      <Stack.Screen name="StoryInfo" component={StoryInfoScreen} />
      <Stack.Screen name="ConfirmLocation" component={ConfirmLocationScreen} />
      <Stack.Screen name="TakePhoto" component={TakePhotoScreen} />
      <Stack.Screen name="PhotoPreview" component={PhotoPreviewScreen} />
    </Stack.Navigator>
  )
}
