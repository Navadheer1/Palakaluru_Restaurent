-- ========================================================================
-- CULINACLOUD RMS: PRODUCTION DELIVERY TRACKING SCHEMA
-- Migration: 007_production_delivery_tracking.sql
-- ========================================================================

-- 1. ENHANCE delivery_orders WITH PRODUCTION COORDINATES & ROUTE METRICS
ALTER TABLE public.delivery_orders
  ADD COLUMN IF NOT EXISTS customer_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS customer_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(20) DEFAULT 'inactive'
    CHECK (tracking_status IN ('inactive', 'active', 'paused', 'completed', 'stale')),
  ADD COLUMN IF NOT EXISTS route_distance_km NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS route_duration_mins INT,
  ADD COLUMN IF NOT EXISTS address_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS customer_landmark TEXT,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cod'
    CHECK (payment_method IN ('cod', 'online', 'card_on_delivery', 'upi_on_delivery')),
  ADD COLUMN IF NOT EXISTS payment_collected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cash_collected_amount NUMERIC(10,2) DEFAULT 0.00;

-- 2. CREATE TABLE delivery_locations (PRODUCTION GPS TIME-SERIES)
CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  battery_level INT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_delivery_locations_delivery_time 
  ON public.delivery_locations (delivery_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_locations_rider_time 
  ON public.delivery_locations (delivery_boy_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_locations_restaurant 
  ON public.delivery_locations (restaurant_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_partner_status
  ON public.delivery_orders (delivery_partner_id, status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- Select policy: Admins/managers see all in their restaurant, delivery boys see their own assigned locations
CREATE POLICY "Authorized staff and riders can view delivery locations"
  ON public.delivery_locations FOR SELECT
  USING (
    restaurant_id = public.get_user_restaurant_id()
    AND (
      public.get_user_role() IN ('admin', 'manager')
      OR delivery_boy_id = auth.uid()
    )
  );

-- Insert policy: Delivery boys can insert locations strictly for their own assigned, active delivery
CREATE POLICY "Riders can insert their own delivery locations"
  ON public.delivery_locations FOR INSERT
  WITH CHECK (
    restaurant_id = public.get_user_restaurant_id()
    AND delivery_boy_id = auth.uid()
    AND public.get_user_role() = 'delivery'
    AND EXISTS (
      SELECT 1 FROM public.delivery_orders
      WHERE id = delivery_locations.delivery_id
        AND delivery_partner_id = auth.uid()
        AND status IN ('picked_up', 'out_for_delivery')
    )
  );

-- 5. AUTOMATIC HISTORICAL RETENTION CLEANUP FUNCTION (Prune > 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_stale_delivery_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.delivery_locations
  WHERE recorded_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
