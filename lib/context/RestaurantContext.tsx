"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface RestaurantItem {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  phone?: string | null;
  email?: string | null;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BranchItem {
  id: string;
  restaurant_id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at?: string;
}

interface RestaurantContextType {
  restaurant: RestaurantItem | null;
  branch: BranchItem | null;
  branches: BranchItem[];
  restaurantId: string | null;
  branchId: string | null;
  setActiveBranchId: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const RestaurantContext = React.createContext<RestaurantContextType | undefined>(undefined);

export const RESTAURANT_QUERY_KEY = ["current-restaurant"] as const;
export const BRANCHES_QUERY_KEY = (restaurantId: string | null) =>
  ["current-branches", restaurantId] as const;

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = React.useState<string | null>(null);

  // 1. Fetch the active restaurant from public.restaurants
  const {
    data: restaurant,
    isLoading: isLoadingRestaurant,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useQuery<RestaurantItem | null>({
    queryKey: RESTAURANT_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to load restaurant from Supabase:", error);
        throw new Error(error.message);
      }

      return data as RestaurantItem | null;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const restaurantId = restaurant?.id || null;

  // 2. Fetch branches for the active restaurant from public.branches
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    error: branchesError,
    refetch: refetchBranches,
  } = useQuery<BranchItem[]>({
    queryKey: BRANCHES_QUERY_KEY(restaurantId),
    queryFn: async () => {
      if (!restaurantId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("is_main", { ascending: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed to load branches from Supabase:", error);
        throw new Error(error.message);
      }

      return (data || []) as BranchItem[];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Resolve active branch
  const activeBranch = React.useMemo(() => {
    if (branches.length === 0) return null;
    if (selectedBranchId) {
      const found = branches.find((b) => b.id === selectedBranchId);
      if (found) return found;
    }
    const mainBranch = branches.find((b) => b.is_main);
    return mainBranch || branches[0] || null;
  }, [branches, selectedBranchId]);

  const branchId = activeBranch?.id || null;

  const setActiveBranchId = React.useCallback((id: string) => {
    setSelectedBranchId(id);
  }, []);

  const refetch = React.useCallback(async () => {
    await Promise.all([refetchRestaurant(), refetchBranches()]);
  }, [refetchRestaurant, refetchBranches]);

  const value = React.useMemo<RestaurantContextType>(
    () => ({
      restaurant: restaurant || null,
      branch: activeBranch,
      branches,
      restaurantId,
      branchId,
      setActiveBranchId,
      isLoading: isLoadingRestaurant || isLoadingBranches,
      error: (restaurantError as Error) || (branchesError as Error) || null,
      refetch,
    }),
    [
      restaurant,
      activeBranch,
      branches,
      restaurantId,
      branchId,
      setActiveBranchId,
      isLoadingRestaurant,
      isLoadingBranches,
      restaurantError,
      branchesError,
      refetch,
    ]
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurantContext(): RestaurantContextType {
  const context = React.useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurantContext must be used within a RestaurantProvider");
  }
  return context;
}

export function useOptionalRestaurantContext(): RestaurantContextType | null {
  return React.useContext(RestaurantContext) || null;
}

