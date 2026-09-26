"use client";

import { useAuthProfile } from "./useAuthProfile";
import {
  UserRole,
  ROLE_PERMISSIONS,
  RolePermissions,
  canOperateDineIn,
  canAccessAdminPos,
  canGenerateBill,
  canProcessPayment,
  canRequestBill,
  isKitchenOnly,
} from "@/lib/constants";

const DEFAULT_DENIED_PERMISSIONS: RolePermissions = {
  canAccessAdmin: false,
  canAccessManager: false,
  canAccessCashier: false,
  canAccessWaiter: false,
  canAccessKitchen: false,
  canAccessDelivery: false,
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
  canManageDelivery: false,
};

/**
 * Single source of truth for Role & Permissions.
 * Strictly derived from the authenticated profile.
 * Navigation, state, or storage cannot override this.
 */
export function useRolePermissions() {
  const { profile, user, isLoading } = useAuthProfile();

  const activeRole: UserRole | null = (profile?.role as UserRole) || null;
  const permissions: RolePermissions = activeRole
    ? ROLE_PERMISSIONS[activeRole] || DEFAULT_DENIED_PERMISSIONS
    : DEFAULT_DENIED_PERMISSIONS;

  return {
    profile,
    user,
    isLoading,
    activeRole,
    permissions,
    // Explicit role checks
    isAdmin: activeRole === "admin",
    isManager: activeRole === "manager",
    isCashier: activeRole === "cashier",
    isWaiter: activeRole === "waiter",
    isKitchen: activeRole === "kitchen",
    isDelivery: activeRole === "delivery",
    // Functional permissions
    canDineIn: canOperateDineIn(activeRole),
    canAdminPos: canAccessAdminPos(activeRole),
    canBill: canGenerateBill(activeRole),
    canPay: canProcessPayment(activeRole),
    canRequestBill: canRequestBill(activeRole),
    isKitchenOnly: isKitchenOnly(activeRole),
    // Deprecated compatibility dummies
    isRoleOverridden: false,
    setRoleOverride: (_role: UserRole | null) => {
      console.warn("Role switching is disabled. User role is immutable from frontend.");
    },
  };
}
