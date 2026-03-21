/**
 * Explore page controller — v2
 *
 * Manages:
 *   - All stories feed (useStories) + viewport filtering + sort/filter
 *   - Typeahead search: Nominatim location suggestions + Firestore user search
 *   - Sidebar view state machine: 'list' | 'story' | 'user'
 *   - Map center/zoom + bounds tracking (for viewport story list)
 *   - User geolocation for initial map position
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import {
  useStories,
  getDb,
  userProfileConverter,
  distanceBetween,
} from '@voices/core'
import type { Story, GeoPoint } from '@voices/core'

const DEFAULT_CENTER: GeoPoint = { lat: 40.7128, lng: -74.006 }
const DEFAULT_ZOOM = 12

// ── Shared types ──────────────────────────────────────────────────────────────

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface LocationSuggestion {
  type: 'location'
  /** Short display label (first 2 comma-parts of Nominatim display_name) */
  label: string
  /** Full display_name for secondary line */
  fullLabel: string
  center: GeoPoint
}

export interface UserSuggestion {
  type: 'user'
  uid: string
  username: string
  displayName: string
  profileImageUrl: string | null
}

export type SearchSuggestion = LocationSuggestion | UserSuggestion

export type SidebarView = 'list' | 'story' | 'user'

export type SortMode = 'newest' | 'popular' | 'closest'

export type ContentFilter = 'all' | 'audio' | 'text' | 'image' | 'video' | 'mixed'

// ── Nominatim forward-geocode suggestions ─────────────────────────────────────

async function fetchLocationSuggestions(q: string): Promise<LocationSuggestion[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'VoicesApp/1.0' },
    })
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    return data.map((item) => {
      const parts = item.display_name.split(',')
      return {
        type: 'location' as const,
        label: parts.slice(0, 2).join(',').trim(),
        fullLabel: item.display_name,
        center: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
      }
    })
  } catch {
    return []
  }
}

// ── Firestore user prefix search ──────────────────────────────────────────────

async function fetchUserSuggestions(q: string): Promise<UserSuggestion[]> {
  if (!q) return []
  try {
    const db = getDb()
    const ref = collection(db, 'users').withConverter(userProfileConverter)
    const snap = await getDocs(
      query(
        ref,
        where('username', '>=', q),
        where('username', '<=', q + '\uf8ff'),
        limit(5),
      ),
    )
    return snap.docs.map((d) => {
      const p = d.data()
      return {
        type: 'user' as const,
        uid: p.uid,
        username: p.username,
        displayName: p.displayName,
        profileImageUrl: p.profileImageUrl,
      }
    })
  } catch {
    return []
  }
}

// ── Viewport filter ───────────────────────────────────────────────────────────

function inBounds(loc: GeoPoint, bounds: MapBounds): boolean {
  return (
    loc.lat <= bounds.north &&
    loc.lat >= bounds.south &&
    loc.lng >= bounds.west &&
    loc.lng <= bounds.east
  )
}

// ── Controller ────────────────────────────────────────────────────────────────

