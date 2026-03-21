/**
 * Explore page — map + sidebar story discovery.
 *
 * Layout:
 *   [ Sidebar: Search + dynamic panel ] [ Full-height Leaflet map ]
 *
 * Sidebar panels (via sidebarView state):
 *   'list'  — viewport story list with sort/filter
 *   'story' — story detail (keeps map interactive)
 *   'user'  — user profile + playlists + recent stories
 */

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import { useExploreController } from '../hooks/useExploreController'
import SearchBar from '../components/SearchBar'
import StoryMap from '../components/StoryMap'
import SidebarStoryList from '../components/SidebarStoryList'
import SidebarStoryDetail from '../components/SidebarStoryDetail'
import SidebarUserProfile from '../components/SidebarUserProfile'

const SIDEBAR_WIDTH = 360

export default function ExplorePage() {
  const ctrl = useExploreController()

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <SearchBar
          value={ctrl.searchQuery}
          onChange={ctrl.handleSearchChange}
          onClear={ctrl.clearSearch}
          onFocus={ctrl.openSuggestions}
          suggestions={ctrl.suggestions}
          isFetching={ctrl.isFetchingSuggestions}
          isOpen={ctrl.isSuggestionsOpen}
          onSelectLocation={ctrl.selectLocationSuggestion}
          onSelectUser={ctrl.selectUserSuggestion}
          onClose={ctrl.closeSuggestions}
        />

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Dynamic panel */}
        {ctrl.sidebarView === 'list' && (
          <SidebarStoryList
            stories={ctrl.viewportStories}
            selectedId={ctrl.selectedStoryId}
            sortMode={ctrl.sortMode}
            contentFilter={ctrl.contentFilter}
            onSortChange={ctrl.setSortMode}
            onFilterChange={ctrl.setContentFilter}
            onSelectStory={ctrl.selectStory}
            isLoading={ctrl.isLoading}
          />
        )}

        {ctrl.sidebarView === 'story' && ctrl.selectedStoryId && (
          <SidebarStoryDetail
            storyId={ctrl.selectedStoryId}
            onBack={ctrl.closeStoryDetail}
          />
        )}

        {ctrl.sidebarView === 'user' && ctrl.selectedUserId && (
          <SidebarUserProfile
            userId={ctrl.selectedUserId}
            onBack={ctrl.backToList}
            onSelectStory={ctrl.selectStory}
          />
        )}
      </Box>

      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <StoryMap
          stories={ctrl.mapStories}
          selectedId={ctrl.selectedStoryId}
          mapCenter={ctrl.mapCenter}
          mapZoom={ctrl.mapZoom}
          onSelectStory={ctrl.selectStory}
          onLocateMe={ctrl.locateUser}
          isLocating={ctrl.isLocating}
          onBoundsChange={ctrl.setMapBounds}
        />
      </Box>
    </Box>
  )
}
