import { NextRequest, NextResponse } from 'next/server'
import { CITY_COORDINATES } from '@/lib/geo-utils'

// Known pin codes around Maharashtra / MP regions for instant local fallback
const PINCODE_MAP: Record<string, { lat: number; lng: number; name: string }> = {
  '422001': { lat: 19.9975, lng: 73.7898, name: 'Nashik, Maharashtra' },
  '423101': { lat: 20.3268, lng: 74.2389, name: 'Chandwad, Nashik' },
  '422209': { lat: 20.0934, lng: 74.1132, name: 'Niphad, Nashik' },
  '411001': { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
  '400001': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
  '440001': { lat: 21.1458, lng: 79.0882, name: 'Nagpur, Maharashtra' },
  '452001': { lat: 22.7196, lng: 75.8577, name: 'Indore, Madhya Pradesh' },
  '431001': { lat: 19.8762, lng: 75.3433, name: 'Chhatrapati Sambhajinagar' },
  '416001': { lat: 16.7050, lng: 74.2433, name: 'Kolhapur, Maharashtra' },
  '413001': { lat: 17.6599, lng: 75.9064, name: 'Solapur, Maharashtra' },
  '414001': { lat: 19.0948, lng: 74.7480, name: 'Ahmednagar, Maharashtra' },
  '425001': { lat: 21.0077, lng: 75.5626, name: 'Jalgaon, Maharashtra' },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = String(body.query || '').trim()

    if (!query) {
      return NextResponse.json({ error: 'Query or pincode is required' }, { status: 400 })
    }

    const cleanQuery = query.toLowerCase()

    // 1. Direct Pincode Match
    const digitsOnly = query.replace(/\D/g, '')
    if (digitsOnly.length === 6 && PINCODE_MAP[digitsOnly]) {
      const match = PINCODE_MAP[digitsOnly]
      return NextResponse.json({
        success: true,
        source: 'pincode_cache',
        coordinates: { lat: match.lat, lng: match.lng },
        name: match.name,
        pincode: digitsOnly,
      })
    }

    // 2. Direct Known City Match
    for (const [city, coord] of Object.entries(CITY_COORDINATES)) {
      if (cleanQuery.includes(city) || city.includes(cleanQuery)) {
        return NextResponse.json({
          success: true,
          source: 'local_cache',
          coordinates: { lat: coord.lat, lng: coord.lng },
          name: city.charAt(0).toUpperCase() + city.slice(1),
        })
      }
    }

    // 3. Server-side isolated Google Places / Geocoding API if key configured
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (googleApiKey) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query + ', India'
        )}&key=${googleApiKey}`
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          if (data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location
            return NextResponse.json({
              success: true,
              source: 'google_places',
              coordinates: { lat: loc.lat, lng: loc.lng },
              name: data.results[0].formatted_address,
            })
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        console.warn('[Places API] Google Places server fetch timed out or failed:', err?.message)
      }
    }

    // 4. Safe OpenStreetMap Nominatim with strict 8-second timeout
    const nominatimController = new AbortController()
    const nominatimTimeout = setTimeout(() => nominatimController.abort(), 8000)

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + ', India'
      )}&format=json&limit=1`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'KrishiMitra-AgroApp/1.0' },
        signal: nominatimController.signal,
      })
      clearTimeout(nominatimTimeout)

      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          if (!isNaN(lat) && !isNaN(lon)) {
            return NextResponse.json({
              success: true,
              source: 'nominatim',
              coordinates: { lat, lng: lon },
              name: data[0].display_name,
            })
          }
        }
      }
    } catch (err: any) {
      clearTimeout(nominatimTimeout)
      console.warn('[Places API] Nominatim lookup timed out or failed:', err?.message)
    }

    // Default to Pune/Maharashtra center if unmatched
    return NextResponse.json({
      success: true,
      source: 'fallback_center',
      coordinates: { lat: 18.5204, lng: 73.8567 },
      name: query,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Geocoding request failed' }, { status: 500 })
  }
}
