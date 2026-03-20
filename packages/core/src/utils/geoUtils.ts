/**
 * Geolocation utilities for @voices/core.
 *
 * reverseGeocode — converts lat/lng to a human-readable place name
 *                  using the free Nominatim (OpenStreetMap) API.
 * distanceBetween — Haversine formula distance between two GeoPoints in km.
 */

import type { GeoPoint } from '../types/story'

const EARTH_RADIUS_KM = 6371

/**
 * Converts degrees to radians.
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Returns the great-circle distance between two points in kilometres.
 *
 * distanceBetween({ lat: 41.38, lng: 2.17 }, { lat: 37.77, lng: -122.41 })
 * → ~9149 km
 */
export function distanceBetween(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return EARTH_RADIUS_KM * c
}

interface NominatimResponse {
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    country?: string
  }
}

/**
 * Reverse-geocodes a lat/lng pair to a human-readable location name.
 *
 * Uses the free Nominatim (OpenStreetMap) API — no API key required.
 * Falls back to "lat, lng" coordinates on any network or parse error.
 *
 * Note: Nominatim requires a descriptive User-Agent per their usage policy.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'VoicesApp/1.0 (https://github.com/voices)',
      },
    })

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

    const data = (await res.json()) as NominatimResponse

    // Prefer city > town > village > county, then fall back to full display_name
    const addr = data.address
    if (addr) {
      const place = addr.city ?? addr.town ?? addr.village ?? addr.county
      const country = addr.country
      if (place && country) return `${place}, ${country}`
      if (place) return place
    }

    return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}