export function useExploreController() {
  const { data: allStories = [], isLoading, error } = useStories()

  // ── Map state ──────────────────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState<GeoPoint>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  // ── Sidebar view state ─────────────────────────────────────────────────────
  const [sidebarView, setSidebarView] = useState<SidebarView>('list')
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // ── Search typeahead ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Sort / filter ──────────────────────────────────────────────────────────
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all')

  // ── Viewport story list ────────────────────────────────────────────────────
  const viewportStories = useMemo(() => {
    // Only stories with a real location (not 0,0) and within viewport
    let list = allStories.filter((s) => {
      const hasLocation = s.location.lat !== 0 || s.location.lng !== 0
      if (!hasLocation) return false
      if (!mapBounds) return true
      return inBounds(s.location, mapBounds)
    })

    if (contentFilter !== 'all') {
      list = list.filter((s) => s.contentType === contentFilter)
    }

    if (sortMode === 'newest') {
      list = [...list].sort((a, b) => b.createdAt - a.createdAt)
    } else if (sortMode === 'popular') {
      list = [...list].sort((a, b) => b.playCount - a.playCount)
    } else {
      // closest
      list = [...list].sort(
        (a, b) =>
          distanceBetween(a.location, mapCenter) -
          distanceBetween(b.location, mapCenter),
      )
    }

    return list
  }, [allStories, mapBounds, contentFilter, sortMode, mapCenter])

  // ── Stories shown on map ───────────────────────────────────────────────────
  // In user view: only that user's stories. Otherwise: all stories.
  const mapStories = useMemo(
    () =>
      sidebarView === 'user' && selectedUserId
        ? allStories.filter((s) => s.authorId === selectedUserId)
        : allStories,
    [allStories, sidebarView, selectedUserId],
  )

  // ── Typeahead search ───────────────────────────────────────────────────────
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!q.trim()) {
      setSuggestions([])
      setIsSuggestionsOpen(false)
      return
    }

    setIsFetchingSuggestions(true)
    setIsSuggestionsOpen(true)

    debounceRef.current = setTimeout(() => {
      const normalized = q.toLowerCase().replace(/^@/, '')
      void Promise.all([
        fetchLocationSuggestions(q),
        fetchUserSuggestions(normalized),
      ]).then(([locations, users]) => {
        setSuggestions([...locations, ...users])
        setIsFetchingSuggestions(false)
      })
    }, 350)
  }, [])

  const openSuggestions = useCallback(() => {
    if (searchQuery.trim() && suggestions.length > 0) {
      setIsSuggestionsOpen(true)
    }
  }, [searchQuery, suggestions.length])

  const selectLocationSuggestion = useCallback(
    (suggestion: LocationSuggestion) => {
      setSearchQuery(suggestion.label)
      setSuggestions([])
      setIsSuggestionsOpen(false)
      setMapCenter(suggestion.center)
      setMapZoom(13)
      setSidebarView('list')
      setSelectedUserId(null)
    },
    [],
  )

  const selectUserSuggestion = useCallback((suggestion: UserSuggestion) => {
    setSearchQuery(suggestion.displayName)
    setSuggestions([])
    setIsSuggestionsOpen(false)
    setSelectedUserId(suggestion.uid)
    setSidebarView('user')
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSuggestions([])
    setIsSuggestionsOpen(false)
    setSidebarView('list')
    setSelectedUserId(null)
    setSelectedStoryId(null)
  }, [])

  // ── Story selection ────────────────────────────────────────────────────────
  const selectStory = useCallback((story: Story) => {
    setSelectedStoryId(story.id)
    setSidebarView('story')
    if (story.location.lat !== 0 || story.location.lng !== 0) {
      setMapCenter(story.location)
      setMapZoom(15)
    }
  }, [])

  const closeStoryDetail = useCallback(() => {
    setSelectedStoryId(null)
    setSidebarView('list')
  }, [])

  const backToList = useCallback(() => {
    setSidebarView('list')
    setSelectedStoryId(null)
    setSelectedUserId(null)
  }, [])

  // ── Geolocation ────────────────────────────────────────────────────────────
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setMapZoom(13)
        setIsLocating(false)
      },
      () => setIsLocating(false),
      { timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    locateUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    // Data
    allStories,
    viewportStories,
    mapStories,
    isLoading,
    error,

    // Map
    mapCenter,
    mapZoom,
    mapBounds,
    setMapBounds,
    isLocating,
    locateUser,

    // Search
    searchQuery,
    suggestions,
    isSuggestionsOpen,
    isFetchingSuggestions,
    handleSearchChange,
    openSuggestions,
    selectLocationSuggestion,
    selectUserSuggestion,
    clearSearch,
    closeSuggestions: () => setIsSuggestionsOpen(false),

    // Sort / filter
    sortMode,
    setSortMode,
    contentFilter,
    setContentFilter,

    // Sidebar
    sidebarView,
    selectedStoryId,
    selectedUserId,
    selectStory,
    closeStoryDetail,
    backToList,
  }
}
