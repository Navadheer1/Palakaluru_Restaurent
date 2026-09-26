-- ========================================================================
-- CULINACLOUD RMS: TABLES & SECTIONS COMPLETE SCHEMA MIGRATION
-- Migration: 009_tables_and_sections_schema.sql
-- Direct Execution URL:
-- https://supabase.com/dashboard/project/reiivaotuxiksairoizk/sql/new
-- ========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure Root Restaurant Exists
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gstin VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'INR',
    tax_rate NUMERIC(5,2) DEFAULT 5.00,
    service_charge_rate NUMERIC(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Restaurant if not present
INSERT INTO public.restaurants (id, name, slug, address, phone, email, currency, tax_rate, service_charge_rate)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Palakaluru Restaurant',
  'palakaluru-restaurant',
  'Main Road, Palakaluru, Guntur, Andhra Pradesh 522005',
  '+91 98480 12345',
  'contact@palakaluru.com',
  'INR',
  5.00,
  0.00
) ON CONFLICT (id) DO NOTHING
  ON CONFLICT (slug) DO NOTHING;

-- 2. Ensure Branches Exist
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_restaurant_branch_code UNIQUE(restaurant_id, code)
);

-- Seed Default Branch
INSERT INTO public.branches (id, restaurant_id, name, code, address, phone, is_main)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Main Branch',
  'MAIN-01',
  'Main Road, Palakaluru, Guntur, Andhra Pradesh 522005',
  '+91 98480 12345',
  TRUE
) ON CONFLICT (id) DO NOTHING
  ON CONFLICT (restaurant_id, code) DO NOTHING;

-- 3. Table Sections
CREATE TABLE IF NOT EXISTS public.table_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    floor INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on section name per restaurant if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_restaurant_section_name'
  ) THEN
    ALTER TABLE public.table_sections
    ADD CONSTRAINT uq_restaurant_section_name UNIQUE (restaurant_id, name);
  END IF;
END $$;

-- Seed Default Sections
INSERT INTO public.table_sections (id, restaurant_id, branch_id, name, floor, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Main Hall', 1, TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'AC Dining Hall', 1, TRUE),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Family Section', 1, TRUE),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Open Terrace', 2, TRUE),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'VIP Lounge', 1, TRUE)
ON CONFLICT (id) DO NOTHING
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- 4. Restaurant Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.table_sections(id) ON DELETE SET NULL,
    table_number VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(50) DEFAULT 'available',
    current_order_id UUID,
    assigned_waiter_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on table_number per restaurant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_restaurant_table_number'
  ) THEN
    ALTER TABLE public.restaurant_tables
    ADD CONSTRAINT uq_restaurant_table_number UNIQUE (restaurant_id, table_number);
  END IF;
END $$;

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant_id ON public.restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_section_id ON public.restaurant_tables(section_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON public.restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_table_sections_restaurant_id ON public.table_sections(restaurant_id);

-- 5. Row Level Security Policies
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid duplication errors
DROP POLICY IF EXISTS "Public and authenticated read restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Public and authenticated read branches" ON public.branches;
DROP POLICY IF EXISTS "Public and authenticated read table_sections" ON public.table_sections;
DROP POLICY IF EXISTS "Public and authenticated manage table_sections" ON public.table_sections;
DROP POLICY IF EXISTS "Public and authenticated read restaurant_tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Public and authenticated manage restaurant_tables" ON public.restaurant_tables;

-- Allow reading
CREATE POLICY "Public and authenticated read restaurants"
ON public.restaurants FOR SELECT
USING (true);

CREATE POLICY "Public and authenticated read branches"
ON public.branches FOR SELECT
USING (true);

CREATE POLICY "Public and authenticated read table_sections"
ON public.table_sections FOR SELECT
USING (true);

CREATE POLICY "Public and authenticated manage table_sections"
ON public.table_sections FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public and authenticated read restaurant_tables"
ON public.restaurant_tables FOR SELECT
USING (true);

CREATE POLICY "Public and authenticated manage restaurant_tables"
ON public.restaurant_tables FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Enable Realtime Publications (Safe execution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'restaurant_tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'table_sections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sections;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Publication may not exist in some local envs, safely ignore
  NULL;
END $$;
