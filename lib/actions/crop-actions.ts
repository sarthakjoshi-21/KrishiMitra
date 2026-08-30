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

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

/** Farmer creates a new crop listing */
export async function createCropLot(
  input: CreateCropLotInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated. Please log in.' }

    const { data, error } = await (supabase
      .from('crop_lots') as any)
      .insert({
        farmer_id: user.id,
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
    revalidatePath('/') // Refresh server cache so buyer marketplace updates
    return { data: { id: data.id }, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Fetch all live crop lots (buyer marketplace) */
export async function getCropLots(filters?: {
  search?: string
  safeOnly?: boolean
  grade?: string
}) {
  try {
    const supabase = await getSupabaseServerClient()
    let query = (supabase
      .from('crop_lots') as any)
      .select('*, farmer:users!farmer_id(id, full_name, location)')
      .eq('is_live', true)
      .order('created_at', { ascending: false })

    if (filters?.safeOnly) query = query.eq('pesticide_safe_flag', true)
    if (filters?.grade && filters.grade !== 'Any quality grade') {
      query = query.eq('grade', filters.grade.replace('Grade ', ''))
    }
    if (filters?.search) {
      query = query.ilike('crop_name', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Farmer: get their own listings with bid counts */
export async function getMyListings() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error } = await (supabase
      .from('crop_lots') as any)
      .select('*, bids(count)')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
