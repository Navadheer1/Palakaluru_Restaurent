-- ========================================================================
-- CULINACLOUD RMS: CASHIER WORKSPACE, SHIFTS & BILL VOID REQUESTS
-- Migration: 008_cashier_shifts_and_billing.sql
-- ========================================================================

-- 1. CASHIER REGISTER SESSIONS / SHIFTS
CREATE TABLE IF NOT EXISTS public.cashier_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  cashier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cashier_name VARCHAR(255) NOT NULL,
  opening_cash NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  closing_cash NUMERIC(10,2),
  expected_cash NUMERIC(10,2),
  cash_difference NUMERIC(10,2),
  total_bills INT DEFAULT 0,
  cash_sales NUMERIC(10,2) DEFAULT 0.00,
  upi_sales NUMERIC(10,2) DEFAULT 0.00,
  card_sales NUMERIC(10,2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_cashier_status 
  ON public.cashier_shifts (cashier_id, status);

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_restaurant_time 
  ON public.cashier_shifts (restaurant_id, opened_at DESC);

-- 2. BILL VOID / CORRECTION REQUESTS
CREATE TABLE IF NOT EXISTS public.bill_void_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
  bill_number VARCHAR(100) NOT NULL,
  order_number VARCHAR(100),
  amount NUMERIC(10,2) NOT NULL,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_void_requests_restaurant 
  ON public.bill_void_requests (restaurant_id, status, created_at DESC);

-- 3. ENHANCE bills TABLE FOR CASHIER SHIFT AUDIT
ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.cashier_shifts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reprint_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reprinted_at TIMESTAMPTZ;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_void_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cashiers and managers can view their shifts"
  ON public.cashier_shifts FOR SELECT
  USING (
    restaurant_id = public.get_user_restaurant_id()
    AND (
      public.get_user_role() IN ('admin', 'manager')
      OR cashier_id = auth.uid()
    )
  );

CREATE POLICY "Cashiers can manage their own shifts"
  ON public.cashier_shifts FOR ALL
  USING (
    restaurant_id = public.get_user_restaurant_id()
    AND cashier_id = auth.uid()
  );

CREATE POLICY "Users can create void requests in their restaurant"
  ON public.bill_void_requests FOR INSERT
  WITH CHECK (
    restaurant_id = public.get_user_restaurant_id()
    AND requested_by = auth.uid()
  );

CREATE POLICY "Staff can view void requests in their restaurant"
  ON public.bill_void_requests FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Managers and admins can review void requests"
  ON public.bill_void_requests FOR UPDATE
  USING (
    restaurant_id = public.get_user_restaurant_id()
    AND public.get_user_role() IN ('admin', 'manager')
  );
