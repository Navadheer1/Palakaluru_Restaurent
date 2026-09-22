-- ========================================================================
-- CULINACLOUD RMS (RESTAURANT MANAGEMENT SYSTEM) PERFORMANCE INDEXES
-- Migration: 004_performance_indexes.sql
-- Purpose: Accelerate high-frequency queries for peak restaurant periods
-- ========================================================================

-- 1. PROFILES: Speeds up RLS security checks and multi-tenant scoping
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_id 
  ON public.profiles(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_profiles_branch_id 
  ON public.profiles(branch_id) WHERE branch_id IS NOT NULL;

-- 2. ORDERS: Speeds up dashboard daily sales calculations & paginated order queries
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created_desc 
  ON public.orders(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_created 
  ON public.orders(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_table_lookup 
  ON public.orders(table_id) WHERE table_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_lookup 
  ON public.orders(customer_id) WHERE customer_id IS NOT NULL;

-- 3. ORDER ITEMS: High-frequency joins when inspecting tickets & bills
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_menu_item 
  ON public.order_items(menu_item_id) WHERE menu_item_id IS NOT NULL;

-- 4. RESTAURANT TABLES: Instant floor plan status updates and active table counts
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_rest_status 
  ON public.restaurant_tables(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_rest_number 
  ON public.restaurant_tables(restaurant_id, table_number);

-- 5. KITCHEN DISPLAY (KOT): Sub-second queue retrieval & live order status transitions
CREATE INDEX IF NOT EXISTS idx_kot_restaurant_active_queue 
  ON public.kot(restaurant_id, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_kot_order_id 
  ON public.kot(order_id);

-- 6. KOT ITEMS: Instant lookup for dishes cooking on each ticket
CREATE INDEX IF NOT EXISTS idx_kot_items_kot_id 
  ON public.kot_items(kot_id);

-- 7. DELIVERY ORDERS: Fast rider assignment and dispatch lookup
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status_rider 
  ON public.delivery_orders(status, delivery_partner_id);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_order_id 
  ON public.delivery_orders(order_id);

-- 8. MENU CATALOG: POS instant catalog rendering with category filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_rest_active 
  ON public.menu_items(restaurant_id, is_active, is_available);

CREATE INDEX IF NOT EXISTS idx_menu_categories_rest_active 
  ON public.menu_categories(restaurant_id, is_active, sort_order ASC);

-- 9. CUSTOMERS (CRM): Rapid phone lookup during phone/takeaway ordering
CREATE INDEX IF NOT EXISTS idx_customers_rest_phone 
  ON public.customers(restaurant_id, phone);

-- 10. INVENTORY: Fast minimum stock alerts on dashboard & stock checks
CREATE INDEX IF NOT EXISTS idx_inventory_rest_status_stock 
  ON public.inventory_items(restaurant_id, status, current_stock);
