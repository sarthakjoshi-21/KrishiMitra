'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BidStatus } from '@/types/database'

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

/** Buyer places a new bid on a crop lot */
export async function placeBid(input: {
  lot_id: string
  bid_price_per_quintal: number
  preferred_delivery_date?: string
  transport_preference?: 'seller_delivery' | 'self_pickup'
}): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated. Please log in.' }

    const { data, error } = await (supabase
      .from('bids') as any)
      .insert({
        lot_id: input.lot_id,
        buyer_id: user.id,
        bid_price_per_quintal: input.bid_price_per_quintal,
        preferred_delivery_date: input.preferred_delivery_date ?? null,
        transport_preference: input.transport_preference ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/')
    return { data: { id: data.id }, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Farmer: get all bids on their crop lots */
export async function getBidsForFarmer() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error } = await (supabase
      .from('bids') as any)
      .select(`
        *,
        lot:crop_lots!lot_id(id, crop_name, quantity_quintal, location, grade, pesticide_safe_flag),
        buyer:users!buyer_id(id, full_name, location)
      `)
      .eq('lot.farmer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Buyer: get all their own bids */
export async function getBidsForBuyer() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error } = await (supabase
      .from('bids') as any)
      .select(`
        *,
        lot:crop_lots!lot_id(id, crop_name, quantity_quintal, location, grade, farmer_id,
          farmer:users!farmer_id(id, full_name))
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Farmer: accept, reject, or counter a bid */
export async function updateBidStatus(
  bidId: string,
  status: BidStatus,
  counterPrice?: number
): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const updatePayload: Record<string, unknown> = { status }
    if (status === 'counter' && counterPrice) {
      updatePayload.counter_price = counterPrice
    }

    const { error } = await (supabase
      .from('bids') as any)
      .update(updatePayload)
      .eq('id', bidId)

    if (error) return { data: null, error: error.message }
    revalidatePath('/')
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Buyer: mark bid as paid (mock checkout confirmation) */
export async function markBidPaid(bidId: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await (supabase
      .from('bids') as any)
      .update({ status: 'paid' })
      .eq('id', bidId)

    if (error) return { data: null, error: error.message }
    revalidatePath('/')
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
