export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  CASHIER: "cashier",
  WAITER: "waiter",
  KITCHEN: "kitchen",
  DELIVERY: "delivery",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ORDER_TYPES = {
  DINE_IN: "dine_in",
  TAKEAWAY: "takeaway",
  DELIVERY: "delivery",
  ONLINE: "online",
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];

export const ORDER_STATUSES = {
  DRAFT: "draft",
  OPEN: "open",
  NEW: "new",
  PAID: "paid",
  CONFIRMED: "confirmed",
  KOT_SENT: "kot_sent",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  BILL_REQUESTED: "bill_requested",
  BILL_GENERATED: "bill_generated",
  PAYMENT_PENDING: "payment_pending",
  CLOSED: "closed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const TABLE_STATUSES = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  WAITING_FOR_FOOD: "waiting_for_food",
  FOOD_READY: "food_ready",
  BILL_REQUESTED: "bill_requested",
  BILL_READY: "bill_ready",
  BILL_PENDING: "billing",
  BILLING: "billing",
  CLEANING: "cleaning",
  RESERVED: "reserved",
} as const;

export type TableStatus = (typeof TABLE_STATUSES)[keyof typeof TABLE_STATUSES];

export const KOT_STATUSES = {
  NOT_SENT: "not_sent",
  SENT: "sent",
  NEW: "new",
  ACCEPTED: "accepted",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  CANCELLED: "cancelled",
} as const;

export type KotStatus = (typeof KOT_STATUSES)[keyof typeof KOT_STATUSES];

export const DELIVERY_STATUSES = {
  NOT_APPLICABLE: "not_applicable",
  PACKED: "packed",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[keyof typeof DELIVERY_STATUSES];

export const PAYMENT_METHODS = {
  CASH: "cash",
  UPI: "upi",
  CARD: "card",
  OTHER: "other",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_STATUSES = {
  UNPAID: "unpaid",
  PENDING: "pending",
  PAID: "paid",
  PARTIALLY_PAID: "partially_paid",
  REFUNDED: "refunded",
  PAYMENT_ADJUSTED: "payment_adjusted",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

/**
 * Checks if an order is in the legal post-payment edit window:
 * Payment must be PAID and KOT must be NOT_SENT.
 */
export function canEditOrderPostPayment(paymentStatus?: string | null, kotStatus?: string | null): boolean {
  const isPaid = paymentStatus === "paid" || paymentStatus === "payment_adjusted";
  const notSent = !kotStatus || kotStatus === "not_sent";
  return isPaid && notSent;
}

/**
 * Checks if cashier can manually dispatch KOT:
 * Order must be PAID and KOT must NOT yet be sent.
 */
export function canManuallySendKot(paymentStatus?: string | null, kotStatus?: string | null): boolean {
  const isPaid = paymentStatus === "paid" || paymentStatus === "payment_adjusted";
  const notSent = !kotStatus || kotStatus === "not_sent";
  return isPaid && notSent;
}

export const INVENTORY_UNITS = [
  "kg",
  "g",
  "L",
  "ml",
  "pcs",
  "box",
  "packet",
] as const;

/**
 * Role-based permission checks for POS and Floor workflows
 */
export function canOperateDineIn(role?: string | null): boolean {
  if (!role) return true; // Default fallback permits floor taking
  const r = role.toLowerCase();
  return r === "waiter" || r === "manager" || r === "cashier" || r === "admin";
}

export function canAccessAdminPos(role?: string | null): boolean {
  if (!role) return true;
  const r = role.toLowerCase();
  return r === "admin" || r === "manager" || r === "cashier";
}

export function canGenerateBill(role?: string | null): boolean {
  if (!role) return true;
  const r = role.toLowerCase();
  return r === "cashier" || r === "manager" || r === "admin";
}

export function canProcessPayment(role?: string | null): boolean {
  if (!role) return true;
  const r = role.toLowerCase();
  return r === "cashier" || r === "manager" || r === "admin";
}

export function canRequestBill(role?: string | null): boolean {
  if (!role) return true;
  const r = role.toLowerCase();
  return r === "waiter" || r === "cashier" || r === "manager" || r === "admin";
}

export function isKitchenOnly(role?: string | null): boolean {
  return role?.toLowerCase() === "kitchen";
}
