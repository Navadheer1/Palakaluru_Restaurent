"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Restaurant, Branch } from "@/types/database";

export interface AuthProfileData {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: Profile | null;
  restaurant: Restaurant | null;
  branch: Branch | null;
}

export const AUTH_PROFILE_QUERY_KEY = ["auth_profile"] as const;

export function useAuthProfile() {
  const queryClient = useQueryClient();

  const query = useQuery<AuthProfileData>({
    queryKey: AUTH_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Unauthenticated or guest mode fallback
        return {
          user: null,
          profile: null,
          restaurant: null,
          branch: null,
        };
      }

      // Projected columns for profile to prevent fetching unused fields
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, restaurant_id, branch_id, name, full_name, email, role, phone, avatar_url, status, pin_code, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (!profile) {
        const userRole =
          user.user_metadata?.role ||
          (user.email?.includes("waiter") ? "waiter" : user.email?.includes("kitchen") ? "kitchen" : user.email?.includes("cashier") ? "cashier" : "admin");

        const fallbackProfile: Profile = {
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Staff",
          email: user.email || "",
          role: userRole,
          status: "active",
          restaurant_id: user.user_metadata?.restaurant_id || "a0000000-0000-0000-0000-000000000001",
          branch_id: null,
          phone: null,
          avatar_url: null,
          pin_code: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          user: { id: user.id, email: user.email },
          profile: fallbackProfile,
          restaurant: null,
          branch: null,
        };
      }

      // Fetch restaurant & branch in parallel if IDs exist
      const [restRes, branchRes] = await Promise.all([
        profile.restaurant_id
          ? supabase
              .from("restaurants")
              .select("id, name, slug, logo_url, address, phone, email, currency, tax_rate, service_charge_rate, is_active, created_at, updated_at")
              .eq("id", profile.restaurant_id)
              .single()
          : Promise.resolve({ data: null }),
        profile.branch_id
          ? supabase
              .from("branches")
              .select("id, restaurant_id, name, code, address, phone, is_main, is_active, created_at")
              .eq("id", profile.branch_id)
              .single()
          : Promise.resolve({ data: null }),
      ]);

      return {
        user: { id: user.id, email: user.email },
        profile: profile as Profile,
        restaurant: (restRes.data as Restaurant) || null,
        branch: (branchRes.data as Branch) || null,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const invalidateAuthProfile = () => {
    queryClient.invalidateQueries({ queryKey: AUTH_PROFILE_QUERY_KEY });
  };

  return {
    ...query,
    user: query.data?.user ?? null,
    profile: query.data?.profile ?? null,
    restaurant: query.data?.restaurant ?? null,
    branch: query.data?.branch ?? null,
    invalidateAuthProfile,
  };
}
