-- ==============================================================================
-- Migration: Pooled Logistics System
-- Project:   Krishi Mitra
-- Date:      2026-09-26
-- ==============================================================================

-- 1. logistics_requirements
--    Each farmer's individual transport need.
CREATE TABLE IF NOT EXISTS public.logistics_requirements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_name         TEXT NOT NULL,
    farmer_phone        TEXT,
    crop                TEXT NOT NULL,
    quantity_quintal     NUMERIC(10, 2) NOT NULL,
    pickup_lat          DOUBLE PRECISION NOT NULL,
    pickup_lng          DOUBLE PRECISION NOT NULL,
    pickup_address      TEXT,
    dest_lat            DOUBLE PRECISION NOT NULL,
    dest_lng            DOUBLE PRECISION NOT NULL,
    dest_address        TEXT,
    preferred_date_from DATE NOT NULL,
    preferred_date_to   DATE NOT NULL,
    vehicle_type        TEXT DEFAULT 'mini_truck',
    status              TEXT DEFAULT 'searching',
    pool_id             UUID,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. logistics_pools
--    A virtual pool of matched logistics requirements.
CREATE TABLE IF NOT EXISTS public.logistics_pools (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status            TEXT DEFAULT 'OPEN',
    vehicle_type      TEXT DEFAULT 'mini_truck',
    truck_capacity_qt NUMERIC(10, 2) DEFAULT 190,
    combined_load_qt  NUMERIC(10, 2) DEFAULT 0,
    route_distance_km NUMERIC(10, 2),
    created_at        TIMESTAMPTZ DEFAULT now(),
    confirmed_at      TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ
);

