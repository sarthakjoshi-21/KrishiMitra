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

/** Farmer creates a new crop listing */
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
    
    // Instant UI updates via cache revalidation
    revalidatePath('/')
    revalidatePath('/buyer-login')
    revalidatePath('/farmer-login')
    
    return { data: { id: data.id }, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Fetch all active/available crop listings from Supabase with location matching & prioritization */
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

    const explicitLocation = filters?.location && filters.location !== 'All regions' ? filters.location : null
    const targetLocation = explicitLocation || (filters?.matchBuyerLocation ? buyerLocation : null)

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
    if (targetLocation && targetLocation !== 'All regions') {
      query = query.ilike('location', `%${targetLocation}%`)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message, buyerLocation }

    let lots = (data || []) as any[]

    // If no strict location filter was applied, prioritize crops matching the buyer's location at the top
    if (!targetLocation && buyerLocation) {
      const bLoc = buyerLocation.toLowerCase()
      lots = [...lots].sort((a, b) => {
        const aLoc = (a.location || '').toLowerCase()
        const aFarmerLoc = (a.farmer?.location || '').toLowerCase()
        const aMatch = aLoc.includes(bLoc) || aFarmerLoc.includes(bLoc) ? 1 : 0

        const bLocStr = (b.location || '').toLowerCase()
        const bFarmerLoc = (b.farmer?.location || '').toLowerCase()
        const bMatch = bLocStr.includes(bLoc) || bFarmerLoc.includes(bLoc) ? 1 : 0

        return bMatch - aMatch
      })
    }

    return { data: lots, error: null, buyerLocation }
  } catch (err) {
    return { data: null, error: String(err), buyerLocation: null }
  }
}

/** Backward-compatible alias for getAvailableCrops */
export const getActiveCrops = getAvailableCrops
export const getCropLots = getAvailableCrops

/** Farmer: get their own listings with live bids */
export async function getMyListings(): Promise<ActionResult<any[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let farmerId = user?.id
    if (!farmerId) {
      const { data: farmerUser } = await (supabase.from('users') as any)
        .select('id')
        .eq('role', 'farmer')
        .limit(1)
        .maybeSingle()
      farmerId = farmerUser?.id
    }

    if (!farmerId) return { data: null, error: 'Not authenticated' }

    const { data, error } = await (supabase
      .from('crop_lots') as any)
      .select(`
        *,
        bids (
          id,
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

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
