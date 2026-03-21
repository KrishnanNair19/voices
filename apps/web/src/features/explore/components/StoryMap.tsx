/**
 * Leaflet map with story markers.
 *
 * Uses OpenStreetMap tiles — no API key required.
 * Reports map bounds via onBoundsChange so the controller can filter
 * the sidebar story list to the current viewport.
 */

import { useEffect, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MuiTooltip from '@mui/material/Tooltip'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import CircularProgress from '@mui/material/CircularProgress'
import { tokens } from '@voices/core'
import type { Story, GeoPoint } from '@voices/core'
import type { MapBounds } from '../hooks/useExploreController'

// ── BoundsTracker — fires onBoundsChange on move/zoom end ─────────────────────

function BoundsTracker({
  onBoundsChange,
}: {
  onBoundsChange: (b: MapBounds) => void
}) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
    zoomend() {
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
  })

  // Fire once on mount so the initial bounds are captured
  useEffect(() => {
    const b = map.getBounds()
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ── MapController — syncs external center/zoom into the Leaflet map ───────────

function MapController({ center, zoom }: { center: GeoPoint; zoom: number }) {
  const map = useMap()
  const prevCenter = useRef(center)
  const prevZoom = useRef(zoom)

  useEffect(() => {
    const sameCenter =
      prevCenter.current.lat === center.lat &&
      prevCenter.current.lng === center.lng
    const sameZoom = prevZoom.current === zoom
    if (!sameCenter || !sameZoom) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 })
      prevCenter.current = center
      prevZoom.current = zoom
    }
  }, [center, zoom, map])

  return null
}

// ── Story markers ─────────────────────────────────────────────────────────────

interface StoryMarkersProps {
  stories: Story[]
  selectedId: string | null
  onSelect: (story: Story) => void
}

function StoryMarkers({ stories, selectedId, onSelect }: StoryMarkersProps) {
  const storiesWithLocation = stories.filter(
    (s) => s.location.lat !== 0 || s.location.lng !== 0,
  )

  return (
    <>
      {storiesWithLocation.map((story) => {
        const isSelected = story.id === selectedId
        return (
          <CircleMarker
            key={story.id}
            center={[story.location.lat, story.location.lng]}
            radius={isSelected ? 14 : 10}
            pathOptions={{
              fillColor: tokens.color.primary,
              fillOpacity: isSelected ? 1 : 0.75,
              color: isSelected ? '#fff' : tokens.color.primaryDark,
              weight: isSelected ? 2.5 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(story) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {story.title}
              </span>
              {story.locationName && (
                <span
                  style={{ display: 'block', fontSize: 11, opacity: 0.7 }}
                >
                  {story.locationName}
                </span>
              )}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}

// ── Main StoryMap component ───────────────────────────────────────────────────

interface StoryMapProps {
  stories: Story[]
  selectedId: string | null
  mapCenter: GeoPoint
  mapZoom: number
  onSelectStory: (story: Story) => void
  onLocateMe: () => void
  isLocating: boolean
  onBoundsChange: (bounds: MapBounds) => void
  mapRef?: React.MutableRefObject<LeafletMap | null>
}

export default function StoryMap({
  stories,
  selectedId,
  mapCenter,
  mapZoom,
  onSelectStory,
  onLocateMe,
  isLocating,
  onBoundsChange,
  mapRef,
}: StoryMapProps) {
  return (
    <Box sx={{ position: 'relative', flex: 1, height: '100%' }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', background: '#0f1117' }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        <MapController center={mapCenter} zoom={mapZoom} />
        <BoundsTracker onBoundsChange={onBoundsChange} />

        <StoryMarkers
          stories={stories}
          selectedId={selectedId}
          onSelect={onSelectStory}
        />
      </MapContainer>

      {/* Locate me button */}
      <MuiTooltip title="Go to my location" placement="left">
        <IconButton
          onClick={onLocateMe}
          disabled={isLocating}
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 16,
            zIndex: 1000,
            bgcolor: 'rgba(15,17,23,0.92)',
            border: `1px solid rgba(255,255,255,0.12)`,
            color: isLocating ? tokens.color.primary : 'text.secondary',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: 'rgba(26,31,46,0.95)',
              color: tokens.color.primary,
            },
            '&:disabled': { bgcolor: 'rgba(15,17,23,0.92)' },
          }}
        >
          {isLocating ? (
            <CircularProgress size={20} sx={{ color: tokens.color.primary }} />
          ) : (
            <MyLocationIcon fontSize="small" />
          )}
        </IconButton>
      </MuiTooltip>
    </Box>
  )
}
