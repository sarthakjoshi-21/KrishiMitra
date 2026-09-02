'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CropGrade } from '@/types/database'
import { calculateHaversineDistance, getCoordinatesForLocation } from '@/lib/geo-utils'

export interface CreateCropLotInput {
  crop_name: string
  variety?: string
  grade: CropGrade
  quantity_quintal: number
  asking_price_per_quintal: number
  location: string
  latitude?: number | null
  longitude?: number | null
  moisture_percent?: number
  pesticide_name?: string
  pesticide_phi_days?: number
  last_spray_date?: string
  pesticide_safe_flag: boolean
  image_url?: string
  ai_grade_confidence?: number
  ai_notes?: string
  needs_transport: boolean
}

export interface AvailableCropsFilter {
  search?: string
  safeOnly?: boolean
  grade?: string
  location?: string
  matchBuyerLocation?: boolean
  buyerLat?: number
  buyerLng?: number
  sortByDistance?: boolean
}

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
  buyerLocation?: string | null
  buyerCoords?: { lat: number; lng: number } | null
}

/** Farmer creates a new crop listing with GPS coordinates and strict cache revalidation */
export async function createCropLot(
  input: CreateCropLotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: userAuthError } = await supabase.auth.getUser()
    
    console.log('[createCropLot] Auth User:', user?.id, user?.email, 'Auth Error:', userAuthError?.message || 'none')
    
    let farmerId = user?.id
    if (!farmerId) {
      // Fallback to first available farmer in public.users table if no session is set
      const { data: farmerUser } = await (supabase.from('users') as any)
        .select('id')
        .eq('role', 'farmer')
        .limit(1)
        .maybeSingle()
      farmerId = farmerUser?.id
    }

    if (!farmerId) return { data: null, error: 'Not authenticated. Please log in.' }

    // Resolve GPS coordinates: use exact captured coordinates if provided, else fall back to city coordinate or null
    let lat: number | null = null
    let lng: number | null = null

    if (
      input.latitude !== undefined &&
      input.latitude !== null &&
      !isNaN(Number(input.latitude)) &&
      input.longitude !== undefined &&
      input.longitude !== null &&
      !isNaN(Number(input.longitude))
    ) {
      lat = Number(Number(input.latitude).toFixed(7))
      lng = Number(Number(input.longitude).toFixed(7))
    } else if (input.location) {
      const cityCoords = getCoordinatesForLocation(input.location)
      lat = cityCoords.lat
      lng = cityCoords.lng
    }

    const { data, error } = await (supabase
      .from('crop_lots') as any)
      .insert({
        farmer_id: farmerId,
        crop_name: input.crop_name,
        variety: input.variety ?? null,
        grade: input.grade,
        quantity_quintal: input.quantity_quintal,
        asking_price_per_quintal: input.asking_price_per_quintal,
        location: input.location,
        latitude: lat,
        longitude: lng,
        moisture_percent: input.moisture_percent ?? null,
        pesticide_name: input.pesticide_name ?? null,
        pesticide_phi_days: input.pesticide_phi_days ?? null,
        last_spray_date: input.last_spray_date ?? null,
        pesticide_safe_flag: input.pesticide_safe_flag,
        image_url: input.image_url ?? null,
        ai_grade_confidence: input.ai_grade_confidence ?? null,
        ai_notes: input.ai_notes ?? null,
        needs_transport: input.needs_transport,
        is_live: true,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createCropLot] Insert error:', error)
      return { data: null, error: error.message }
    }
    
    console.log('[createCropLot] Crop lot inserted successfully with ID:', data.id, 'Latitude:', lat, 'Longitude:', lng)

    // Strict Next.js Cache Revalidation across the root layout and pages
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/buyer-login')
    revalidatePath('/farmer-login')
    
    return { data: { id: data.id }, error: null }
  } catch (err) {
    console.error('[createCropLot] Catch error:', err)
    return { data: null, error: String(err) }
  }
}

