import axios from 'axios'
import { config } from '../config'

export interface GeocodingResult {
  /** Full formatted address from Google, e.g. "Hoàn Kiếm, Hanoi, Vietnam" */
  formattedAddress: string
  lat: number
  lng: number
}

interface GoogleGeocodeResponse {
  status: string
  results: Array<{
    formatted_address: string
    geometry: {
      location: { lat: number; lng: number }
    }
  }>
}

/**
 * Geocodes a free-text location query using the Google Maps Geocoding API.
 *
 * Returns the top result, or null if:
 *   - GOOGLE_MAPS_API_KEY is not configured
 *   - Google returns no results for the query
 *   - The API call fails
 */
export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  if (!config.google.mapsApiKey) {
    return null
  }

  try {
    const response = await axios.get<GoogleGeocodeResponse>(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: { address: query, key: config.google.mapsApiKey },
        timeout: 5_000,
      },
    )

    const { status, results } = response.data

    if (status !== 'OK' || !results.length) {
      return null
    }

    const top = results[0]!
    return {
      formattedAddress: top.formatted_address,
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
    }
  } catch (err) {
    console.warn('[geocoder] Geocoding failed for query:', query, err)
    return null
  }
}
