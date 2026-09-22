-- ========================================================================
-- CULINACLOUD RMS SEED DATA
-- Migration: 003_seed_data.sql
-- ========================================================================

-- Insert Base Roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Super Administrator with complete system access'),
  ('manager', 'Restaurant & Operations Manager'),
  ('waiter', 'Wait staff & Order Taking'),
  ('kitchen', 'Kitchen chefs & Line cooks'),
  ('delivery', 'Delivery staff and drivers')
ON CONFLICT (name) DO NOTHING;

-- Create Default Demo Restaurant
INSERT INTO public.restaurants (id, name, slug, address, phone, email, currency, tax_rate, service_charge_rate)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Palakaluru Grand Restaurant',
  'palakaluru-grand',
  'Main Road, Palakaluru, Guntur, Andhra Pradesh 522005',
  '+91 98480 12345',
  'contact@palakalurugrand.com',
  'INR',
  5.00,
  2.50
) ON CONFLICT (slug) DO NOTHING;

-- Create Main Branch
INSERT INTO public.branches (id, restaurant_id, name, code, address, phone, is_main)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Palakaluru Main Campus',
  'PLK-01',
  'Main Road, Palakaluru, Guntur',
  '+91 98480 12345',
  TRUE
) ON CONFLICT (restaurant_id, code) DO NOTHING;

-- Create Table Sections
INSERT INTO public.table_sections (id, restaurant_id, branch_id, name, floor) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'AC Dining Hall', 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Family Section', 1),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Open Terrace', 2)
ON CONFLICT DO NOTHING;

-- Create Sample Tables
INSERT INTO public.restaurant_tables (restaurant_id, branch_id, section_id, table_number, capacity, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'T-01', 4, 'occupied'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'T-02', 2, 'available'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'T-03', 6, 'waiting_for_food'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'T-04', 4, 'food_ready'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'F-01', 8, 'billing'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'F-02', 6, 'available'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'R-01', 4, 'reserved'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'R-02', 4, 'cleaning')
ON CONFLICT DO NOTHING;

-- Create Menu Categories
INSERT INTO public.menu_categories (id, restaurant_id, name, description, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Biryani & Rice', 'Authentic slow-cooked spiced fragrant rice dishes', 1),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Starters & Tandoor', 'Sizzling clay-oven and fried appetizers', 2),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Curries & Gravies', 'Rich slow-simmered Indian curries', 3),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Breads & Rotis', 'Freshly baked naans, kulchas, and rotis', 4),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Beverages & Desserts', 'Refreshing mocktails, lassis, and traditional sweets', 5)
ON CONFLICT DO NOTHING;

-- Create Menu Items
INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, base_price, preparation_time_mins, kitchen_station, is_available) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Special Dum Chicken Biryani', 'Traditional aromatic basmati rice cooked with marinated tender chicken and exotic spices', 280.00, 20, 'Biryani Counter', TRUE),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Mutton Ghee Roast Biryani', 'Succulent goat meat tossed in roasted spices layered with fragrant seeraga samba rice', 420.00, 25, 'Biryani Counter', TRUE),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Guntur Chilli Chicken', 'Crispy chicken cubes tossed with fiery Andhra red chillies, curry leaves, and garlic', 260.00, 15, 'Tandoor / Starters', TRUE),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Paneer Tikka Angara', 'Char-grilled cottage cheese cubes marinated in Kashmiri chilli and smoked mustard oil', 240.00, 15, 'Tandoor / Starters', TRUE),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Butter Chicken Delhi Style', 'Smoked chicken in a velvet tomato butter gravy infused with dried fenugreek', 310.00, 15, 'Curry Station', TRUE),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Garlic Butter Naan', 'Clay oven leavened flatbread glazed with melted butter and fresh minced garlic', 60.00, 8, 'Roti Station', TRUE),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'Mango Malai Lassi', 'Chilled thick curd churned with Alphonso mango pulp and saffron cardamom', 90.00, 5, 'Beverages Counter', TRUE)
ON CONFLICT DO NOTHING;

-- Variants
INSERT INTO public.menu_variants (menu_item_id, name, price, is_default) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Regular (Single)', 280.00, TRUE),
  ('e0000000-0000-0000-0000-000000000001', 'Family Pack', 650.00, FALSE),
  ('e0000000-0000-0000-0000-000000000001', 'Jumbo Bucket', 950.00, FALSE)
ON CONFLICT DO NOTHING;

-- Addons
INSERT INTO public.menu_addons (id, restaurant_id, name, price) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Extra Boiled Egg', 25.00),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Extra Mirchi Ka Salan & Raita', 40.00),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Extra Cheese Topping', 35.00)
ON CONFLICT DO NOTHING;

-- Sample Inventory Items
INSERT INTO public.inventory_items (restaurant_id, branch_id, name, sku, unit, current_stock, minimum_stock, cost_per_unit, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Basmati Rice Premium (Aged)', 'ING-RICE-01', 'kg', 120.00, 30.00, 110.00, 'in_stock'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Fresh Farm Chicken', 'ING-CHIK-01', 'kg', 45.00, 15.00, 180.00, 'in_stock'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Pure Desi Ghee', 'ING-GHEE-01', 'L', 8.50, 10.00, 580.00, 'low_stock'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Malai Paneer Cubes', 'ING-PAN-01', 'kg', 2.00, 5.00, 320.00, 'low_stock')
ON CONFLICT DO NOTHING;
