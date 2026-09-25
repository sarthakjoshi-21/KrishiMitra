-- ==============================================================================
-- Migration: Service Providers, Service Requests, and get_nearby_providers RPC
-- Project: Krishi Mitra
-- ==============================================================================

-- 1. Create service_providers table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Seeds', 'Fertilizer', 'Machinery', 'Labour', 'Logistics', 'Storage'
    services JSONB DEFAULT '[]'::jsonb, -- Array of items: [{ name, price, detail, stock }]
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 4.5,
    is_available BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    price_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    service_category TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for fast spatial and category queries
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON public.service_providers(category);
CREATE INDEX IF NOT EXISTS idx_service_providers_availability ON public.service_providers(is_available);
CREATE INDEX IF NOT EXISTS idx_service_providers_coords ON public.service_providers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON public.service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_farmer_id ON public.service_requests(farmer_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Service Providers Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_providers' AND policyname = 'Public can view active providers'
    ) THEN
        CREATE POLICY "Public can view active providers"
            ON public.service_providers FOR SELECT
            USING (is_available = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_providers' AND policyname = 'Anyone can register provider'
    ) THEN
        CREATE POLICY "Anyone can register provider"
            ON public.service_providers FOR INSERT
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_providers' AND policyname = 'Owner can update provider'
    ) THEN
        CREATE POLICY "Owner can update provider"
            ON public.service_providers FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Service Requests Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Anyone can insert service request'
    ) THEN
        CREATE POLICY "Anyone can insert service request"
            ON public.service_requests FOR INSERT
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Users can view their own requests'
    ) THEN
        CREATE POLICY "Users can view their own requests"
            ON public.service_requests FOR SELECT
            USING (auth.uid() = farmer_id OR auth.uid() IN (SELECT user_id FROM public.service_providers WHERE id = provider_id));
    END IF;
END $$;

-- 5. RPC Function: get_nearby_providers
-- Computes great-circle distance in kilometers using the Haversine formula
-- Ranks primarily by is_verified (Krishi Mitra Verified first), distance_km ASC, and rating DESC
CREATE OR REPLACE FUNCTION public.get_nearby_providers(
    farmer_lat DOUBLE PRECISION,
    farmer_lon DOUBLE PRECISION,
    filter_category TEXT DEFAULT NULL,
    max_distance_km DOUBLE PRECISION DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    provider_name TEXT,
    category TEXT,
    services JSONB,
    phone TEXT,
    address TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC(2,1),
    is_available BOOLEAN,
    is_verified BOOLEAN,
    price_info TEXT,
    created_at TIMESTAMPTZ,
    distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.id,
        sp.user_id,
        sp.provider_name,
        sp.category,
        sp.services,
        sp.phone,
        sp.address,
        sp.pincode,
        sp.latitude,
        sp.longitude,
        sp.rating,
        sp.is_available,
        sp.is_verified,
        sp.price_info,
        sp.created_at,
        ROUND(
            (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(farmer_lat)) * cos(radians(sp.latitude)) *
                    cos(radians(sp.longitude) - radians(farmer_lon)) +
                    sin(radians(farmer_lat)) * sin(radians(sp.latitude))
                ))
            ))::numeric, 1
        )::double precision AS distance_km
    FROM public.service_providers sp
    WHERE (filter_category IS NULL OR filter_category = '' OR filter_category = 'All' OR sp.category = filter_category)
      AND sp.is_available = true
      AND (
          max_distance_km IS NULL OR (
              6371 * acos(
                  LEAST(1.0, GREATEST(-1.0,
                      cos(radians(farmer_lat)) * cos(radians(sp.latitude)) *
                      cos(radians(sp.longitude) - radians(farmer_lon)) +
                      sin(radians(farmer_lat)) * sin(radians(sp.latitude))
                  ))
              ) <= max_distance_km
          )
      )
    ORDER BY
        sp.is_verified DESC,
        distance_km ASC,
        sp.rating DESC;
END;
$$;
