"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface DashboardMetrics {
  todaySales: number;
  todayOrders: number;
  activeTables: number;
  pendingKitchen: number;
  activeDeliveries: number;
}

export function useDashboardMetrics(restaurantId?: string | null) {
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard_metrics", restaurantId],
    queryFn: async () => {
      if (!restaurantId) {
        return {
          todaySales: 0,
          todayOrders: 0,
          activeTables: 0,
          pendingKitchen: 0,
          activeDeliveries: 0,
        };
      }

      const supabase = createClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const isoToday = todayStart.toISOString();

      // Run all 4 metric queries in PARALLEL rather than sequentially
      const [ordersRes, tablesRes, kotRes, deliveryRes] = await Promise.all([
        // 1. Orders & Sales: Only fetch total_amount and status, filtered by date
        supabase
          .from("orders")
          .select("total_amount, status")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", isoToday),

        // 2. Active Tables count (head: true to prevent fetching body rows)
        supabase
          .from("restaurant_tables")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .eq("status", "occupied"),

        // 3. Pending Kitchen Orders count
        supabase
          .from("kot")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .in("status", ["new", "accepted", "preparing"]),

        // 4. Active Deliveries count
        supabase
          .from("delivery_orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["ready_for_delivery", "assigned", "out_for_delivery"]),
      ]);

      const orders = ordersRes.data || [];
      const orderCount = orders.length;
      const salesSum = orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      return {
        todaySales: salesSum,
        todayOrders: orderCount,
        activeTables: tablesRes.count || 0,
        pendingKitchen: kotRes.count || 0,
        activeDeliveries: deliveryRes.count || 0,
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 15, // 15 seconds fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache retention
    refetchOnWindowFocus: false,
  });
}
