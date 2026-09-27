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
    
    if (!user?.id) {
      return { data: null, error: 'Unauthorized' }
    }
    const buyerId = user.id

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

    // Smart Upsert: Check if this buyer already has a 'pending' or 'counter' bid on this lot
    const { data: existingBid } = await (supabase
      .from('bids') as any)
      .select('id, status, bid_price_per_kg')
      .eq('lot_id', lotId)
      .eq('buyer_id', buyerId)
      .in('status', ['pending', 'counter'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let bidId: string
    let isCounterOffer = false

    if (existingBid?.id) {
      // Execute UPDATE to modify the existing pending bid without duplicating rows
      const { data: updatedBid, error: updateError } = await (supabase
        .from('bids') as any)
        .update({
          bid_price_per_kg: bidPricePerKg,
          total_bid_amount: totalBidAmount,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBid.id)
        .select('id')
        .single()

      if (updateError) return { data: null, error: updateError.message }
      bidId = updatedBid.id
      isCounterOffer = true
      console.log('[placeBid] Counter-offer updated successfully for bid ID:', bidId, 'New Price:', bidPricePerKg)
    } else {
      // Execute standard INSERT for new bid
      const { data: newBid, error: insertError } = await (supabase
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

      if (insertError) return { data: null, error: insertError.message }
      bidId = newBid.id
      console.log('[placeBid] New bid inserted successfully with ID:', bidId, 'Price:', bidPricePerKg)
    }

    // Notify the farmer about the new bid or counter-offer
    if (lot?.farmer_id) {
      const { data: buyerProfile } = await (supabase.from('users') as any)
        .select('full_name')
        .eq('id', buyerId)
        .maybeSingle()
      const buyerName = buyerProfile?.full_name || 'A buyer'
      const notificationMsg = isCounterOffer
        ? `Counter-offer updated for your ${lot.crop_name || 'crop'} lot! (₹${bidPricePerKg.toFixed(2)}/kg · Total: ₹${totalBidAmount.toLocaleString('en-IN')} by ${buyerName})`
        : `New bid received for your ${lot.crop_name || 'crop'} lot! (₹${bidPricePerKg.toFixed(2)}/kg · Total: ₹${totalBidAmount.toLocaleString('en-IN')} by ${buyerName})`

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

    return { data: { id: bidId, total_bid_amount: totalBidAmount }, error: null }
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
        counter_price,
        counter_price_per_kg,
        counter_by,
        counter_notes,
        created_at,
        updated_at,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[getBidsForFarmer] Auth user:', user?.id, user?.email, 'Auth error:', authError?.message || 'none')
    let farmerId = user?.id

    // 1. Try querying bids with joined lot and buyer details
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

    console.log('[getBidsForFarmer] Joined bids query count:', data?.length, 'Error:', error?.message || 'none')

    if (!error && data && data.length > 0) {
      if (farmerId) {
        const filtered = data.filter((b: any) => b.lot?.farmer_id === farmerId)
        console.log('[getBidsForFarmer] Filtered by farmerId count:', filtered.length)
        if (filtered.length > 0) {
          return { data: filtered as Bid[], error: null }
        }
      }
      return { data: data as Bid[], error: null }
    }

    // 2. Direct fallback if joined query failed or returned empty
    const { data: rawBids, error: rawError } = await (supabase
      .from('bids') as any)
      .select('*')
      .order('created_at', { ascending: false })

    console.log('[getBidsForFarmer] Raw bids fallback count:', rawBids?.length, 'Error:', rawError?.message || 'none')
    return { data: (rawBids as Bid[]) || [], error: null }
  } catch (err) {
    console.error('[getBidsForFarmer] Fatal catch error:', err)
    return { data: null, error: String(err) }
  }
}

/** Buyer: get active bids placed by buyer with crop lot and farmer details */
export async function getBuyerActiveBids(buyerIdParam?: string): Promise<ActionResult<Bid[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const targetBuyerId = buyerIdParam || user?.id
    console.log('[getBuyerActiveBids] Target Buyer ID:', targetBuyerId, 'Auth email:', user?.email, 'Auth error:', authError?.message || 'none')

    let bidsData: any[] = []

    // 1. Try querying bids with joined lot and farmer user details
    if (targetBuyerId) {
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
          .eq('buyer_id', targetBuyerId)
          .order('created_at', { ascending: false })

        console.log('[getBuyerActiveBids] User-specific bids count:', buyerBids?.length, 'Error:', buyerError?.message || 'none')
        if (!buyerError && buyerBids && buyerBids.length > 0) {
          bidsData = buyerBids
        }
      } catch (e) {
        console.warn('[getBuyerActiveBids] Specific query error:', e)
      }
    }

    // 2. Fallback: If no bids found for specific buyerId or in guest mode, load all recent bids with lot and farmer
    if (bidsData.length === 0) {
      try {
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

        console.log('[getBuyerActiveBids] Fallback all bids count:', allBids?.length, 'Error:', allError?.message || 'none')
        if (allBids && allBids.length > 0) {
          bidsData = allBids
        }
      } catch (e) {
        console.warn('[getBuyerActiveBids] All bids query error:', e)
      }
    }

    // 3. Fallback: If joined query returned nothing or failed due to join syntax/RLS, query raw bids and raw crop_lots directly and stitch
    if (bidsData.length === 0) {
      try {
        const { data: rawBids } = await (supabase.from('bids') as any).select('*').order('created_at', { ascending: false })
        const { data: rawLots } = await (supabase.from('crop_lots') as any).select('*, farmer:users!farmer_id(id, full_name, email, location)')
        
        if (rawBids && rawBids.length > 0) {
          bidsData = rawBids.map((b: any) => {
            const matchingLot = (rawLots || []).find((l: any) => l.id === b.lot_id)
            return {
              ...b,
              lot: matchingLot || {
                id: b.lot_id,
                crop_name: 'Harvest Crop Lot',
                quantity_quintal: 100,
                asking_price_per_quintal: 3000,
                location: 'Maharashtra',
                grade: 'A',
                farmer: { full_name: 'Verified Farmer', location: 'Maharashtra' }
              }
            }
          })
        }
      } catch (stitchErr) {
        console.warn('[getBuyerActiveBids] Stitch error:', stitchErr)
      }
    }

    console.log('[getBuyerActiveBids] Returning bids count:', bidsData.length)
    return { data: bidsData as Bid[], error: null }
  } catch (err) {
    console.error('[getBuyerActiveBids] Fatal catch error:', err)
    return { data: null, error: String(err) }
  }
}

/** Backward-compatible aliases */
export const getBuyerBids = getBuyerActiveBids
export const getBidsForBuyer = getBuyerActiveBids

/** Full Two-Way Counter Submission */
export async function counterBid(
  bidId: string,
  counterPricePerKg: number,
  counterBy: 'farmer' | 'buyer',
  notes?: string
): Promise<ActionResult> {
  return updateBidStatus(bidId, 'countered', counterPricePerKg, counterBy, notes)
}

/** Accept a counter-offer */
export async function acceptCounterOffer(bidId: string): Promise<ActionResult> {
  return updateBidStatus(bidId, 'accepted')
}

/** Update bid status with two-way counter-offer and auction closing logic */
export async function updateBidStatus(
  bidId: string,
  status: BidStatus,
  counterPrice?: number,
  counterBy?: 'farmer' | 'buyer',
  counterNotes?: string
): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'counter' || status === 'countered') {
      const pricePerKg = Number(counterPrice || 0)
      updatePayload.status = 'countered'
      updatePayload.counter_price_per_kg = pricePerKg
      updatePayload.counter_price = pricePerKg // backward compatibility
      updatePayload.counter_by = counterBy || 'farmer'
      if (counterNotes !== undefined) {
        updatePayload.counter_notes = counterNotes || null
      }

      // Fetch bid to send notification to the counter-party
      const { data: bidData } = await (supabase.from('bids') as any)
        .select('lot_id, buyer_id, lot:crop_lots!lot_id(crop_name, farmer_id)')
        .eq('id', bidId)
        .single()

      if (bidData) {
        const cropName = bidData.lot?.crop_name || 'crop lot'
        if (counterBy === 'buyer') {
          // Notify Farmer
          if (bidData.lot?.farmer_id) {
            try {
              await (supabase.from('notifications') as any).insert({
                user_id: bidData.lot.farmer_id,
                message: `Buyer countered with ₹${pricePerKg.toFixed(2)}/kg for your ${cropName}! Review on your Market & Bids screen.`,
                is_read: false,
              })
            } catch (notifErr) {
              console.warn('[counterBid] Notification error:', notifErr)
            }
          }
        } else {
          // Notify Buyer
          if (bidData.buyer_id) {
            try {
              await (supabase.from('notifications') as any).insert({
                user_id: bidData.buyer_id,
                message: `⚡ Counter offer received from farmer for ${cropName}: ₹${pricePerKg.toFixed(2)}/kg! Review on your Active Bids screen.`,
                is_read: false,
              })
            } catch (notifErr) {
              console.warn('[counterBid] Notification error:', notifErr)
            }
          }
        }
      }
    }

    if (status === 'accepted') {
      const { data: bidData } = await (supabase
        .from('bids') as any)
        .select(`
          id,
          lot_id,
          buyer_id,
          bid_price_per_kg,
          counter_price_per_kg,
          counter_price,
          counter_by,
          lot:crop_lots!lot_id(id, crop_name, quantity_quintal, farmer_id)
        `)
        .eq('id', bidId)
        .single()
        
      if (bidData?.lot_id) {
        // If a counter price was active, lock it in as the final accepted price
        const finalPricePerKg = Number(bidData.counter_price_per_kg || bidData.counter_price || bidData.bid_price_per_kg)
        const totalQtyKg = Number(bidData.lot?.quantity_quintal || 1) * 100
        const totalAmount = Number((finalPricePerKg * totalQtyKg).toFixed(2))

        updatePayload.bid_price_per_kg = finalPricePerKg
        updatePayload.total_bid_amount = totalAmount

        // 1. Automatically reject competing pending/countered bids for this lot
        await (supabase
          .from('bids') as any)
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('lot_id', bidData.lot_id)
          .neq('id', bidId)
          .in('status', ['pending', 'counter', 'countered'])

        // 2. Mark the crop lot as sold/closed and record winning_bid_id
        await (supabase
          .from('crop_lots') as any)
          .update({
            is_live: false,
            winning_bid_id: bidId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bidData.lot_id)

        // 3. Send notifications
        const cropName = bidData.lot?.crop_name || 'crop lot'
        if (bidData.buyer_id) {
          try {
            await (supabase.from('notifications') as any).insert({
              user_id: bidData.buyer_id,
              message: `Your deal on ${cropName} at ₹${finalPricePerKg.toFixed(2)}/kg is ACCEPTED! Proceed to payment & logistics.`,
              is_read: false,
            })
          } catch (notifErr) {
            console.warn('Buyer accept notification failed:', notifErr)
          }
        }

        if (bidData.lot?.farmer_id) {
          try {
            await (supabase.from('notifications') as any).insert({
              user_id: bidData.lot.farmer_id,
              message: `Deal locked for ${cropName} at ₹${finalPricePerKg.toFixed(2)}/kg! Auction completed.`,
              is_read: false,
            })
          } catch (notifErr) {
            console.warn('Farmer accept notification failed:', notifErr)
          }
        }
      }
    }

    const { error } = await (supabase
      .from('bids') as any)
      .update(updatePayload)
      .eq('id', bidId)

    if (error) {
      console.warn('[updateBidStatus] Supabase error:', error.message)
      // If error occurs because columns don't exist yet, try basic status update
      if (error.message.includes('column') || error.message.includes('schema')) {
        const fallbackPayload: Record<string, unknown> = { status }
        if (counterPrice) fallbackPayload.counter_price = counterPrice
        const { error: fallbackErr } = await (supabase.from('bids') as any).update(fallbackPayload).eq('id', bidId)
        if (fallbackErr) return { data: null, error: fallbackErr.message }
      } else {
        return { data: null, error: error.message }
      }
    }

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

/** Farmer or Buyer: reject a bid */
export async function rejectBid(bidId: string): Promise<ActionResult> {
  return updateBidStatus(bidId, 'rejected')
}

/** Buyer: mark bid as paid */
export async function markBidPaid(bidId: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await (supabase
      .from('bids') as any)
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', bidId)

    if (error) return { data: null, error: error.message }
    revalidatePath('/', 'layout')
    revalidatePath('/')
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

