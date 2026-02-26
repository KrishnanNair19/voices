/**
 * Route parameter type maps for all navigators in @voices/mobile.
 *
 * Architecture:
 *   RootStack (NativeStack — modal presentation)
 *   ├── MainApp → TabNavigator
 *   └── RecordModal → RecordStack
 *
 *   TabNavigator (BottomTabs)
 *   ├── Explore → ExploreStack
 *   ├── Journeys → JourneysStack
 *   └── Profile → ProfileStack
 *
 * Typed screen props helpers are exported at the bottom so each screen
 * can import its own props type without repeating the generic boilerplate.
 */

import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

// ── DraftStory ────────────────────────────────────────────────────────────────
// Temporary: lives here until @voices/core defines it in Phase 1.
export type DraftStory = {
  audioUri: string
  trimStart: number    // milliseconds from start of recording
  trimEnd: number      // milliseconds from start of recording
  title?: string
  tags?: string[]
  coverImageUri?: string
}

// ── Root stack ────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  /** Main app shell — houses the tab navigator */
  MainApp: NavigatorScreenParams<TabParamList>
  /** Record flow — presented as a modal (slides up) */
  RecordModal: undefined
  Login: undefined
}

// ── Tab navigator ─────────────────────────────────────────────────────────────
export type TabParamList = {
  Explore: NavigatorScreenParams<ExploreStackParamList>
  Journeys: NavigatorScreenParams<JourneysStackParamList>
  Profile: NavigatorScreenParams<ProfileStackParamList>
}

// ── Explore stack ─────────────────────────────────────────────────────────────
export type ExploreStackParamList = {
  MainMap: undefined
  StoryList: { locationId: string }
  StoryListen: { storyId: string }
  CreatorProfile: { authorId: string }
}

// ── Journeys stack ────────────────────────────────────────────────────────────
export type JourneysStackParamList = {
  JourneysHome: undefined
  JourneyDetail: { journeyId: string }
  JourneyMap: { journeyId: string }
}

// ── Profile stack ─────────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  UserProfile: undefined
  EditProfile: undefined
}

// ── Record modal stack ────────────────────────────────────────────────────────
export type RecordStackParamList = {
  RecordHome: undefined
  EditStory: { audioUri: string; durationMs: number }
  StoryInfo: { audioUri: string; trimStart: number; trimEnd: number }
  ConfirmLocation: { draft: DraftStory }
  TakePhoto: undefined
  PhotoPreview: { photoUri: string }
}

// ── Auth stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined
}

// ── Screen props helpers ──────────────────────────────────────────────────────
// Import from this file in each screen to get fully typed navigation + route.
//
// Example:
//   import type { ExploreScreenProps } from '@/navigation/types'
//   export default function StoryListenScreen({ route }: ExploreScreenProps<'StoryListen'>) {
//     const { storyId } = route.params
//   }

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >

export type ExploreScreenProps<T extends keyof ExploreStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ExploreStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<TabParamList, 'Explore'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >

export type JourneysScreenProps<T extends keyof JourneysStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<JourneysStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<TabParamList, 'Journeys'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<TabParamList, 'Profile'>,
      NativeStackScreenProps<RootStackParamList>
    >
  >

export type RecordScreenProps<T extends keyof RecordStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<RecordStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >

// ── Global type augmentation for useNavigation() ─────────────────────────────
// Lets you call useNavigation() anywhere without specifying the generic.
// See: https://reactnavigation.org/docs/typescript#specifying-default-types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
