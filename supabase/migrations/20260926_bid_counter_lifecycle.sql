-- ==============================================================================
-- Migration: Bid Counter-Offer Lifecycle & Auction Winning Bid
-- Project: Krishi Mitra
-- ==============================================================================

-- 1. Add counter-offer columns to bids table
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS counter_price_per_kg NUMERIC(10, 2);
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS counter_by TEXT CHECK (counter_by IN ('farmer', 'buyer'));
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS counter_notes TEXT;

-- 2. Add winning_bid_id to crop_lots to close auctions upon bid/counter acceptance
ALTER TABLE public.crop_lots ADD COLUMN IF NOT EXISTS winning_bid_id UUID REFERENCES public.bids(id) ON DELETE SET NULL;

-- 3. Indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_bids_status_counter ON public.bids(status, counter_by);
CREATE INDEX IF NOT EXISTS idx_crop_lots_winning_bid ON public.crop_lots(winning_bid_id);
