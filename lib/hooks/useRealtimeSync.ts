"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { KotTicketRecord } from "./useKds";
import type { RestaurantTableItem } from "./useTables";
import type { Order } from "@/types/database";

/**
 * High-performance scoped Supabase Realtime subscription hook.
 * Directly patches the TanStack Query cache instead of triggering
 * expensive full database refetches on every broadcast.
 */
export function useRealtimeSync(restaurantId?: string | null) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!restaurantId) return;

    const supabase = createClient();
    const channelName = `rms-realtime-${restaurantId}`;

    const channel = supabase
      .channel(channelName)
      // 1. KOT Realtime Stream: patch kitchen cache directly
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kot",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const queryKey = ["kot_tickets", restaurantId];

          if (payload.eventType === "INSERT") {
            const newTicket = payload.new as KotTicketRecord;
            queryClient.setQueryData<KotTicketRecord[]>(queryKey, (old) => {
              if (!old) return [newTicket];
              // Avoid duplicates
              if (old.some((t) => t.id === newTicket.id)) return old;
              return [newTicket, ...old];
            });
            // Also bump dashboard counts
            queryClient.invalidateQueries({
              queryKey: ["dashboard_metrics", restaurantId],
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTicket = payload.new as KotTicketRecord;
            queryClient.setQueryData<KotTicketRecord[]>(queryKey, (old) =>
              old
                ? old.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
                : []
            );
          } else if (payload.eventType === "DELETE") {
            queryClient.setQueryData<KotTicketRecord[]>(queryKey, (old) =>
              old ? old.filter((t) => t.id !== (payload.old as { id: string }).id) : []
            );
          }
        }
      )
      // 2. Tables Realtime Stream: patch live floor plan cache directly
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "restaurant_tables",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const queryKey = ["tables", restaurantId];
          const updatedTable = payload.new as RestaurantTableItem;

          queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) =>
            old
              ? old.map((tbl) =>
                  tbl.id === updatedTable.id ? { ...tbl, ...updatedTable } : tbl
                )
              : []
          );

          // Invalidate metric cards for active table count
          queryClient.invalidateQueries({
            queryKey: ["dashboard_metrics", restaurantId],
          });
        }
      )
      // 3. Orders Realtime Stream: notify order lists and dashboard
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
          queryClient.invalidateQueries({
            queryKey: ["dashboard_metrics", restaurantId],
          });
        }
      )
      .subscribe();

    // Clean up channel on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);
}
