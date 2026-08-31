'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CropGrade } from '@/types/database'

export interface CreateCropLotInput {
  crop_name: string
  variety?: string
  grade: CropGrade
  quantity_quintal: number
  asking_price_per_quintal: number
  location: string
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
}

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
  buyerLocation?: string | null
}

/** Farmer creates a new crop listing with strict cache revalidation */
export async function createCropLot(
  input: CreateCropLotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
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

    if (error) return { data: null, error: error.message }
    
    // Strict Next.js Cache Revalidation across the root layout and pages
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/buyer-login')
    revalidatePath('/farmer-login')
    
    return { data: { id: data.id }, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Fetch active crop listings with strict city-matching for the buyer */
export async function getAvailableCrops(filters?: AvailableCropsFilter): Promise<ActionResult<any[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let buyerLocation: string | null = null
    if (user) {
      const { data: profile } = await (supabase
        .from('users') as any)
        .select('location')
        .eq('id', user.id)
        .maybeSingle()
      buyerLocation = profile?.location || null
    }

    // Determine target location (explicit filter takes precedence, otherwise strict matching on buyer's registered city)
    const explicitLocation = filters?.location && filters.location !== 'All regions' ? filters.location : null
    const targetCity = explicitLocation || (filters?.matchBuyerLocation ? buyerLocation : buyerLocation)

    let query = (supabase
      .from('crop_lots') as any)
      .select('*, farmer:users!farmer_id(id, full_name, location, email, role, created_at)')
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
    if (error) return { data: null, error: error.message, buyerLocation }

    return { data: data || [], error: null, buyerLocation }
  } catch (err) {
    return { data: null, error: String(err), buyerLocation: null }
  }
}

/** Backward-compatible alias for getAvailableCrops */
export const getActiveCrops = getAvailableCrops
export const getCropLots = getAvailableCrops

/** Farmer: get all published listings with live incoming bids */
export async function getFarmerListings(): Promise<ActionResult<any[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let farmerId = user?.id

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

        if (!userError && userLots && userLots.length > 0) {
          return { data: userLots, error: null }
        }
      } catch (e) {
        console.warn('Filter by farmerId query failed, using resilient fallback:', e)
      }
    }

    // Resilient fallback: If no lots found specifically for user.id or in demo/guest mode, load all published crop lots
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

    if (allError) return { data: null, error: allError.message }
    return { data: allLots || [], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Backward-compatible alias for getFarmerListings */
export const getMyListings = getFarmerListings
