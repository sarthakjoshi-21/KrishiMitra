/**
 * lib/logistics-utils.ts
 * Pure client-safe utilities for Pooled Logistics.
 * No "use server" — safe to import in both Server and Client components.
 */

import { calculateHaversineDistance } from '@/lib/geo-utils'
import type { LogisticsRequirement } from '@/types/database'

// ─── Rate constants ──────────────────────────────────────────────────────────
// ₹50 per km + ₹10 per quintal
export const RATE_PER_KM = 50
export const RATE_PER_QUINTAL = 10

export const TRUCK_CAPACITIES = {
  mini_truck: 90,   // 9 tons
  large_truck: 190, // 19 tons
} as const

export interface CostEstimate {
  soloCostRs: number
  pooledCostRs: number
  savingsRs: number
  routeDistanceKm: number
  myLoad: number
  totalLoad: number
  truckCapacity: number
  remainingCapacity: number
}

/**
 * Calculates solo vs pooled transport costs using the standard rate card.
 * Solo cost  = full truck for this farmer alone  (route * ₹50/km + load * ₹10/qt + ₹500 booking fee)
 * Pooled cost = proportional share by load weight (total truck cost × farmer's fraction)
 */
export function estimateCosts(
  myReq: LogisticsRequirement,
  poolMembers: LogisticsRequirement[]
): CostEstimate {
  const allMembers = [myReq, ...poolMembers]

  const routeKm = calculateHaversineDistance(
    myReq.pickup_lat, myReq.pickup_lng,
    myReq.dest_lat,   myReq.dest_lng
  )

  const totalLoad = allMembers.reduce((sum, m) => sum + m.quantity_quintal, 0)
  const myLoad    = myReq.quantity_quintal
  const truckType = myReq.vehicle_type || 'mini_truck'
  const truckCapacity = TRUCK_CAPACITIES[truckType as keyof typeof TRUCK_CAPACITIES] ?? 90

  const totalTruckCost = routeKm * RATE_PER_KM + totalLoad * RATE_PER_QUINTAL
  const soloCostRs     = Math.round(routeKm * RATE_PER_KM + myLoad * RATE_PER_QUINTAL + 500)
  const weightFraction = totalLoad > 0 ? myLoad / totalLoad : 1
  const pooledCostRs   = Math.round(totalTruckCost * weightFraction)

  return {
    soloCostRs,
    pooledCostRs,
    savingsRs:         Math.max(0, soloCostRs - pooledCostRs),
    routeDistanceKm:   routeKm,
    myLoad,
    totalLoad,
    truckCapacity,
    remainingCapacity: Math.max(0, truckCapacity - totalLoad),
  }
}

export interface ProposedPool {
  myRequirement: LogisticsRequirement
  matches: LogisticsRequirement[]
  costs: CostEstimate
  poolId?: string | null
}

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

export interface CreateLogisticsReqInput {
  farmer_name: string
  farmer_phone?: string
  crop: string
  quantity_quintal: number
  pickup_lat: number
  pickup_lng: number
  pickup_address?: string
  dest_lat: number
  dest_lng: number
  dest_address?: string
  preferred_date_from: string
  preferred_date_to: string
  vehicle_type?: 'mini_truck' | 'large_truck'
}
