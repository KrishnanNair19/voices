/**
 * PlaylistMapView — Leaflet map with numbered markers for playlist stories.
 *
 * Each story gets a numbered circular marker at its location.
 * Stories sharing the exact same lat/lng are grouped into a cluster marker.
 * The map auto-fits to show all markers on load.
 *
 * Reuses the same CARTO dark tiles as StoryMap.tsx.
 */

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MuiButton from '@mui/material/Button'
import { tokens } from '@voices/core'
import type { Story } from '@voices/core'

// ── Leaflet CSS — must be imported here if not already global ─────────────────
import 'leaflet/dist/leaflet.css'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlaylistMapViewProps {
  stories: Story[]
  activeStoryId?: string | null
  onSelectStory: (story: Story) => void
}

// ── Grouped marker data ────────────────────────────────────────────────────────

interface LocationGroup {
  lat: number
  lng: number
  stories: Array<{ story: Story; index: number }>
}

function groupByLocation(stories: Story[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>()

  stories.forEach((story, index) => {
    const key = `${story.location.lat},${story.location.lng}`
    const existing = map.get(key)
    if (existing) {
      existing.stories.push({ story, index })
    } else {
      map.set(key, {
        lat: story.location.lat,
        lng: story.location.lng,
        stories: [{ story, index }],
      })
    }
  })

  return Array.from(map.values())
}

// ── Custom marker icons ────────────────────────────────────────────────────────

function makeMarkerIcon(label: string, isActive: boolean, isCluster: boolean): ReturnType<typeof divIcon> {
  const size = isActive ? 32 : 28
  const bg = isCluster ? '#FDF0AF' : tokens.color.primary
  const textColor = isCluster ? '#0f1117' : '#0f1117'
  const border = isActive ? '2.5px solid #ffffff' : '2px solid rgba(15,17,23,0.6)'

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${bg};
      border: ${border};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${size <= 28 ? 11 : 12}px;
      font-weight: 700;
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      cursor: pointer;
      white-space: nowrap;
      padding: 0 4px;
      box-sizing: border-box;
    ">${label}</div>
  `

  return divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

// ── BoundsFitter — auto-fit map to all markers on first render ────────────────

function BoundsFitter({ stories }: { stories: Story[] }) {
  const map = useMap()

  useEffect(() => {
    const validStories = stories.filter(
      (s) => s.location.lat !== 0 || s.location.lng !== 0,
    )
    if (validStories.length === 0) return

    if (validStories.length === 1) {
      const s = validStories[0]!
      map.setView([s.location.lat, s.location.lng], 13)
      return
    }

    const lats = validStories.map((s) => s.location.lat)
    const lngs = validStories.map((s) => s.location.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [40, 40], maxZoom: 15 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlaylistMapView({
  stories,
  activeStoryId,
  onSelectStory,
}: PlaylistMapViewProps) {
  const validStories = useMemo(
    () => stories.filter((s) => s.location.lat !== 0 || s.location.lng !== 0),
    [stories],
  )

  const groups = useMemo(() => groupByLocation(validStories), [validStories])

  if (validStories.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          color: 'text.secondary',
          minHeight: 300,
        }}
      >
        <Typography variant="body1">No location data for these stories</Typography>
      </Box>
    )
  }

  // Default center: centroid of all valid story locations
  const defaultLat = validStories.reduce((acc, s) => acc + s.location.lat, 0) / validStories.length
  const defaultLng = validStories.reduce((acc, s) => acc + s.location.lng, 0) / validStories.length

  return (
    <Box sx={{ flex: 1, minHeight: 400, borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={10}
        style={{ height: '100%', width: '100%', minHeight: 400, background: '#0f1117' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        <BoundsFitter stories={validStories} />

        {groups.map((group) => {
          const isCluster = group.stories.length > 1
          const isActive = group.stories.some(({ story }) => story.id === activeStoryId)

          if (isCluster) {
            // Cluster marker: show count, popup lists all stories
            const icon = makeMarkerIcon(
              `${group.stories.length}`,
              isActive,
              true,
            )
            return (
              <Marker
                key={`${group.lat},${group.lng}`}
                position={[group.lat, group.lng]}
                icon={icon}
              >
                <Popup
                  closeButton={false}
                  className="playlist-cluster-popup"
                >
                  <Box
                    sx={{
                      bgcolor: tokens.color.surface,
                      borderRadius: 1,
                      p: 0.5,
                      minWidth: 160,
                    }}
                  >
                    {group.stories.map(({ story, index }) => (
                      <MuiButton
                        key={story.id}
                        onClick={() => onSelectStory(story)}
                        fullWidth
                        size="small"
                        sx={{
                          justifyContent: 'flex-start',
                          color: story.id === activeStoryId ? tokens.color.primary : 'text.primary',
                          fontWeight: story.id === activeStoryId ? 700 : 400,
                          textAlign: 'left',
                          py: 0.5,
                          px: 1,
                          fontSize: 12,
                          textTransform: 'none',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            color: tokens.color.primary,
                            fontWeight: 700,
                            fontSize: 11,
                            mr: 0.75,
                            minWidth: 16,
                          }}
                        >
                          {index + 1}.
                        </Typography>
                        {story.title}
                      </MuiButton>
                    ))}
                  </Box>
                </Popup>
              </Marker>
            )
          }

          // Single story at this location
          const { story, index } = group.stories[0]!
          const isThisActive = story.id === activeStoryId
          const icon = makeMarkerIcon(`${index + 1}`, isThisActive, false)

          return (
            <Marker
              key={story.id}
              position={[group.lat, group.lng]}
              icon={icon}
              eventHandlers={{ click: () => onSelectStory(story) }}
            />
          )
        })}
      </MapContainer>
    </Box>
  )
}
