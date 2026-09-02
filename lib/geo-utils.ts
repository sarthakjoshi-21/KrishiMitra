/**
 * Geolocation, Coordinate Matching, and Haversine Distance Utilities
 * KrishiMitra OpenStreetMap Integration
 */

export interface GeoCoordinate {
  lat: number
  lng: number
}

// Known city/mandi center coordinates across Maharashtra, MP, and major agricultural centers
export const CITY_COORDINATES: Record<string, GeoCoordinate> = {
  pune: { lat: 18.5204, lng: 73.8567 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  sambhajinagar: { lat: 19.8762, lng: 75.3433 },
  kolhapur: { lat: 16.7050, lng: 74.2433 },
  solapur: { lat: 17.6599, lng: 75.9064 },
  satara: { lat: 17.6805, lng: 74.0183 },
  ahmednagar: { lat: 19.0948, lng: 74.7480 },
  jalgaon: { lat: 21.0077, lng: 75.5626 },
  amravati: { lat: 20.9374, lng: 77.7796 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  gwalior: { lat: 26.2183, lng: 78.1828 },
  jabalpur: { lat: 23.1815, lng: 79.9864 },
  ujjain: { lat: 23.1765, lng: 75.7885 },
  maharashtra: { lat: 19.7515, lng: 75.7139 },
  'madhya pradesh': { lat: 22.9734, lng: 78.6569 },
}

export const DEFAULT_CENTER: GeoCoordinate = { lat: 18.5204, lng: 73.8567 } // Pune

/**
 * Deterministic small jitter based on string id to prevent multiple pins in the exact same city from overlapping completely
 */
function getDeterministicJitter(seed: string): { latJitter: number; lngJitter: number } {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const latJitter = ((hash % 100) / 100 - 0.5) * 0.04
  const lngJitter = ((((hash >> 3) % 100) / 100) - 0.5) * 0.04
  return { latJitter, lngJitter }
}

/**
 * Resolves coordinate for a crop lot or user location string
 */
export function getCoordinatesForLocation(
  locationString?: string | null,
  explicitLat?: number | null,
  explicitLng?: number | null,
  seedId?: string
): GeoCoordinate {
  if (
    explicitLat !== undefined &&
    explicitLat !== null &&
    !isNaN(Number(explicitLat)) &&
    explicitLng !== undefined &&
    explicitLng !== null &&
    !isNaN(Number(explicitLng)) &&
    (Number(explicitLat) !== 0 || Number(explicitLng) !== 0)
  ) {
    return { lat: Number(explicitLat), lng: Number(explicitLng) }
  }

  if (!locationString) return DEFAULT_CENTER

  const lower = locationString.toLowerCase()
  for (const [city, coord] of Object.entries(CITY_COORDINATES)) {
    if (lower.includes(city)) {
      if (seedId) {
        const { latJitter, lngJitter } = getDeterministicJitter(seedId)
        return { lat: coord.lat + latJitter, lng: coord.lng + lngJitter }
      }
      return coord
    }
  }

  if (seedId) {
    const { latJitter, lngJitter } = getDeterministicJitter(seedId)
    return { lat: DEFAULT_CENTER.lat + latJitter, lng: DEFAULT_CENTER.lng + lngJitter }
  }

  return DEFAULT_CENTER
}

/**
 * Haversine formula calculation for great-circle distance between two points on Earth (in km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0

  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Number(distance.toFixed(1))
}

/**
 * Formats a distance in km for human readability
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000)
    return `${meters} m away`
  }
  return `${distanceKm.toFixed(1)} km away`
}

/**
 * Captures the current user's GPS coordinates using navigator.geolocation
 */
export async function getCurrentUserPosition(): Promise<GeoCoordinate | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(7)),
          lng: Number(position.coords.longitude.toFixed(7)),
        })
      },
      (error) => {
        console.warn('[getCurrentUserPosition] Geolocation request rejected/failed:', error.message)
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    )
  })
}
