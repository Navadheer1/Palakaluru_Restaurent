-- ========================================================================
-- CULINACLOUD RMS (RESTAURANT MANAGEMENT SYSTEM) ROW LEVEL SECURITY
-- Migration: 002_rls_policies.sql
-- ========================================================================

-- Enable Row Level Security on all core operational tables
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

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view profiles in their restaurant"
ON public.profiles FOR SELECT
USING (
  restaurant_id = public.get_user_restaurant_id()
  OR id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins and managers can manage restaurant profiles"
ON public.profiles FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- 2. RESTAURANTS POLICIES
CREATE POLICY "Users can view their restaurant"
ON public.restaurants FOR SELECT
USING (id = public.get_user_restaurant_id());

CREATE POLICY "Admins can update their restaurant"
ON public.restaurants FOR UPDATE
USING (id = public.get_user_restaurant_id() AND public.get_user_role() = 'admin');

-- 3. ORDERS POLICIES
CREATE POLICY "Users can view orders for their restaurant"
ON public.orders FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Authorized staff can insert orders"
ON public.orders FOR INSERT
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Staff can update orders in their restaurant"
ON public.orders FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

-- 4. KOT POLICIES
CREATE POLICY "Staff can view KOT in their restaurant"
ON public.kot FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Waiters and managers can insert KOT"
ON public.kot FOR INSERT
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Kitchen and staff can update KOT status"
ON public.kot FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

-- 5. TABLES POLICIES
CREATE POLICY "Staff can view tables"
ON public.restaurant_tables FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Staff can update table status"
ON public.restaurant_tables FOR UPDATE
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Managers and admins can manage tables"
ON public.restaurant_tables FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- 6. MENU POLICIES
CREATE POLICY "Staff can view menu categories"
ON public.menu_categories FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Staff can view menu items"
ON public.menu_items FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Managers can manage menu items"
ON public.menu_items FOR ALL
USING (
  restaurant_id = public.get_user_restaurant_id()
  AND public.get_user_role() IN ('admin', 'manager')
);

-- 7. INVENTORY POLICIES
CREATE POLICY "Staff can view inventory"
ON public.inventory_items FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

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
  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'waiter'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attaching to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
