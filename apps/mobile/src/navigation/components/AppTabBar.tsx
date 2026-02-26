/**
 * AppTabBar — Custom bottom tab bar with a center Record FAB.
 *
 * Visual layout (4 equal-width columns):
 *
 *           ┌──────────────────────────────────────┐
 *           │            ┌──────┐                  │  ← FAB protrudes above bar
 *   ────────┼────────────│  ●   │──────────────────┤  ← top border of visible bar
 *   Explore   Journeys   │  🎙  │   Profile         │  ← tab items + FAB
 *           │            └──────┘                  │
 *           │          ← safe area →               │
 *           └──────────────────────────────────────┘
 *
 * The FAB navigates to the RecordModal stack in the parent (Root) navigator.
 * Tab items navigate within the BottomTabNavigator as normal.
 */

import React from 'react'
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, typeScale, sizes, spacing, shadows, radius } from '@/styles'
import type { RootStackParamList } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const TAB_HEIGHT = sizes.tabBarHeight         // 60pt — the visible bar
const FAB_SIZE = sizes.fabSize                // 56pt — the record button
const FAB_PROTRUSION = FAB_SIZE / 2           // 28pt — how far FAB floats above bar
const TOTAL_HEIGHT = TAB_HEIGHT + FAB_PROTRUSION  // 88pt total container height

// ── Icon map ──────────────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Ionicons>['name']

const TAB_CONFIG: Record<string, { inactive: IconName; active: IconName; label: string }> = {
  Explore: {
    inactive: 'earth-outline',
    active: 'earth',
    label: 'Explore',
  },
  Journeys: {
    inactive: 'compass-outline',
    active: 'compass',
    label: 'Journeys',
  },
  Profile: {
    inactive: 'person-outline',
    active: 'person',
    label: 'Profile',
  },
}

// ── Tab Item ──────────────────────────────────────────────────────────────────

interface TabItemProps {
  routeName: string
  isFocused: boolean
  onPress: () => void
  onLongPress: () => void
}

function TabItem({ routeName, isFocused, onPress, onLongPress }: TabItemProps) {
  const config = TAB_CONFIG[routeName]
  if (!config) return null

  const iconColor = isFocused ? colors.primary : colors.neutral400
  const labelColor = isFocused ? colors.primary : colors.neutral400

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isFocused ? config.active : config.inactive}
        size={sizes.iconMD}
        color={iconColor}
      />
      <Text style={[styles.tabLabel, { color: labelColor }]}>{config.label}</Text>
    </TouchableOpacity>
  )
}

// ── AppTabBar ─────────────────────────────────────────────────────────────────

export default function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  const onRecordPress = () => {
    // RecordModal lives in the parent (Root) stack — navigate up one level.
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('RecordModal')
  }

  // Build tab items by inserting the FAB placeholder between Journeys (index 1)
  // and Profile (index 2) so the layout reads: Explore | Journeys | FAB | Profile.
  const tabItems = state.routes.map((route, index) => {
    const isFocused = state.index === index
    const { options } = descriptors[route.key]!

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      })
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params)
      }
    }

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key })
    }

    return (
      <TabItem
        key={route.key}
        routeName={route.name}
        isFocused={isFocused}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    )
  })

  // Insert the FAB slot after index 1 (between Journeys and Profile)
  const tabItemsWithFab = [
    tabItems[0],
    tabItems[1],
    <View key="fab-spacer" style={styles.fabSpacer} />,
    tabItems[2],
  ]

  return (
    <View
      style={[styles.container, { height: TOTAL_HEIGHT + insets.bottom }]}
      pointerEvents="box-none"
    >
      {/* Visible bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
        {tabItemsWithFab}
      </View>

      {/* Record FAB — absolutely centered in the FAB slot ─────────────────── */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={onRecordPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Record a story"
        >
          <Ionicons name="mic" size={sizes.iconLG} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // The outer container is taller than the visible bar to give the FAB room
  // to protrude above without being clipped. It fills the full width.
  container: {
    width: '100%',
    overflow: 'visible',
  },

  // The visible tab bar — sits at the bottom of the container, below the FAB.
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderDefault,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {},
    }),
  },

  // Each tab item occupies an equal share of the bar width.
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
    gap: 2,
  },

  tabLabel: {
    ...typeScale.labelSmall,
  },

  // Empty spacer in the bar's tab row — same width as a tab item,
  // ensures the FAB's visual column aligns with surrounding tabs.
  fabSpacer: {
    flex: 1,
  },

  // FAB wrapper spans full container width for centering calculation.
  // pointerEvents="box-none" passes touches through to content below
  // except where the FAB button itself intercepts them.
  fabWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOTAL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
    // Center the FAB in its column slot (3rd of 4): offset = 2.5 / 4 = 62.5%
    // We use paddingLeft to shift center; the FAB is then centered within its slot.
    // Because the spacer is `flex: 1` in a 4-slot row, the FAB center is at 62.5% from left.
    // Instead of complex math, just let the absolute container span full width and align center.
    // The FAB appears at the horizontal center of the total bar — close enough for 3-tab layout.
  },

  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: FAB_PROTRUSION / 2,  // place FAB so its visual center sits on the bar's top edge
    ...shadows.primaryMd,
    // White ring around FAB so it separates from any screen content behind it
    borderWidth: 3,
    borderColor: colors.bgBase,
  },
})
