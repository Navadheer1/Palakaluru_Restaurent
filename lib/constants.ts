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
  BILL_DELIVERED: "bill_delivered",
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
  BILL_DELIVERED: "bill_delivered",
  BILL_PENDING: "billing",
  BILLING: "billing",
  PAYMENT_COMPLETED: "payment_completed",
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

export const ROLE_HOMES: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  cashier: "/cashier/dashboard",
  waiter: "/waiter/dashboard",
  kitchen: "/kitchen/dashboard",
  delivery: "/delivery/dashboard",
};

export interface RolePermissions {
  // Navigation & namespaces
  canAccessAdmin: boolean;
  canAccessManager: boolean;
  canAccessCashier: boolean;
  canAccessWaiter: boolean;
  canAccessKitchen: boolean;
  canAccessDelivery: boolean;

  // Floor & Tables
  canViewTables: boolean;
  canManageTables: boolean;

  // Orders & KOT
  canCreateOrder: boolean;
  canEditOrder: boolean;
  canSendKot: boolean;
  canViewKot: boolean;
  canUpdateKotStatus: boolean;
  canRequestBill: boolean;

  // Billing & POS
  canAccessPos: boolean;
  canGenerateBill: boolean;
  canProcessPayment: boolean;
  canApplyDiscounts: boolean;

  // Management
  canManageMenu: boolean;
  canManageInventory: boolean;
  canManagePurchases: boolean;
  canManageSuppliers: boolean;
  canManageStaff: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;

  // Delivery
  canManageDelivery: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessAdmin: true,
    canAccessManager: true,
    canAccessCashier: true,
    canAccessWaiter: true,
    canAccessKitchen: true,
    canAccessDelivery: true,
    canViewTables: true,
    canManageTables: true,
    canCreateOrder: true,
    canEditOrder: true,
    canSendKot: true,
    canViewKot: true,
    canUpdateKotStatus: true,
    canRequestBill: true,
    canAccessPos: true,
    canGenerateBill: true,
    canProcessPayment: true,
    canApplyDiscounts: true,
    canManageMenu: true,
    canManageInventory: true,
    canManagePurchases: true,
    canManageSuppliers: true,
    canManageStaff: true,
    canManageSettings: true,
    canViewReports: true,
    canManageDelivery: true,
  },
  manager: {
    canAccessAdmin: false,
    canAccessManager: true,
    canAccessCashier: false,
    canAccessWaiter: false,
    canAccessKitchen: false,
    canAccessDelivery: false,
    canViewTables: true,
    canManageTables: true,
    canCreateOrder: true,
    canEditOrder: true,
    canSendKot: true,
    canViewKot: true,
    canUpdateKotStatus: true,
    canRequestBill: true,
    canAccessPos: true,
    canGenerateBill: true,
    canProcessPayment: true,
    canApplyDiscounts: true,
    canManageMenu: false,
    canManageInventory: true,
    canManagePurchases: true,
    canManageSuppliers: true,
    canManageStaff: false,
    canManageSettings: false,
    canViewReports: true,
    canManageDelivery: true,
  },
  cashier: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessCashier: true,
    canAccessWaiter: false,
    canAccessKitchen: false,
    canAccessDelivery: false,
    canViewTables: true,
    canManageTables: false,
    canCreateOrder: true,
    canEditOrder: true,
    canSendKot: true,
    canViewKot: true,
    canUpdateKotStatus: false,
    canRequestBill: false,
    canAccessPos: true,
    canGenerateBill: true,
    canProcessPayment: true,
    canApplyDiscounts: false,
    canManageMenu: false,
    canManageInventory: false,
    canManagePurchases: false,
    canManageSuppliers: false,
    canManageStaff: false,
    canManageSettings: false,
    canViewReports: false,
    canManageDelivery: false,
  },
  waiter: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessCashier: false,
    canAccessWaiter: true,
    canAccessKitchen: false,
    canAccessDelivery: false,
    canViewTables: true,
    canManageTables: false,
    canCreateOrder: true,
    canEditOrder: true,
    canSendKot: true,
    canViewKot: true,
    canUpdateKotStatus: false,
    canRequestBill: true,
    canAccessPos: false,
    canGenerateBill: false,
    canProcessPayment: false,
    canApplyDiscounts: false,
    canManageMenu: false,
    canManageInventory: false,
    canManagePurchases: false,
    canManageSuppliers: false,
    canManageStaff: false,
    canManageSettings: false,
    canViewReports: false,
    canManageDelivery: false,
  },
  kitchen: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessKitchen: true,
    canAccessCashier: false,
    canAccessWaiter: false,
    canAccessDelivery: false,
    canViewTables: false,
    canManageTables: false,
    canCreateOrder: false,
    canEditOrder: false,
    canSendKot: false,
    canViewKot: true,
    canUpdateKotStatus: true,
    canRequestBill: false,
    canAccessPos: false,
    canGenerateBill: false,
    canProcessPayment: false,
    canApplyDiscounts: false,
    canManageMenu: false,
    canManageInventory: false,
    canManagePurchases: false,
    canManageSuppliers: false,
    canManageStaff: false,
    canManageSettings: false,
    canViewReports: false,
    canManageDelivery: false,
  },
  delivery: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessDelivery: true,
    canAccessCashier: false,
    canAccessWaiter: false,
    canAccessKitchen: false,
    canViewTables: false,
    canManageTables: false,
    canCreateOrder: false,
    canEditOrder: false,
    canSendKot: false,
    canViewKot: false,
    canUpdateKotStatus: false,
    canRequestBill: false,
    canAccessPos: false,
    canGenerateBill: false,
    canProcessPayment: false,
    canApplyDiscounts: false,
    canManageMenu: false,
    canManageInventory: false,
    canManagePurchases: false,
    canManageSuppliers: false,
    canManageStaff: false,
    canManageSettings: false,
    canViewReports: false,
    canManageDelivery: true,
  },
};

/**
 * Role-based permission checks for POS and Floor workflows
 */
export function canOperateDineIn(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[r]?.canViewTables ?? false;
}

export function canAccessAdminPos(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[r]?.canAccessPos ?? false;
}

export function canGenerateBill(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[r]?.canGenerateBill ?? false;
}

export function canProcessPayment(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[r]?.canProcessPayment ?? false;
}

export function canRequestBill(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase() as UserRole;
  return ROLE_PERMISSIONS[r]?.canRequestBill ?? false;
}

export function isKitchenOnly(role?: string | null): boolean {
  return role?.toLowerCase() === "kitchen";
}
