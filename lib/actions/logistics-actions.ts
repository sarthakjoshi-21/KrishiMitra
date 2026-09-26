'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { calculateHaversineDistance } from '@/lib/geo-utils'
import type { LogisticsRequirement, LogisticsPool, PoolStatus } from '@/types/database'
import {
  estimateCosts,
  TRUCK_CAPACITIES,
  type CostEstimate,
  type ActionResult,
  type CreateLogisticsReqInput,
  type ProposedPool,
} from '@/lib/logistics-utils'


export async function createLogisticsRequirement(
  input: CreateLogisticsReqInput
): Promise<ActionResult<{ id: string }>> {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('createLogisticsRequirement timed out after 8s')), 8000)
  )
  const work = (async (): Promise<{ id: string }> => {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await (supabase.from('logistics_requirements') as any)
      .insert({
        farmer_id: user?.id || null,
        farmer_name: input.farmer_name,
        farmer_phone: input.farmer_phone || null,
        crop: input.crop,
        quantity_quintal: input.quantity_quintal,
        pickup_lat: input.pickup_lat,
        pickup_lng: input.pickup_lng,
        pickup_address: input.pickup_address || null,
        dest_lat: input.dest_lat,
        dest_lng: input.dest_lng,
        dest_address: input.dest_address || null,
        preferred_date_from: input.preferred_date_from,
        preferred_date_to: input.preferred_date_to,
        vehicle_type: input.vehicle_type || 'mini_truck',
        status: 'searching',
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[createLogisticsRequirement] insert warning:', error.message)
      return { id: `local-req-${Date.now()}` }
    }
    return { id: data.id }
  })()

  try {
    const data = await Promise.race([work, timeout])
    return { data, error: null }
  } catch (err: any) {
    console.warn('[createLogisticsRequirement] error:', err?.message)
    return { data: { id: `offline-req-${Date.now()}` }, error: null }
  }
}

// ─── 2. Fetch my requirements ─────────────────────────────────────────────────
export async function getMyLogisticsRequirements(): Promise<ActionResult<LogisticsRequirement[]>> {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('getMyLogisticsRequirements timed out after 8s')), 8000)
  )
  const work = (async (): Promise<LogisticsRequirement[]> => {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await (supabase.from('logistics_requirements') as any)
      .select('*')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[getMyLogisticsRequirements] query warning:', error.message)
      return []
    }
    return (data || []) as LogisticsRequirement[]
  })()

  try {
    const data = await Promise.race([work, timeout])
    return { data, error: null }
  } catch (err: any) {
    return { data: [], error: null }
  }
}



export async function findPoolMatches(
  reqId: string,
  vehicleType?: 'mini_truck' | 'large_truck'
): Promise<ActionResult<ProposedPool>> {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('findPoolMatches timed out after 8s')), 8000)
  )
  const work = (async (): Promise<ProposedPool> => {
    const supabase = await getSupabaseServerClient()

    // Fetch own requirement
    const { data: myData, error: myErr } = await (supabase.from('logistics_requirements') as any)
      .select('*')
      .eq('id', reqId)
      .single()

    if (myErr || !myData) throw new Error('Requirement not found')
    const myReq = myData as LogisticsRequirement

    const truckCap = TRUCK_CAPACITIES[vehicleType || myReq.vehicle_type || 'mini_truck'] ?? 90

    // Call the RPC
    const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)(
      'find_logistics_pools',
      { req_id: reqId, truck_capacity_qt: truckCap }
    )

    const matches = (!rpcErr && Array.isArray(rpcData)) ? rpcData as LogisticsRequirement[] : []

    const costs = estimateCosts(myReq, matches)

    return {
      myRequirement: myReq,
      matches,
      costs,
      poolId: myReq.pool_id || null,
    }
  })()

  try {
    const data = await Promise.race([work, timeout])
    return { data, error: null }
  } catch (err: any) {
    console.warn('[findPoolMatches] error:', err?.message)
    return { data: null, error: err?.message || 'Failed to find pool matches' }
  }
}

// ─── 4. Join pool ─────────────────────────────────────────────────────────────
/**
 * Creates / joins a logistics_pool for a set of requirements.
 * - If no pool exists, creates a new OPEN pool.
 * - Links all requirements to the pool and sets status = 'in_pool'.
 * - If combined load meets ≥80% of capacity, marks pool as CONFIRMED.
 * - On CONFIRMED, creates community_connections between all paired farmers.
 */