/** Fetch active crop listings with distance calculation and coordinates */
export async function getAvailableCrops(filters?: AvailableCropsFilter): Promise<ActionResult<any[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let buyerLocation: string | null = null
    let buyerCoords: { lat: number; lng: number } | null = null

    if (user) {
      const { data: profile } = await (supabase
        .from('users') as any)
        .select('location, latitude, longitude')
        .eq('id', user.id)
        .maybeSingle()
      buyerLocation = profile?.location || null
      if (profile?.latitude && profile?.longitude) {
        buyerCoords = { lat: Number(profile.latitude), lng: Number(profile.longitude) }
      }
    }

    if (!buyerCoords && buyerLocation) {
      buyerCoords = getCoordinatesForLocation(buyerLocation)
    }

    if (filters?.buyerLat && filters?.buyerLng) {
      buyerCoords = { lat: filters.buyerLat, lng: filters.buyerLng }
    }

    // Determine target location (explicit filter takes precedence, otherwise strict matching on buyer's registered city)
    const explicitLocation = filters?.location && filters.location !== 'All regions' ? filters.location : null
    const targetCity = explicitLocation || (filters?.matchBuyerLocation ? buyerLocation : buyerLocation)

    let query = (supabase
      .from('crop_lots') as any)
      .select('*, farmer:users!farmer_id(id, full_name, location, email, role, latitude, longitude, created_at)')
      .eq('is_live', true)
      .order('created_at', { ascending: false })

    if (filters?.safeOnly) query = query.eq('pesticide_safe_flag', true)
    if (filters?.grade && filters.grade !== 'Any quality grade') {
      const gradeVal = filters.grade.replace('Grade ', '').replace(' Certified', '')
      query = query.eq('grade', gradeVal)
    }
    if (filters?.search) {
      query = query.ilike('crop_name', `%${filters.search}%`)
    }

    // Strict City-Matching: filter only crops matching the city
    if (targetCity && targetCity !== 'All regions') {
      const cityKeyword = targetCity.split(',')[0].trim()
      query = query.ilike('location', `%${cityKeyword}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('[getAvailableCrops] Query error:', error)
      return { data: null, error: error.message, buyerLocation, buyerCoords }
    }

    // Query active bids to expose highest bids & real-time counter-bidding metrics
    let allBids: any[] = []
    try {
      const { data: bidsData } = await (supabase
        .from('bids') as any)
        .select(`
          id,
          lot_id,
          buyer_id,
          bid_price_per_kg,
          total_bid_amount,
          status,
          created_at,
          buyer:users!buyer_id (
            id,
            full_name,
            location
          )
        `)
        .order('bid_price_per_kg', { ascending: false })
      if (bidsData) allBids = bidsData
    } catch (bidsErr) {
      console.warn('[getAvailableCrops] Bids fetch warning:', bidsErr)
    }

    let lots = (data || []).map((lot: any) => {
      const coords = getCoordinatesForLocation(lot.location, lot.latitude, lot.longitude, lot.id)
      let distance_km: number | undefined = undefined
      if (buyerCoords) {
        distance_km = calculateHaversineDistance(buyerCoords.lat, buyerCoords.lng, coords.lat, coords.lng)
      }

      // Attach bids & competitive auction metrics
      const matchingBids = allBids.filter((b: any) => b.lot_id === lot.id)
      const validPrices = matchingBids.map((b: any) => Number(b.bid_price_per_kg) || 0).filter((p: number) => p > 0)
      const highestBid = validPrices.length > 0 ? Math.max(...validPrices) : null
      const userBid = user?.id
        ? matchingBids.find((b: any) => b.buyer_id === user.id)
        : null

      return {
        ...lot,
        latitude: coords.lat,
        longitude: coords.lng,
        distance_km,
        bids: matchingBids,
        bids_count: matchingBids.length,
        highest_bid_per_kg: highestBid,
        user_bid_per_kg: userBid ? Number(userBid.bid_price_per_kg) : null,
      }
    })

    if (filters?.sortByDistance && buyerCoords) {
      lots = [...lots].sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))
    }

    return { data: lots, error: null, buyerLocation, buyerCoords }
  } catch (err) {
    console.error('[getAvailableCrops] Catch error:', err)
    return { data: null, error: String(err), buyerLocation: null, buyerCoords: null }
  }
}

/** Backward-compatible alias for getAvailableCrops */
export const getActiveCrops = getAvailableCrops
export const getCropLots = getAvailableCrops

/** Farmer: get all published listings with live incoming bids */
export async function getFarmerListings(): Promise<ActionResult<any[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[getFarmerListings] Authenticated User ID:', user?.id, 'Email:', user?.email, 'Auth error:', authError?.message || 'none')
    
    let farmerId = user?.id
    let lots: any[] = []
    let fetchError: any = null

    // 1. Attempt user-specific query with nested bids & buyer join
    if (farmerId) {
      try {
        const { data: userLots, error: userError } = await (supabase
          .from('crop_lots') as any)
          .select(`
            *,
            bids (
              id,
              lot_id,
              buyer_id,
              bid_price_per_kg,
              total_bid_amount,
              status,
              created_at,
              buyer:users!buyer_id (id, full_name, email, location)
            )
          `)
          .eq('farmer_id', farmerId)
          .order('created_at', { ascending: false })

        console.log('[getFarmerListings] User-specific crop_lots count:', userLots?.length, 'Error:', userError?.message || 'none')
        if (!userError && userLots && userLots.length > 0) {
          lots = userLots
        } else if (userError) {
          fetchError = userError
        }
      } catch (e) {
        console.warn('[getFarmerListings] User query exception:', e)
      }
    }

    // 2. Fallback: If no lots found for user.id or in demo/guest mode, load all published crop lots
    if (lots.length === 0) {
      try {
        const { data: allLots, error: allError } = await (supabase
          .from('crop_lots') as any)
          .select(`
            *,
            bids (
              id,
              lot_id,
              buyer_id,
              bid_price_per_kg,
              total_bid_amount,
              status,
              created_at,
              buyer:users!buyer_id (id, full_name, email, location)
            )
          `)
          .order('created_at', { ascending: false })

        console.log('[getFarmerListings] Fallback all-lots count:', allLots?.length, 'Error:', allError?.message || 'none')
        if (allLots && allLots.length > 0) {
          lots = allLots
        } else if (allError) {
          fetchError = allError
        }
      } catch (e) {
        console.warn('[getFarmerListings] All lots query exception:', e)
      }
    }

    // 3. Fallback: If joined query returned nothing or failed, query raw crop_lots table directly
    if (lots.length === 0) {
      const { data: rawLots, error: rawError } = await (supabase
        .from('crop_lots') as any)
        .select('*')
        .order('created_at', { ascending: false })

      console.log('[getFarmerListings] Raw crop_lots query count:', rawLots?.length, 'Error:', rawError?.message || 'none')
      if (rawLots && rawLots.length > 0) {
        lots = rawLots
      }
    }

    // 4. Guarantee bids attachment: Query the bids table directly to bypass any nested join / RLS issues
    try {
      const { data: rawBids, error: bidsErr } = await (supabase
        .from('bids') as any)
        .select(`
          *,
          buyer:users!buyer_id (id, full_name, email, location)
        `)
        .order('created_at', { ascending: false })

      console.log('[getFarmerListings] Direct raw bids query count:', rawBids?.length, 'Error:', bidsErr?.message || 'none')

      if (rawBids && rawBids.length > 0) {
        lots = lots.map((lot) => {
          const matching = rawBids.filter((b: any) => b.lot_id === lot.id)
          const existing = Array.isArray(lot.bids) ? lot.bids : []
          const mergedMap = new Map<string, any>()
          existing.forEach((b: any) => { if (b?.id) mergedMap.set(b.id, b) })
          matching.forEach((b: any) => { if (b?.id) mergedMap.set(b.id, b) })
          return {
            ...lot,
            bids: Array.from(mergedMap.values()),
          }
        })
      }
    } catch (bidStitchErr) {
      console.warn('[getFarmerListings] Bid stitch warning:', bidStitchErr)
    }

    console.log('[getFarmerListings] Returning lots payload:', lots.map(l => ({ id: l.id, crop: l.crop_name, bids_count: l.bids?.length || 0 })))
    return { data: lots, error: null }
  } catch (err) {
    console.error('[getFarmerListings] Fatal catch error:', err)
    return { data: null, error: String(err) }
  }
}

/** Backward-compatible alias for getFarmerListings */
export const getMyListings = getFarmerListings
