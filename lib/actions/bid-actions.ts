'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Bid, BidStatus } from '@/types/database'

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

/** Buyer places a new bid on a crop lot */
export async function placeBid(
  lotIdOrInput: string | { lot_id: string; bid_price_per_kg?: number; bid_price_per_quintal?: number; [key: string]: any },
  bidPricePerKgParam?: number
): Promise<ActionResult<{ id: string; total_bid_amount: number }>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let buyerId = user?.id
    if (!buyerId) {
      // Fallback in demo mode to find a registered buyer
      const { data: buyerUser } = await (supabase.from('users') as any)
        .select('id')
        .eq('role', 'buyer')
        .limit(1)
        .maybeSingle()
      buyerId = buyerUser?.id
    }

    if (!buyerId) return { data: null, error: 'Not authenticated. Please log in.' }

    let lotId: string
    let bidPricePerKg: number

    if (typeof lotIdOrInput === 'string') {
      lotId = lotIdOrInput
      bidPricePerKg = Number(bidPricePerKgParam || 0)
    } else {
      lotId = lotIdOrInput.lot_id
      if (lotIdOrInput.bid_price_per_kg !== undefined) {
        bidPricePerKg = Number(lotIdOrInput.bid_price_per_kg)
      } else if (lotIdOrInput.bid_price_per_quintal !== undefined) {
        bidPricePerKg = Number((lotIdOrInput.bid_price_per_quintal / 100).toFixed(2))
      } else {
        bidPricePerKg = 0
      }
    }

    if (!lotId) return { data: null, error: 'Crop lot ID is required.' }
    if (!bidPricePerKg || bidPricePerKg <= 0) return { data: null, error: 'Bid price per kg must be greater than 0.' }

    // Fetch the available quantity & details from crop_lots to calculate total_bid_amount
    const { data: lot, error: lotError } = await (supabase
      .from('crop_lots') as any)
      .select('id, crop_name, farmer_id, quantity_quintal, asking_price_per_quintal')
      .eq('id', lotId)
      .single()

    if (lotError || !lot) {
      return { data: null, error: lotError?.message || 'Crop lot not found.' }
    }

    // 1 Quintal = 100 kg
    const totalQuantityKg = Number(lot.quantity_quintal || 1) * 100
    const totalBidAmount = Number((bidPricePerKg * totalQuantityKg).toFixed(2))

    // Insert the record into public.bids
    const { data, error } = await (supabase
      .from('bids') as any)
      .insert({
        lot_id: lotId,
        buyer_id: buyerId,
        bid_price_per_kg: bidPricePerKg,
        total_bid_amount: totalBidAmount,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) return { data: null, error: error.message }

    // Notify the farmer about the new bid
    if (lot?.farmer_id) {
      const { data: buyerProfile } = await (supabase.from('users') as any)
        .select('full_name')
        .eq('id', buyerId)
        .maybeSingle()
      const buyerName = buyerProfile?.full_name || 'A buyer'
      const notificationMsg = `New bid received for your ${lot.crop_name || 'crop'} lot! (₹${bidPricePerKg.toFixed(2)}/kg · Total: ₹${totalBidAmount.toLocaleString('en-IN')} by ${buyerName})`

      try {
        await (supabase.from('notifications') as any).insert({
          user_id: lot.farmer_id,
          message: notificationMsg,
          is_read: false,
        })
      } catch (notifErr) {
        console.warn('Farmer notification insert skipped:', notifErr)
      }
    }

    // Simultaneous live bidding sync: Revalidate layout and routes so Farmer and Buyer see new bids immediately
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/buyer-login')
    revalidatePath('/farmer-login')

    return { data: { id: data.id, total_bid_amount: totalBidAmount }, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Get all bids for a specific lot, ordered by bid_price_per_kg descending */
export async function getBidsForLot(lotId: string): Promise<ActionResult<Bid[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await (supabase
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
          email,
          location
        )
      `)
      .eq('lot_id', lotId)
      .order('bid_price_per_kg', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data: (data as Bid[]) || [], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Farmer: get all bids on their crop lots */
export async function getBidsForFarmer(): Promise<ActionResult<Bid[]>> {
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

    const { data, error } = await (supabase
      .from('bids') as any)
      .select(`
        *,
        lot:crop_lots!lot_id (
          id,
          crop_name,
          quantity_quintal,
          asking_price_per_quintal,
          location,
          grade,
          pesticide_safe_flag,
          farmer_id
        ),
        buyer:users!buyer_id (
          id,
          full_name,
          email,
          location
        )
      `)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }

    const filtered = (data || []).filter((b: any) => !farmerId || b.lot?.farmer_id === farmerId || !b.lot?.farmer_id)
    return { data: filtered as Bid[], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Buyer: get all active and past bids */
export async function getBuyerBids(): Promise<ActionResult<Bid[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let buyerId = user?.id

    if (buyerId) {
      try {
        const { data: buyerBids, error: buyerError } = await (supabase
          .from('bids') as any)
          .select(`
            *,
            lot:crop_lots!lot_id (
              id,
              crop_name,
              quantity_quintal,
              asking_price_per_quintal,
              location,
              grade,
              pesticide_safe_flag,
              farmer_id,
              farmer:users!farmer_id (id, full_name, email, location)
            )
          `)
          .eq('buyer_id', buyerId)
          .order('created_at', { ascending: false })

        if (!buyerError && buyerBids && buyerBids.length > 0) {
          return { data: buyerBids as Bid[], error: null }
        }
      } catch (e) {
        console.warn('Filter by buyerId query failed, using resilient fallback:', e)
      }
    }

    // Resilient fallback: If no bids found for specific buyerId or in guest mode, load all recent bids
    const { data: allBids, error: allError } = await (supabase
      .from('bids') as any)
      .select(`
        *,
        lot:crop_lots!lot_id (
          id,
          crop_name,
          quantity_quintal,
          asking_price_per_quintal,
          location,
          grade,
          pesticide_safe_flag,
          farmer_id,
          farmer:users!farmer_id (id, full_name, email, location)
        )
      `)
      .order('created_at', { ascending: false })

    if (allError) return { data: null, error: allError.message }
    return { data: (allBids as Bid[]) || [], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Backward-compatible alias for getBuyerBids */
export const getBidsForBuyer = getBuyerBids

/** Farmer: accept, reject, or counter a bid */
export async function updateBidStatus(
  bidId: string,
  status: BidStatus,
  counterPrice?: number
): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const updatePayload: Record<string, unknown> = { status }
    if (status === 'counter' && counterPrice) {
      updatePayload.counter_price = counterPrice
    }

    if (status === 'accepted') {
      const { data: bidData } = await (supabase
        .from('bids') as any)
        .select('lot_id, buyer_id, lot:crop_lots!lot_id(crop_name)')
        .eq('id', bidId)
        .single()
        
      if (bidData?.lot_id) {
        // Automatically reject competing pending bids for this lot
        await (supabase
          .from('bids') as any)
          .update({ status: 'rejected' })
          .eq('lot_id', bidData.lot_id)
          .neq('id', bidId)
          .eq('status', 'pending')

        // Mark the crop lot as sold/closed
        await (supabase
          .from('crop_lots') as any)
          .update({ is_live: false })
          .eq('id', bidData.lot_id)

        // Send confirmation notification to the winning buyer
        if (bidData.buyer_id) {
          try {
            await (supabase.from('notifications') as any).insert({
              user_id: bidData.buyer_id,
              message: `Your bid on ${bidData.lot?.crop_name || 'crop lot'} has been ACCEPTED by the farmer! You can proceed with logistics/payment.`,
              is_read: false,
            })
          } catch (notifErr) {
            console.warn('Buyer accept notification failed:', notifErr)
          }
        }
      }
    }

    const { error } = await (supabase
      .from('bids') as any)
      .update(updatePayload)
      .eq('id', bidId)

    if (error) return { data: null, error: error.message }

    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/buyer-login')
    revalidatePath('/farmer-login')

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Farmer: accept a bid (automatically marks as accepted and rejects competing bids) */
export async function acceptBid(bidId: string): Promise<ActionResult> {
  return updateBidStatus(bidId, 'accepted')
}

/** Farmer: reject a bid */
export async function rejectBid(bidId: string): Promise<ActionResult> {
  return updateBidStatus(bidId, 'rejected')
}

/** Buyer: mark bid as paid */
export async function markBidPaid(bidId: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await (supabase
      .from('bids') as any)
      .update({ status: 'paid' })
      .eq('id', bidId)

    if (error) return { data: null, error: error.message }
    revalidatePath('/', 'layout')
    revalidatePath('/')
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
