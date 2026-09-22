-- ========================================================================
-- CULINACLOUD RMS (RESTAURANT MANAGEMENT SYSTEM)
-- Migration: 006_order_workflow_upgrade.sql
-- Description: Upgrades orders, kot, payments, and bills schema for the
--              Payment-First -> Edit Window -> Manually Send KOT workflow.
--              Adds order_audit_logs table and comprehensive performance indexes.
-- ========================================================================

-- 1. Safely add decoupled statuses and lifecycle timestamps to orders table
DO $$
BEGIN
  -- Add kot_status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'kot_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN kot_status VARCHAR(30) DEFAULT 'not_sent';
  END IF;

  -- Add delivery_status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_status VARCHAR(30) DEFAULT 'not_applicable';
  END IF;

  -- Add lifecycle timestamps
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'kot_sent_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN kot_sent_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'preparing_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN preparing_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'ready_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN ready_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Safely expand check constraints on orders
DO $$
BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('draft', 'new', 'paid', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'));

  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'partially_paid', 'refunded', 'payment_adjusted'));

  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_kot_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_kot_status_check 
    CHECK (kot_status IN ('not_sent', 'sent', 'preparing', 'ready'));

  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_status_check;
  ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_status_check 
    CHECK (delivery_status IN ('not_applicable', 'packed', 'out_for_delivery', 'delivered'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Safely update KOT table
DO $$
BEGIN
  -- Add sent_at, preparing_at, ready_at to kot if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kot' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.kot ADD COLUMN sent_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kot' AND column_name = 'preparing_at'
  ) THEN
    ALTER TABLE public.kot ADD COLUMN preparing_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'kot' AND column_name = 'ready_at'
  ) THEN
    ALTER TABLE public.kot ADD COLUMN ready_at TIMESTAMPTZ;
  END IF;

  -- Expand KOT status check constraint
  ALTER TABLE public.kot DROP CONSTRAINT IF EXISTS kot_status_check;
  ALTER TABLE public.kot ADD CONSTRAINT kot_status_check 
    CHECK (status IN ('not_sent', 'sent', 'new', 'accepted', 'preparing', 'ready', 'served', 'cancelled'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 4. Safely update payments table to track payment_type and bill_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN payment_type VARCHAR(30) DEFAULT 'initial' 
      CHECK (payment_type IN ('initial', 'additional', 'refund', 'adjustment'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bill_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL;
  END IF;

  ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
  ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('paid', 'pending', 'refunded', 'failed', 'adjusted'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 5. ORDER AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.order_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on order_audit_logs
ALTER TABLE public.order_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view audit logs for their restaurant" ON public.order_audit_logs;
CREATE POLICY "Staff can view audit logs for their restaurant"
ON public.order_audit_logs FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Authorized staff can insert audit logs" ON public.order_audit_logs;
CREATE POLICY "Authorized staff can insert audit logs"
ON public.order_audit_logs FOR INSERT
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 6. High-throughput Operational Indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_kot ON public.orders(restaurant_id, payment_status, kot_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(restaurant_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_kot_sent_status ON public.kot(restaurant_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_payments_order_type ON public.payments(order_id, payment_type);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order ON public.order_audit_logs(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_audit_logs_restaurant ON public.order_audit_logs(restaurant_id, created_at DESC);
