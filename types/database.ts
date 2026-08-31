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
}

export interface Bid {
  id: string
  lot_id: string               // FK → crop_lots.id
  buyer_id: string             // FK → users.id
  bid_price_per_quintal: number
  preferred_delivery_date?: string | null
  transport_preference?: 'seller_delivery' | 'self_pickup' | null
  quantity_requested?: number | null
  buyer_notes?: string | null
  status: BidStatus
  counter_price?: number | null
  created_at: string
  updated_at: string
  // Joined
  lot?: CropLot
  buyer?: AppUser
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      bid_status: BidStatus
      crop_grade: CropGrade
    }
  }
}
