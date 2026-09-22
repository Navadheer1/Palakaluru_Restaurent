"use client";

import * as React from "react";
import { useAuthProfile } from "./useAuthProfile";
import {
  UserRole,
  canOperateDineIn,
  canAccessAdminPos,
  canGenerateBill,
  canProcessPayment,
  canRequestBill,
  isKitchenOnly,
} from "@/lib/constants";

// Global in-memory override for live role testing
let globalRoleOverride: UserRole | null = null;
const listeners = new Set<() => void>();

export function setTestRoleOverride(role: UserRole | null) {
  globalRoleOverride = role;
  if (typeof window !== "undefined") {
    if (role) {
      sessionStorage.setItem("culina_test_role", role);
    } else {
      sessionStorage.removeItem("culina_test_role");
    }
  }
  listeners.forEach((l) => l());
}

export function useRolePermissions() {
  const { profile, user, isLoading } = useAuthProfile();
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !globalRoleOverride) {
      const stored = sessionStorage.getItem("culina_test_role") as UserRole | null;
      if (stored) {
        globalRoleOverride = stored;
      }
    }

    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const activeRole: UserRole =
    globalRoleOverride || profile?.role || "admin";

  return {
    profile,
    user,
    isLoading,
    activeRole,
    isRoleOverridden: !!globalRoleOverride,
    setRoleOverride: setTestRoleOverride,
    canDineIn: canOperateDineIn(activeRole),
    canAdminPos: canAccessAdminPos(activeRole),
    canBill: canGenerateBill(activeRole),
    canPay: canProcessPayment(activeRole),
    canRequestBill: canRequestBill(activeRole),
    isKitchen: isKitchenOnly(activeRole),
  };
}
