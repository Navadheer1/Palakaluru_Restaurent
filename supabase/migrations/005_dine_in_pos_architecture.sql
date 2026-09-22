-- ========================================================================
-- CULINACLOUD RMS (RESTAURANT MANAGEMENT SYSTEM)
-- Migration: 005_dine_in_pos_architecture.sql
-- Description: Adds bills table, expands roles with cashier, adds bill RLS policies and indexes
-- ========================================================================

-- 1. Insert Cashier Role if not exists
INSERT INTO public.roles (name, description) VALUES
  ('cashier', 'Cashier and counter billing operator')
ON CONFLICT (name) DO NOTHING;

-- 2. Update profiles role check constraint safely if needed
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. BILLS TABLE
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    tax_amount NUMERIC(10,2) DEFAULT 0.00,
    service_charge NUMERIC(10,2) DEFAULT 0.00,
    final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for bills
DROP POLICY IF EXISTS "Staff can view bills for their restaurant" ON public.bills;
CREATE POLICY "Staff can view bills for their restaurant"
ON public.bills FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Authorized staff can create bills" ON public.bills;
CREATE POLICY "Authorized staff can create bills"
ON public.bills FOR INSERT
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Staff can update bills in their restaurant" ON public.bills;
CREATE POLICY "Staff can update bills in their restaurant"
ON public.bills FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bills_order_id ON public.bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_restaurant_created ON public.bills(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_current_order ON public.restaurant_tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_kot_order_id ON public.kot(order_id);
