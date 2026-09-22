"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TableStatus } from "@/lib/constants";

export interface RestaurantTableItem {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  section_id: string | null;
  section_name?: string;
  current_order_id: string | null;
  restaurant_id: string;
  amount?: number;
  timeSpent?: string;
}

export function useTables(restaurantId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["tables", restaurantId];

  const query = useQuery<RestaurantTableItem[]>({
    queryKey,
    queryFn: async () => {
      if (!restaurantId) return [];

      const supabase = createClient();
      // Select only projected columns required by the UI
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id, table_number, capacity, status, section_id, current_order_id, restaurant_id")
        .eq("restaurant_id", restaurantId)
        .order("table_number", { ascending: true });

      if (error) throw error;
      return (data as RestaurantTableItem[]) || [];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 20, // 20s stale time
    gcTime: 1000 * 60 * 5,
  });

  // OPTIMISTIC TABLE STATUS MUTATION
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      tableId,
      newStatus,
    }: {
      tableId: string;
      newStatus: TableStatus;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_tables")
        .update({ status: newStatus })
        .eq("id", tableId)
        .select("id, status")
        .single();

      if (error) throw error;
      return data;
    },
    // When mutate is called:
    onMutate: async ({ tableId, newStatus }) => {
      // 1. Cancel outgoing queries for this key to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot the previous cache state
      const previousTables = queryClient.getQueryData<RestaurantTableItem[]>(queryKey);

      // 3. Optimistically update the local cache immediately
      if (previousTables) {
        queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) =>
          old
            ? old.map((tbl) =>
                tbl.id === tableId ? { ...tbl, status: newStatus } : tbl
              )
            : []
        );
      }

      // Return context with rollback snapshot
      return { previousTables };
    },
    // If mutation fails, rollback to snapshot
    onError: (_err, _variables, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(queryKey, context.previousTables);
      }
    },
    // Always refetch or settle when done to ensure backend consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    tables: query.data || [],
    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}
