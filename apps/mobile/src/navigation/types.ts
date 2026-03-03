/**
 * Route parameter type maps for all navigators in @voices/mobile.
 *
 * Architecture:
 *   RootStack (NativeStack)
 *   ├── Auth       → AuthStack       (unauthenticated)
 *   ├── Onboarding → OnboardingStack (authenticated but wizard incomplete)
 *   ├── MainApp    → TabNavigator    (fully authenticated)
 *   └── RecordModal → RecordStack   (modal, presented above tabs)
 *
 *   TabNavigator (BottomTabs)
 *   ├── Explore  → ExploreStack
 *   ├── Journeys → JourneysStack
 *   └── Profile  → ProfileStack
 */

import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

// ── DraftStory ────────────────────────────────────────────────────────────────
// Temporary: lives here until @voices/core defines it in a future phase.
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
  /** Auth stack — shown when unauthenticated or email not yet verified */
  Auth: NavigatorScreenParams<AuthStackParamList>
  /** Onboarding wizard — shown after first authentication */
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>
  /** Main app shell — houses the tab navigator */
  MainApp: NavigatorScreenParams<TabParamList>
  /** Record flow — presented as a modal (slides up above tabs) */
  RecordModal: undefined
}

// ── Auth stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Landing: undefined
  EmailSignUp: undefined
  EmailLogin: undefined
  ForgotPassword: undefined
  /** email is passed so the pending screen can display it */
  EmailVerificationPending: { email: string }
}

// ── Onboarding stack ─────────────────────────────────────────────────────────
export type OnboardingStackParamList = {
  OnboardingWelcome: undefined
  OnboardingIdentity: undefined
  OnboardingUsername: undefined
  OnboardingProfile: undefined
  OnboardingInterests: undefined
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

// ── Screen props helpers ──────────────────────────────────────────────────────
// Import from this file in each screen to get fully typed navigation + route.
//
// Example:
//   import type { AuthScreenProps } from '@/navigation/types'
//   export default function LandingScreen({ navigation }: AuthScreenProps<'Landing'>) {
//     navigation.navigate('EmailSignUp')
//   }

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OnboardingStackParamList, T>,
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