-- 3. Forward FK from logistics_requirements to logistics_pools
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_req_pool'
          AND table_name = 'logistics_requirements'
    ) THEN
        ALTER TABLE public.logistics_requirements
            ADD CONSTRAINT fk_req_pool
            FOREIGN KEY (pool_id) REFERENCES public.logistics_pools(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. community_connections
--    Created when a pool is CONFIRMED so matched farmers can see contact details.
CREATE TABLE IF NOT EXISTS public.community_connections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id      UUID REFERENCES public.logistics_pools(id) ON DELETE CASCADE,
    farmer_a_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_b_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_lr_farmer_id ON public.logistics_requirements(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lr_status    ON public.logistics_requirements(status);
CREATE INDEX IF NOT EXISTS idx_lr_pool_id   ON public.logistics_requirements(pool_id);
CREATE INDEX IF NOT EXISTS idx_lr_coords    ON public.logistics_requirements(pickup_lat, pickup_lng);
CREATE INDEX IF NOT EXISTS idx_lp_status    ON public.logistics_pools(status);
CREATE INDEX IF NOT EXISTS idx_cc_farmer_a  ON public.community_connections(farmer_a_id);
CREATE INDEX IF NOT EXISTS idx_cc_farmer_b  ON public.community_connections(farmer_b_id);

-- 6. Row Level Security
ALTER TABLE public.logistics_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_pools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_connections  ENABLE ROW LEVEL SECURITY;

-- logistics_requirements policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logistics_requirements' AND policyname='Any auth can view requirements') THEN
    CREATE POLICY "Any auth can view requirements"
        ON public.logistics_requirements FOR SELECT
        USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logistics_requirements' AND policyname='Farmer can insert own requirement') THEN
    CREATE POLICY "Farmer can insert own requirement"
        ON public.logistics_requirements FOR INSERT
        WITH CHECK (auth.uid() = farmer_id OR farmer_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logistics_requirements' AND policyname='Farmer can update own requirement') THEN
    CREATE POLICY "Farmer can update own requirement"
        ON public.logistics_requirements FOR UPDATE
        USING (auth.uid() = farmer_id);
  END IF;
END $$;

-- logistics_pools policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logistics_pools' AND policyname='Any auth can view pools') THEN
    CREATE POLICY "Any auth can view pools"
        ON public.logistics_pools FOR SELECT
        USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logistics_pools' AND policyname='Any auth can create pool') THEN
    CREATE POLICY "Any auth can create pool"
        ON public.logistics_pools FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='logistics_pools' AND policyname='Any auth can update pool') THEN
    CREATE POLICY "Any auth can update pool"
        ON public.logistics_pools FOR UPDATE
        USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- community_connections policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_connections' AND policyname='Farmer can view own connections') THEN
    CREATE POLICY "Farmer can view own connections"
        ON public.community_connections FOR SELECT
        USING (auth.uid() = farmer_a_id OR auth.uid() = farmer_b_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_connections' AND policyname='Any auth can create connection') THEN
    CREATE POLICY "Any auth can create connection"
        ON public.community_connections FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 7. RPC: find_logistics_pools
--    Finds compatible requirements to pool with the given requirement using Haversine.
--    Pickup within 20 km, destination within 30 km, overlapping date windows,
--    combined load within truck capacity.
CREATE OR REPLACE FUNCTION public.find_logistics_pools(
    req_id            UUID,
    truck_capacity_qt NUMERIC DEFAULT 190
)
RETURNS TABLE (
    id                  UUID,
    farmer_id           UUID,
    farmer_name         TEXT,
    farmer_phone        TEXT,
    crop                TEXT,
    quantity_quintal     NUMERIC,
    pickup_lat          DOUBLE PRECISION,
    pickup_lng          DOUBLE PRECISION,
    pickup_address      TEXT,
    dest_lat            DOUBLE PRECISION,
    dest_lng            DOUBLE PRECISION,
    dest_address        TEXT,
    preferred_date_from DATE,
    preferred_date_to   DATE,
    vehicle_type        TEXT,
    status              TEXT,
    pool_id             UUID,
    created_at          TIMESTAMPTZ,
    pickup_dist_km      DOUBLE PRECISION,
    dest_dist_km        DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ref_row      public.logistics_requirements%ROWTYPE;
    running_load NUMERIC;
BEGIN
    SELECT * INTO ref_row
    FROM public.logistics_requirements
    WHERE public.logistics_requirements.id = req_id;

    IF NOT FOUND THEN RETURN; END IF;

    running_load := ref_row.quantity_quintal;

    RETURN QUERY
    SELECT
        r.id,
        r.farmer_id,
        r.farmer_name,
        CASE WHEN r.status = 'confirmed' THEN r.farmer_phone ELSE NULL END AS farmer_phone,
        r.crop,
        r.quantity_quintal,
        r.pickup_lat,
        r.pickup_lng,
        r.pickup_address,
        r.dest_lat,
        r.dest_lng,
        r.dest_address,
        r.preferred_date_from,
        r.preferred_date_to,
        r.vehicle_type,
        r.status,
        r.pool_id,
        r.created_at,
        ROUND((6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(ref_row.pickup_lat)) * cos(radians(r.pickup_lat)) *
                cos(radians(r.pickup_lng) - radians(ref_row.pickup_lng)) +
                sin(radians(ref_row.pickup_lat)) * sin(radians(r.pickup_lat))
            ))
        ))::numeric, 1)::double precision AS pickup_dist_km,
        ROUND((6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(ref_row.dest_lat)) * cos(radians(r.dest_lat)) *
                cos(radians(r.dest_lng) - radians(ref_row.dest_lng)) +
                sin(radians(ref_row.dest_lat)) * sin(radians(r.dest_lat))
            ))
        ))::numeric, 1)::double precision AS dest_dist_km
    FROM public.logistics_requirements r
    WHERE
        r.id <> req_id
        AND r.status IN ('searching', 'in_pool')
        AND r.preferred_date_from <= ref_row.preferred_date_to
        AND r.preferred_date_to   >= ref_row.preferred_date_from
        AND (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(ref_row.pickup_lat)) * cos(radians(r.pickup_lat)) *
                cos(radians(r.pickup_lng) - radians(ref_row.pickup_lng)) +
                sin(radians(ref_row.pickup_lat)) * sin(radians(r.pickup_lat))
            ))
        )) <= 20
        AND (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
                cos(radians(ref_row.dest_lat)) * cos(radians(r.dest_lat)) *
                cos(radians(r.dest_lng) - radians(ref_row.dest_lng)) +
                sin(radians(ref_row.dest_lat)) * sin(radians(r.dest_lat))
            ))
        )) <= 30
        AND (running_load + r.quantity_quintal) <= truck_capacity_qt
    ORDER BY pickup_dist_km ASC
    LIMIT 5;
END;
$$;
