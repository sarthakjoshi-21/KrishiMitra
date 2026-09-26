// -------------------------------------------------------
// Supabase database type definitions — Krishi Mitra
// Matches the public schema: users, crop_lots, bids
// -------------------------------------------------------

export type UserRole = 'farmer' | 'buyer'
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'counter' | 'paid'
export type CropGrade = 'A' | 'B' | 'C' | 'Organic' | 'Other'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  full_name: string
  phone?: string | null
  farmer_id?: string | null
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

export interface CropLot {
  id: string
  farmer_id: string            // FK → users.id
  crop_name: string
  variety?: string | null
  grade: CropGrade
  quantity_quintal: number
  asking_price_per_quintal: number
  location: string
  latitude?: number | null
  longitude?: number | null
  moisture_percent?: number | null
  // Pesticide safety columns
  pesticide_name?: string | null
  pesticide_phi_days?: number | null     // pre-harvest interval in days
  last_spray_date?: string | null        // ISO date
  pesticide_safe_flag: boolean           // computed/declared safe to sell
  // Media & status
  image_url?: string | null
  ai_grade_confidence?: number | null
  ai_notes?: string | null
  needs_transport: boolean
  is_live: boolean
  created_at: string
  updated_at: string
  // Joined
  farmer?: AppUser
  distance_km?: number
  highest_bid_per_kg?: number | null
  bids_count?: number
  bids?: Bid[]
  user_bid_per_kg?: number | null
}

export interface Bid {
  id: string
  lot_id: string               // FK → crop_lots.id
  buyer_id: string             // FK → users.id
  bid_price_per_kg: number
  total_bid_amount: number
  status: BidStatus
  created_at: string
  // Optional / backward-compatible
  bid_price_per_quintal?: number
  preferred_delivery_date?: string | null
  transport_preference?: 'seller_delivery' | 'self_pickup' | null
  quantity_requested?: number | null
  buyer_notes?: string | null
  counter_price?: number | null
  latitude?: number | null
  longitude?: number | null
  updated_at?: string
  // Joined
  lot?: CropLot
  buyer?: AppUser
}

export interface AppNotification {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
}

export type ServiceCategory = 'Seeds' | 'Fertilizer' | 'Machinery' | 'Labour' | 'Logistics' | 'Storage'

export type LogisticsStatus = 'searching' | 'in_pool' | 'confirmed' | 'completed'
export type PoolStatus = 'OPEN' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED'
export type VehicleType = 'mini_truck' | 'large_truck'

export interface LogisticsRequirement {
  id: string
  farmer_id?: string | null
  farmer_name: string
  farmer_phone?: string | null
  crop: string
  quantity_quintal: number
  pickup_lat: number
  pickup_lng: number
  pickup_address?: string | null
  dest_lat: number
  dest_lng: number
  dest_address?: string | null
  preferred_date_from: string  // ISO date
  preferred_date_to: string    // ISO date
  vehicle_type: VehicleType
  status: LogisticsStatus
  pool_id?: string | null
  created_at: string
  // Joined / computed
  pickup_dist_km?: number
  dest_dist_km?: number
}

export interface LogisticsPool {
  id: string
  status: PoolStatus
  vehicle_type: VehicleType
  truck_capacity_qt: number
  combined_load_qt: number
  route_distance_km?: number | null
  created_at: string
  confirmed_at?: string | null
  completed_at?: string | null
  // Joined
  members?: LogisticsRequirement[]
}

export interface CommunityConnection {
  id: string
  pool_id: string
  farmer_a_id: string
  farmer_b_id: string
  created_at: string
}

export interface ServiceItemTuple {
  name: string
  price: string
  detail?: string
  stock?: 'In stock' | 'Out' | string
}

export interface ServiceProvider {
  id: string
  user_id?: string | null
  provider_name: string
  category: ServiceCategory | string
  services: any // Array of [name, price, detail, stock] or ServiceItemTuple[] or JSON
  phone: string
  address: string
  pincode?: string | null
  latitude: number
  longitude: number
  rating: number
  is_available: boolean
  is_verified: boolean
  price_info?: string | null
  created_at: string
  distance_km?: number
  owner_name?: string
  response_time?: string
}

export interface ServiceRequest {
  id: string
  provider_id: string
  farmer_id?: string | null
  farmer_name: string
  farmer_phone: string
  service_category: string
  notes?: string | null
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | string
  created_at: string
  provider?: ServiceProvider
}

// -------------------------------------------------------
// Supabase generated Database type (subset)
// -------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      users: {
        Row: AppUser
        Insert: Omit<AppUser, 'id' | 'created_at'>
        Update: Partial<Omit<AppUser, 'id' | 'created_at'>>
        Relationships: any[]
      }
      crop_lots: {
        Row: CropLot
        Insert: Omit<CropLot, 'id' | 'created_at' | 'updated_at' | 'farmer'>
        Update: Partial<Omit<CropLot, 'id' | 'created_at' | 'farmer'>>
        Relationships: any[]
      }
      bids: {
        Row: Bid
        Insert: Omit<Bid, 'id' | 'created_at' | 'updated_at' | 'lot' | 'buyer'>
        Update: Partial<Omit<Bid, 'id' | 'created_at' | 'lot' | 'buyer'>>
        Relationships: any[]
      }
      notifications: {
        Row: AppNotification
        Insert: Omit<AppNotification, 'id' | 'created_at'>
        Update: Partial<Omit<AppNotification, 'id' | 'created_at'>>
        Relationships: any[]
      }
      service_providers: {
        Row: ServiceProvider
        Insert: Omit<ServiceProvider, 'id' | 'created_at' | 'distance_km'>
        Update: Partial<Omit<ServiceProvider, 'id' | 'created_at'>>
        Relationships: any[]
      }
      service_requests: {
        Row: ServiceRequest
        Insert: Omit<ServiceRequest, 'id' | 'created_at' | 'provider'>
        Update: Partial<Omit<ServiceRequest, 'id' | 'created_at'>>
        Relationships: any[]
      }
      logistics_requirements: {
        Row: LogisticsRequirement
        Insert: Omit<LogisticsRequirement, 'id' | 'created_at' | 'pickup_dist_km' | 'dest_dist_km'>
        Update: Partial<Omit<LogisticsRequirement, 'id' | 'created_at'>>
        Relationships: any[]
      }
      logistics_pools: {
        Row: LogisticsPool
        Insert: Omit<LogisticsPool, 'id' | 'created_at' | 'members'>
        Update: Partial<Omit<LogisticsPool, 'id' | 'created_at'>>
        Relationships: any[]
      }
      community_connections: {
        Row: CommunityConnection
        Insert: Omit<CommunityConnection, 'id' | 'created_at'>
        Update: Partial<Omit<CommunityConnection, 'id' | 'created_at'>>
        Relationships: any[]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_nearby_providers: {
        Args: {
          farmer_lat: number
          farmer_lon: number
          filter_category?: string | null
          max_distance_km?: number | null
        }
        Returns: ServiceProvider[]
      }
      find_logistics_pools: {
        Args: {
          req_id: string
          truck_capacity_qt?: number
        }
        Returns: LogisticsRequirement[]
      }
    }
    Enums: {
      user_role: UserRole
      bid_status: BidStatus
      crop_grade: CropGrade
    }
  }
}