export async function joinLogisticsPool(
  myReqId: string,
  matchedReqIds: string[]
): Promise<ActionResult<{ poolId: string; poolStatus: PoolStatus }>> {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('joinLogisticsPool timed out after 8s')), 8000)
  )
  const work = (async (): Promise<{ poolId: string; poolStatus: PoolStatus }> => {
    const supabase = await getSupabaseServerClient()
    const allReqIds = [myReqId, ...matchedReqIds]

    // Fetch all requirements
    const { data: allReqs, error: fetchErr } = await (supabase.from('logistics_requirements') as any)
      .select('*')
      .in('id', allReqIds)

    if (fetchErr || !allReqs) throw new Error('Failed to fetch requirements for pool creation')

    const requirements = allReqs as LogisticsRequirement[]
    const myReq = requirements.find(r => r.id === myReqId)
    if (!myReq) throw new Error('Own requirement not found')

    const truckType = myReq.vehicle_type || 'mini_truck'
    const truckCapacity = TRUCK_CAPACITIES[truckType as keyof typeof TRUCK_CAPACITIES] ?? 90
    const combinedLoad = requirements.reduce((s, r) => s + r.quantity_quintal, 0)
    const routeKm = calculateHaversineDistance(
      myReq.pickup_lat, myReq.pickup_lng,
      myReq.dest_lat, myReq.dest_lng
    )

    // Determine pool status: CONFIRMED if load ≥ 80% capacity or all trucks accounted for
    const shouldConfirm = combinedLoad >= truckCapacity * 0.8

    // Check if any requirement already has a pool
    const existingPoolId = requirements.find(r => r.pool_id)?.pool_id
    let poolId: string

    if (existingPoolId) {
      poolId = existingPoolId
      // Update pool
      await (supabase.from('logistics_pools') as any)
        .update({
          combined_load_qt: combinedLoad,
          route_distance_km: routeKm,
          status: shouldConfirm ? 'CONFIRMED' : 'OPEN',
          confirmed_at: shouldConfirm ? new Date().toISOString() : null,
        })
        .eq('id', poolId)
    } else {
      // Create new pool
      const { data: newPool, error: poolErr } = await (supabase.from('logistics_pools') as any)
        .insert({
          status: shouldConfirm ? 'CONFIRMED' : 'OPEN',
          vehicle_type: truckType,
          truck_capacity_qt: truckCapacity,
          combined_load_qt: combinedLoad,
          route_distance_km: routeKm,
          confirmed_at: shouldConfirm ? new Date().toISOString() : null,
        })
        .select('id')
        .single()

      if (poolErr || !newPool) {
        console.warn('[joinLogisticsPool] pool create error:', poolErr?.message)
        poolId = `local-pool-${Date.now()}`
      } else {
        poolId = newPool.id
      }
    }

    // Update all requirements → in_pool (or confirmed)
    const newReqStatus = shouldConfirm ? 'confirmed' : 'in_pool'
    await (supabase.from('logistics_requirements') as any)
      .update({ pool_id: poolId, status: newReqStatus })
      .in('id', allReqIds)

    // If confirmed → create community_connections between all pairs
    if (shouldConfirm && !poolId.startsWith('local-')) {
      const farmerIds = requirements.map(r => r.farmer_id).filter(Boolean) as string[]
      const pairs: Array<{ pool_id: string; farmer_a_id: string; farmer_b_id: string }> = []
      for (let i = 0; i < farmerIds.length; i++) {
        for (let j = i + 1; j < farmerIds.length; j++) {
          pairs.push({
            pool_id: poolId,
            farmer_a_id: farmerIds[i],
            farmer_b_id: farmerIds[j],
          })
        }
      }
      if (pairs.length > 0) {
        await (supabase.from('community_connections') as any)
          .upsert(pairs, { onConflict: 'pool_id,farmer_a_id,farmer_b_id', ignoreDuplicates: true })
      }
    }

    const poolStatus: PoolStatus = shouldConfirm ? 'CONFIRMED' : 'OPEN'
    return { poolId, poolStatus }
  })()

  try {
    const data = await Promise.race([work, timeout])
    return { data, error: null }
  } catch (err: any) {
    console.warn('[joinLogisticsPool] error:', err?.message)
    return { data: { poolId: `offline-pool-${Date.now()}`, poolStatus: 'OPEN' }, error: null }
  }
}

// ─── 5. Update pool status ─────────────────────────────────────────────────────
export async function updatePoolStatus(
  poolId: string,
  newStatus: PoolStatus
): Promise<ActionResult<null>> {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('updatePoolStatus timed out after 8s')), 8000)
  )
  const work = (async (): Promise<null> => {
    const supabase = await getSupabaseServerClient()
    const update: Record<string, any> = { status: newStatus }
    if (newStatus === 'CONFIRMED') update.confirmed_at = new Date().toISOString()
    if (newStatus === 'COMPLETED') update.completed_at = new Date().toISOString()

    const { error } = await (supabase.from('logistics_pools') as any)
      .update(update)
      .eq('id', poolId)

    if (error) console.warn('[updatePoolStatus] warning:', error.message)

    // Sync requirement statuses
    const reqStatus = newStatus === 'COMPLETED' ? 'completed' : newStatus === 'CONFIRMED' ? 'confirmed' : 'in_pool'
    await (supabase.from('logistics_requirements') as any)
      .update({ status: reqStatus })
      .eq('pool_id', poolId)

    return null
  })()

  try {
    await Promise.race([work, timeout])
    return { data: null, error: null }
  } catch (err: any) {
    return { data: null, error: null }
  }
}

// ─── 6. Get pool with all members ─────────────────────────────────────────────
export async function getPoolWithMembers(
  poolId: string
): Promise<ActionResult<LogisticsPool & { members: LogisticsRequirement[] }>> {
  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('getPoolWithMembers timed out after 8s')), 8000)
  )
  const work = async () => {
    const supabase = await getSupabaseServerClient()
    const { data: pool, error: poolErr } = await (supabase.from('logistics_pools') as any)
      .select('*')
      .eq('id', poolId)
      .single()

    if (poolErr || !pool) throw new Error('Pool not found')

    const { data: members } = await (supabase.from('logistics_requirements') as any)
      .select('*')
      .eq('pool_id', poolId)

    return { ...pool, members: members || [] }
  }

  try {
    const data = await Promise.race([work(), timeout])
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to load pool' }
  }
}
