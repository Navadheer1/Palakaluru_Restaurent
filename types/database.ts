import { UserRole, OrderType, OrderStatus, TableStatus, KotStatus, DeliveryStatus, PaymentMethod, PaymentStatus } from "@/lib/constants";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  name: string;
  full_name?: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  pin_code: string | null;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface TableSection {
  id: string;
  restaurant_id: string;
  branch_id: string;
  name: string;
  floor: number;
  is_active: boolean;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  branch_id: string;
  section_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  current_order_id: string | null;
  assigned_waiter_id: string | null;
  is_active: boolean;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  tax_rate: number;
  sku: string | null;
  preparation_time_mins: number;
  kitchen_station: string | null;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

export interface MenuVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_default: boolean;
  is_available: boolean;
}

export interface MenuAddon {
  id: string;
  restaurant_id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface Customer {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  total_orders: number;
  total_spend: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  restaurant_id: string;
  branch_id: string;
  customer_id: string | null;
  table_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  payment_status: PaymentStatus;
  kot_status?: KotStatus;
  delivery_status?: DeliveryStatus;
  paid_at?: string | null;
  kot_sent_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  created_by: string | null;
  assigned_waiter_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  kots?: KOT[];
  bills?: Bill[];
  table?: RestaurantTable;
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  variant_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  kot_id?: string | null;
  kot_number?: string | null;
  modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  addon_id: string;
  name: string;
  price: number;
}

export interface KOT {
  id: string;
  kot_number: string;
  order_id: string;
  restaurant_id: string;
  branch_id: string;
  table_id: string | null;
  order_type: OrderType;
  waiter_id: string | null;
  status: KotStatus;
  notes: string | null;
  sent_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  created_at: string;
  items?: KOTItem[];
}

export interface KOTItem {
  id: string;
  kot_id: string;
  order_item_id: string;
  name: string;
  quantity: number;
  instructions: string | null;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
}

export interface Bill {
  id: string;
  bill_number: string;
  order_id: string;
  restaurant_id: string;
  branch_id: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge: number;
  final_total: number;
  payment_status: PaymentStatus;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  bill_id?: string | null;
  restaurant_id: string;
  branch_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  payment_type?: "initial" | "additional" | "refund" | "adjustment";
  transaction_reference: string | null;
  processed_by: string | null;
  created_at: string;
}

export interface OrderAuditLog {
  id: string;
  order_id: string;
  restaurant_id: string;
  action: string;
  actor_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  branch_id: string;
  name: string;
  sku: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  cost_per_unit: number;
  supplier_id: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock";
  created_at: string;
}

export interface Supplier {
  id: string;
  restaurant_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  restaurant_id: string;
  branch_id: string;
  category: "rent" | "electricity" | "gas" | "salary" | "maintenance" | "supplies" | "marketing" | "other";
  amount: number;
  description: string;
  expense_date: string;
  payment_method: PaymentMethod;
  attachment_url: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  user_id: string | null;
  title: string;
  message: string;
  type: "order" | "kitchen" | "stock" | "delivery" | "payment" | "system";
  is_read: boolean;
  link_url: string | null;
  created_at: string;
}
