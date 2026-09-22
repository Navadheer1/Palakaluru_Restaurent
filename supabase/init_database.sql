-- ========================================================================
-- CULINACLOUD RMS (PALAKALURU RESTAURANT) COMPLETE DATABASE INITIALIZATION
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/reiivaotuxiksairoizk/sql/new
-- ========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. RESTAURANTS (Multi-Tenant Root)
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

-- 2. BRANCHES (Multi-Branch Ready)
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

-- 3. PROFILES (Staff/Admin Profiles linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'waiter' CHECK (role IN ('admin', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery')),
    avatar_url TEXT,
    pin_code VARCHAR(10),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Seed Base Roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Super Administrator with complete system access'),
  ('manager', 'Restaurant & Operations Manager'),
  ('cashier', 'Cashier and counter billing operator'),
  ('waiter', 'Wait staff & Order Taking'),
  ('kitchen', 'Kitchen chefs & Line cooks'),
  ('delivery', 'Delivery staff and drivers')
ON CONFLICT (name) DO NOTHING;

-- Seed Palakaluru Restaurant (Dedicated Root Record)
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
) ON CONFLICT (slug) DO NOTHING;

-- Seed Main Branch
INSERT INTO public.branches (id, restaurant_id, name, code, address, phone, is_main)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Main Branch',
  'MAIN-01',
  'Main Road, Palakaluru, Guntur, Andhra Pradesh 522005',
  '+91 98480 12345',
  TRUE
) ON CONFLICT (restaurant_id, code) DO NOTHING;

-- 5. TABLE SECTIONS
CREATE TABLE IF NOT EXISTS public.table_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    floor INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RESTAURANT TABLES
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.table_sections(id) ON DELETE SET NULL,
    table_number VARCHAR(50) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'waiting_for_food', 'food_ready', 'billing', 'cleaning')),
    current_order_id UUID,
    assigned_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_branch_table_num UNIQUE(branch_id, table_number)
);

-- 7. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    base_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 5.00,
    sku VARCHAR(100),
    preparation_time_mins INT DEFAULT 15,
    kitchen_station VARCHAR(100) DEFAULT 'Main Kitchen',
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MENU VARIANTS
CREATE TABLE IF NOT EXISTS public.menu_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE
);

-- 10. MENU ADDONS
CREATE TABLE IF NOT EXISTS public.menu_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE
);

-- 11. MENU ITEM ADDONS LINK
CREATE TABLE IF NOT EXISTS public.menu_item_addons (
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.menu_addons(id) ON DELETE CASCADE,
    PRIMARY KEY(menu_item_id, addon_id)
);

-- 12. CUSTOMERS (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    total_orders INT DEFAULT 0,
    total_spend NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_restaurant_cust_phone UNIQUE(restaurant_id, phone)
);

-- 13. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city VARCHAR(100) DEFAULT 'Palakaluru',
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE
);

-- 14. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    order_type VARCHAR(30) NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery', 'online')),
    status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    tax_amount NUMERIC(10,2) DEFAULT 0.00,
    service_charge NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid', 'refunded')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.menu_variants(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    special_instructions TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ORDER ITEM MODIFIERS
CREATE TABLE IF NOT EXISTS public.order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES public.menu_addons(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 17. KOT (Kitchen Order Tickets)
CREATE TABLE IF NOT EXISTS public.kot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kot_number VARCHAR(50) NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    order_type VARCHAR(30) NOT NULL DEFAULT 'dine_in',
    waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'preparing', 'ready', 'served', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. KOT ITEMS
CREATE TABLE IF NOT EXISTS public.kot_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kot_id UUID NOT NULL REFERENCES public.kot(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    instructions TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled'))
);

-- 19. BILLS
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

-- 20. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'other')),
    status VARCHAR(30) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'refunded', 'failed')),
    transaction_reference VARCHAR(255),
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. DELIVERY ORDERS
CREATE TABLE IF NOT EXISTS public.delivery_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    delivery_partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'ready_for_delivery' CHECK (status IN ('ready_for_delivery', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled')),
    assigned_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_address TEXT NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT
);

-- 21. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    unit VARCHAR(50) NOT NULL DEFAULT 'kg',
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    minimum_stock NUMERIC(12,2) NOT NULL DEFAULT 5.00,
    cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    supplier_id UUID,
    status VARCHAR(30) DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. INVENTORY MOVEMENTS
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('purchase', 'wastage', 'recipe_deduction', 'adjustment', 'return')),
    quantity NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. RECIPES
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.menu_variants(id) ON DELETE SET NULL,
    description TEXT,
    yields_servings INT DEFAULT 1
);

