"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface KotItemRecord {
  id: string;
  name: string;
  quantity: number;
  instructions?: string | null;
  status?: string;
}

export interface KotTicketRecord {
  id: string;
  kot_number: string;
  order_id: string;
  restaurant_id: string;
  table_id: string | null;
  order_type: string;
  status: "not_sent" | "sent" | "new" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
  notes?: string | null;
  sent_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  created_at: string;
  items?: KotItemRecord[];
}

export function useKds(restaurantId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["kot_tickets", restaurantId];

  const query = useQuery<KotTicketRecord[]>({
    queryKey,
    queryFn: async () => {
      if (!restaurantId) return [];

      const supabase = createClient();
      // Select projected columns for KOT and nested KOT items
      const { data, error } = await supabase
        .from("kot")
        .select(`
          id,
          kot_number,
          order_id,
          restaurant_id,
          table_id,
          order_type,
          status,
          notes,
          sent_at,
          created_at,
          items:kot_items(id, name, quantity, instructions, status)
        `)
        .eq("restaurant_id", restaurantId)
        .in("status", ["sent", "new", "accepted", "preparing", "ready"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as unknown as KotTicketRecord[]) || [];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 15, // 15s fresh
    gcTime: 1000 * 60 * 5,
  });

  // OPTIMISTIC KOT STATUS TRANSITION MUTATION
  const updateKotStatusMutation = useMutation({
    mutationFn: async ({
      kotId,
      newStatus,
    }: {
      kotId: string;
      newStatus: KotTicketRecord["status"];
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("kot")
        .update({ status: newStatus })
        .eq("id", kotId)
        .select("id, status")
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ kotId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTickets = queryClient.getQueryData<KotTicketRecord[]>(queryKey);

      if (previousTickets) {
        queryClient.setQueryData<KotTicketRecord[]>(queryKey, (old) =>
          old
            ? old.map((t) => (t.id === kotId ? { ...t, status: newStatus } : t))
            : []
        );
      }

      return { previousTickets };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(queryKey, context.previousTickets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    tickets: query.data || [],
    updateKotStatus: updateKotStatusMutation.mutate,
    updateKotStatusAsync: updateKotStatusMutation.mutateAsync,
    isUpdating: updateKotStatusMutation.isPending,
  };
}
