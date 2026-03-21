/**
 * Sidebar story list — stories visible in the current map viewport.
 * Includes sort (newest / popular / closest) and content-type filter.
 */

import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined'
import type { Story } from '@voices/core'
import type { ContentFilter, SortMode } from '../hooks/useExploreController'
import StoryCard from './StoryCard'

interface Props {
  stories: Story[]
  selectedId: string | null
  sortMode: SortMode
  contentFilter: ContentFilter
  onSortChange: (s: SortMode) => void
  onFilterChange: (f: ContentFilter) => void
  onSelectStory: (s: Story) => void
  isLoading: boolean
}

export default function SidebarStoryList({
  stories,
  selectedId,
  sortMode,
  contentFilter,
  onSortChange,
  onFilterChange,
  onSelectStory,
  isLoading,
}: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Controls */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Select
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          size="small"
          variant="outlined"
          sx={{
            height: 28,
            fontSize: '0.75rem',
            bgcolor: 'rgba(255,255,255,0.04)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.1)',
            },
            '& .MuiSelect-select': { py: 0.5 },
          }}
        >
          <MenuItem value="newest">Newest</MenuItem>
          <MenuItem value="popular">Popular</MenuItem>
          <MenuItem value="closest">Closest</MenuItem>
        </Select>

        <ToggleButtonGroup
          value={contentFilter}
          exclusive
          onChange={(_, v: ContentFilter | null) => v && onFilterChange(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              py: 0.25,
              px: 0.75,
              fontSize: '0.7rem',
              height: 28,
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'text.disabled',
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: 'rgba(29,219,181,0.1)',
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="audio">Voice</ToggleButton>
          <ToggleButton value="text">Text</ToggleButton>
          <ToggleButton value="image">Image</ToggleButton>
          <ToggleButton value="video">Video</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Count label */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ px: 2, py: 0.75, display: 'block' }}
      >
        {stories.length} {stories.length === 1 ? 'story' : 'stories'} in view
      </Typography>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.5 }}>
              <Skeleton
                variant="rectangular"
                width={64}
                height={64}
                sx={{ borderRadius: 1.5, flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="70%" height={18} sx={{ mb: 0.75 }} />
                <Skeleton width="50%" height={14} />
              </Box>
            </Box>
          ))
        ) : stories.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
              px: 3,
              textAlign: 'center',
            }}
          >
            <ExploreOutlinedIcon
              sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }}
            />
            <Typography variant="body2" color="text.secondary">
              No stories in this area.
            </Typography>
            <Typography variant="caption" color="text.disabled" mt={0.5}>
              Pan or zoom the map to explore more.
            </Typography>
          </Box>
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              isSelected={story.id === selectedId}
              onClick={() => onSelectStory(story)}
            />
          ))
        )}
      </Box>
    </Box>
  )
}