-- 24. RECIPE ITEMS
CREATE TABLE IF NOT EXISTS public.recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity_required NUMERIC(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    PRIMARY KEY(recipe_id, inventory_item_id)
);

-- 25. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
    subtotal NUMERIC(12,2) DEFAULT 0.00,
    tax_amount NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL
);

-- 28. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('rent', 'electricity', 'gas', 'salary', 'maintenance', 'supplies', 'marketing', 'other')),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'other')),
    attachment_url TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'system' CHECK (type IN ('order', 'kitchen', 'stock', 'delivery', 'payment', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. RESTAURANT SETTINGS
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_restaurant_setting_key UNIQUE(restaurant_id, key)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kot_restaurant_status ON public.kot(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_section ON public.restaurant_tables(section_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id, is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON public.inventory_items(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS scoping
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view profiles in their restaurant" ON public.profiles;
CREATE POLICY "Users can view profiles in their restaurant"
ON public.profiles FOR SELECT
USING (
  restaurant_id = public.get_user_restaurant_id()
  OR id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins and managers can manage restaurant profiles" ON public.profiles;
CREATE POLICY "Admins and managers can manage restaurant profiles"
ON public.profiles FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- RESTAURANTS POLICIES
DROP POLICY IF EXISTS "Users can view their restaurant" ON public.restaurants;
CREATE POLICY "Users can view their restaurant"
ON public.restaurants FOR SELECT
USING (id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Admins can update their restaurant" ON public.restaurants;
CREATE POLICY "Admins can update their restaurant"
ON public.restaurants FOR UPDATE
USING (id = public.get_user_restaurant_id() AND public.get_user_role() = 'admin');

-- BRANCHES POLICIES
DROP POLICY IF EXISTS "Users can view branches in their restaurant" ON public.branches;
CREATE POLICY "Users can view branches in their restaurant"
ON public.branches FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Admins can manage branches" ON public.branches;
CREATE POLICY "Admins can manage branches"
ON public.branches FOR ALL
USING (restaurant_id = public.get_user_restaurant_id() AND public.get_user_role() = 'admin');

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view orders for their restaurant" ON public.orders;
CREATE POLICY "Users can view orders for their restaurant"
ON public.orders FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Authorized staff can insert orders" ON public.orders;
CREATE POLICY "Authorized staff can insert orders"
ON public.orders FOR INSERT
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Staff can update orders in their restaurant" ON public.orders;
CREATE POLICY "Staff can update orders in their restaurant"
ON public.orders FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

-- KOT POLICIES
DROP POLICY IF EXISTS "Staff can view KOT in their restaurant" ON public.kot;
CREATE POLICY "Staff can view KOT in their restaurant"
ON public.kot FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Waiters and managers can insert KOT" ON public.kot;
CREATE POLICY "Waiters and managers can insert KOT"
ON public.kot FOR INSERT
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Kitchen and staff can update KOT status" ON public.kot;
CREATE POLICY "Kitchen and staff can update KOT status"
ON public.kot FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

-- TABLES POLICIES
DROP POLICY IF EXISTS "Staff can view tables" ON public.restaurant_tables;
CREATE POLICY "Staff can view tables"
ON public.restaurant_tables FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Staff can update table status" ON public.restaurant_tables;
CREATE POLICY "Staff can update table status"
ON public.restaurant_tables FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Managers and admins can manage tables" ON public.restaurant_tables;
CREATE POLICY "Managers and admins can manage tables"
ON public.restaurant_tables FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- MENU POLICIES
DROP POLICY IF EXISTS "Staff can view menu categories" ON public.menu_categories;
CREATE POLICY "Staff can view menu categories"
ON public.menu_categories FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Staff can view menu items" ON public.menu_items;
CREATE POLICY "Staff can view menu items"
ON public.menu_items FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Managers can manage menu items" ON public.menu_items;
CREATE POLICY "Managers can manage menu items"
ON public.menu_items FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- INVENTORY POLICIES
DROP POLICY IF EXISTS "Staff can view inventory" ON public.inventory_items;
CREATE POLICY "Staff can view inventory"
ON public.inventory_items FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS "Managers and admins can manage inventory" ON public.inventory_items;
CREATE POLICY "Managers and admins can manage inventory"
ON public.inventory_items FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, full_name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'waiter'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
