"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TableStatus } from "@/lib/constants";
import { useDineInStore } from "@/stores/useDineInStore";

export interface RestaurantTableItem {
  id: string;
  table_number: string;
  display_name?: string | null;
  capacity: number;
  status: TableStatus;
  section_id: string | null;
  section_name?: string;
  floor?: number;
  description?: string | null;
  current_order_id: string | null;
  restaurant_id: string;
  branch_id?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  amount?: number;
  timeSpent?: string;
}

export interface TableSectionItem {
  id: string;
  restaurant_id: string;
  branch_id?: string | null;
  name: string;
  floor: number;
  is_active: boolean;
  created_at?: string;
}

export interface AddTableInput {
  table_number: string;
  capacity: number;
  display_name?: string;
  section_name?: string;
  section_id?: string | null;
  description?: string;
  status?: TableStatus;
  is_active?: boolean;
  restaurant_id?: string;
  branch_id?: string;
}

export interface UpdateTableInput {
  id: string;
  table_number: string;
  capacity: number;
  display_name?: string;
  section_name?: string;
  section_id?: string | null;
  description?: string;
  is_active?: boolean;
  status?: TableStatus;
  restaurant_id?: string;
  branch_id?: string;
}

export interface UseTablesOptions {
  restaurantId?: string | null;
  branchId?: string | null;
}

export function useTables(
  restaurantIdOrOptions?: string | null | UseTablesOptions,
  optionalBranchId?: string | null
) {
  const queryClient = useQueryClient();

  const resolvedRestaurantId =
    typeof restaurantIdOrOptions === "object" && restaurantIdOrOptions !== null
      ? restaurantIdOrOptions.restaurantId
      : restaurantIdOrOptions;

  const resolvedBranchId =
    typeof restaurantIdOrOptions === "object" && restaurantIdOrOptions !== null
      ? restaurantIdOrOptions.branchId
      : optionalBranchId;

  // Standard TanStack Query keys requested for multi-tenant isolation
  const queryKey = React.useMemo(
    () => ["restaurant-tables", resolvedRestaurantId, resolvedBranchId],
    [resolvedRestaurantId, resolvedBranchId]
  );
  const sectionsKey = React.useMemo(
    () => ["table-sections", resolvedRestaurantId, resolvedBranchId],
    [resolvedRestaurantId, resolvedBranchId]
  );

  const [isSchemaMissing, setIsSchemaMissing] = React.useState(false);

  // 1. Fetch sections list from database (NO mock fallbacks)
  const sectionsQuery = useQuery<TableSectionItem[]>({
    queryKey: sectionsKey,
    queryFn: async () => {
      if (!resolvedRestaurantId) return [];
      const supabase = createClient();

      let q = supabase
        .from("table_sections")
        .select("id, restaurant_id, branch_id, name, floor, is_active, created_at")
        .eq("restaurant_id", resolvedRestaurantId)
        .eq("is_active", true);

      if (resolvedBranchId) {
        q = q.eq("branch_id", resolvedBranchId);
      }

      const { data, error } = await q
        .order("floor", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("[useTables] Failed to load table_sections:", error);
        if (
          error.code === "PGRST200" ||
          error.message.includes("schema cache") ||
          error.message.includes("table_sections")
        ) {
          setIsSchemaMissing(true);
        }
        throw new Error(error.message);
      }

      setIsSchemaMissing(false);
      return (data || []).map((s: any) => ({
        ...s,
        floor: typeof s.floor === "number" ? s.floor : 1,
      })) as TableSectionItem[];
    },
    enabled: !!resolvedRestaurantId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  // 2. Fetch tables with section mapping from database
  const query = useQuery<RestaurantTableItem[]>({
    queryKey,
    queryFn: async () => {
      if (!resolvedRestaurantId) return [];
      const supabase = createClient();

      // Get sections data from cache or fresh query to map section names and floors
      const sections = sectionsQuery.data || [];
      const sectionMap = new Map<string, { name: string; floor: number }>();
      sections.forEach((s) => sectionMap.set(s.id, { name: s.name, floor: s.floor }));

      let q = supabase
        .from("restaurant_tables")
        .select(
          "id, table_number, display_name, description, capacity, status, section_id, current_order_id, restaurant_id, branch_id, is_active, created_at, updated_at"
        )
        .eq("restaurant_id", resolvedRestaurantId);

      if (resolvedBranchId) {
        q = q.eq("branch_id", resolvedBranchId);
      }

      const { data, error } = await q.order("table_number", { ascending: true });

      if (error) {
        console.error("[useTables] Could not query restaurant_tables:", error);
        if (
          error.code === "PGRST200" ||
          error.message.includes("schema cache") ||
          error.message.includes("restaurant_tables")
        ) {
          setIsSchemaMissing(true);
        }
        throw new Error(error.message);
      }

      setIsSchemaMissing(false);

      return (data || []).map((t: any) => {
        const secInfo = t.section_id ? sectionMap.get(t.section_id) : undefined;
        return {
          ...t,
          is_active: t.is_active ?? true,
          section_name: secInfo?.name || "Main Hall",
          floor: secInfo?.floor || 1,
        };
      }) as RestaurantTableItem[];
    },
    enabled: !!resolvedRestaurantId,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
  });

  // 3. Realtime Subscription: Subscribe to changes on restaurant_tables and table_sections
  React.useEffect(() => {
    if (!resolvedRestaurantId) return;

    const supabase = createClient();
    const channelName = `realtime-tables-${resolvedRestaurantId}-${resolvedBranchId || "all"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `restaurant_id=eq.${resolvedRestaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "table_sections",
          filter: `restaurant_id=eq.${resolvedRestaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: sectionsKey });
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedRestaurantId, resolvedBranchId, queryClient, queryKey, sectionsKey]);

  // 4. MUTATION: Add Table
  const addTableMutation = useMutation({
    mutationFn: async (input: AddTableInput) => {
      const supabase = createClient();

      const targetRestaurantId = input.restaurant_id || resolvedRestaurantId;
      const targetBranchId = input.branch_id || resolvedBranchId;

      if (!targetRestaurantId) {
        throw new Error("Restaurant context is required to create a table.");
      }
      if (!targetBranchId) {
        throw new Error("Branch context is required to create a table.");
      }

      const trimmedNumber = input.table_number ? input.table_number.trim() : "";
      if (!trimmedNumber) {
        throw new Error("Table number / identifier is required (e.g. T1, VIP-01).");
      }

      const capacityNum = Number(input.capacity);
      if (!capacityNum || isNaN(capacityNum) || capacityNum < 1) {
        throw new Error("Seating capacity must be at least 1 person.");
      }

      // Check duplicate locally against current active cache
      const existingTables = queryClient.getQueryData<RestaurantTableItem[]>(queryKey) || [];
      const duplicate = existingTables.some(
        (t) => t.table_number.toLowerCase() === trimmedNumber.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Table ${trimmedNumber} already exists.`);
      }

      // Check or resolve section
      let resolvedSectionId = input.section_id || null;
      if (!resolvedSectionId && input.section_name && input.section_name.trim()) {
        const trimmedSecName = input.section_name.trim();
        try {
          const { data: existingSec } = await supabase
            .from("table_sections")
            .select("id")
            .eq("restaurant_id", targetRestaurantId)
            .ilike("name", trimmedSecName)
            .maybeSingle();

          if (existingSec?.id) {
            resolvedSectionId = existingSec.id;
          } else {
            const { data: newSec, error: secErr } = await supabase
              .from("table_sections")
              .insert({
                restaurant_id: targetRestaurantId,
                branch_id: targetBranchId,
                name: trimmedSecName,
                floor: 1,
                is_active: true,
              })
              .select("id")
              .single();

            if (newSec?.id) {
              resolvedSectionId = newSec.id;
              queryClient.invalidateQueries({ queryKey: sectionsKey });
            } else if (secErr) {
              console.warn("Could not insert table_section:", secErr.message);
            }
          }
        } catch (err: any) {
          console.warn("Section resolution error:", err?.message);
        }
      }

      const newTablePayload = {
        restaurant_id: targetRestaurantId,
        branch_id: targetBranchId,
        section_id: resolvedSectionId || null,
        table_number: trimmedNumber,
        display_name: input.display_name?.trim() || trimmedNumber,
        capacity: capacityNum,
        status: input.status || "available",
        description: input.description?.trim() || null,
        is_active: input.is_active ?? true,
      };

      console.log("[useTables] Inserting table into restaurant_tables:", newTablePayload);

      const { data, error } = await supabase
        .from("restaurant_tables")
        .insert(newTablePayload)
        .select()
        .single();

      if (error) {
        console.error("CREATE TABLE ERROR:", error);
        if (error.code === "23505" || error.message.includes("unique")) {
          throw new Error(`Table ${trimmedNumber} already exists.`);
        }
        if (
          error.code === "PGRST200" ||
          error.message.includes("schema cache") ||
          error.message.includes("restaurant_tables")
        ) {
          setIsSchemaMissing(true);
        }
        throw new Error(error.message || "Failed to create table in database.");
      }

      return {
        ...data,
        section_name: input.section_name?.trim() || "Main Hall",
      } as RestaurantTableItem;
    },
    onSuccess: (newTable) => {
      queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) => {
        if (!old) return [newTable];
        return [...old.filter((t) => t.id !== newTable.id), newTable].sort((a, b) =>
          a.table_number.localeCompare(b.table_number)
        );
      });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: sectionsKey });
    },
  });

  // 5. MUTATION: Update Table
  const updateTableMutation = useMutation({
    mutationFn: async (input: UpdateTableInput) => {
      const supabase = createClient();

      const targetRestaurantId = input.restaurant_id || resolvedRestaurantId;
      const targetBranchId = input.branch_id || resolvedBranchId;

      const trimmedNumber = input.table_number ? input.table_number.trim() : "";
      if (!trimmedNumber) throw new Error("Table number / identifier is required");
      if (!input.capacity || Number(input.capacity) < 1) throw new Error("Capacity must be at least 1");

      const existingTables = queryClient.getQueryData<RestaurantTableItem[]>(queryKey) || [];
      const duplicate = existingTables.some(
        (t) => t.id !== input.id && t.table_number.toLowerCase() === trimmedNumber.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Table ${trimmedNumber} already exists.`);
      }

      const updatePayload: any = {
        table_number: trimmedNumber,
        display_name: input.display_name?.trim() || trimmedNumber,
        description: input.description?.trim() || null,
        capacity: Number(input.capacity),
        section_id: input.section_id || null,
        is_active: input.is_active ?? true,
      };

      if (targetRestaurantId) updatePayload.restaurant_id = targetRestaurantId;
      if (targetBranchId) updatePayload.branch_id = targetBranchId;
      if (input.status) updatePayload.status = input.status;

      const { data, error } = await supabase
        .from("restaurant_tables")
        .update(updatePayload)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        console.error("UPDATE TABLE ERROR:", error);
        if (error.code === "23505" || error.message.includes("unique")) {
          throw new Error(`Table ${trimmedNumber} already exists.`);
        }
        throw new Error(error.message || "Failed to update table.");
      }

      return {
        ...data,
        section_name: input.section_name?.trim() || "Main Hall",
      } as RestaurantTableItem;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) => {
        if (!old) return [updated];
        return old.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
      });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: sectionsKey });
    },
  });

  // 6. MUTATION: Delete Table
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const supabase = createClient();

      // Check active orders / sessions
      const dineInStore = useDineInStore.getState();
      const localSession = dineInStore.sessions[tableId];
      if (
        localSession &&
        localSession.status !== "completed" &&
        localSession.status !== "closed" &&
        localSession.paymentStatus !== "paid" &&
        (localSession.sentItems.length > 0 || localSession.kots.length > 0)
      ) {
        throw new Error("This table cannot be deleted because it currently has an active order.");
      }

      // Check table status in DB
      const { data: tableData } = await supabase
        .from("restaurant_tables")
        .select("status, table_number")
        .eq("id", tableId)
        .maybeSingle();

      if (
        tableData &&
        ["occupied", "waiting_for_food", "food_ready", "bill_requested", "billing"].includes(
          tableData.status
        )
      ) {
        throw new Error("This table cannot be deleted because it currently has an active order.");
      }

      const { error: delErr } = await supabase
        .from("restaurant_tables")
        .delete()
        .eq("id", tableId);

      if (delErr) {
        console.error("DELETE TABLE ERROR:", delErr);
        throw new Error(delErr.message || "Failed to delete table.");
      }

      return { id: tableId };
    },
    onSuccess: ({ id }) => {
      queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) => {
        if (!old) return [];
        return old.filter((t) => t.id !== id);
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 7. MUTATION: Toggle Active / Inactive
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ tableId, isActive }: { tableId: string; isActive: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("restaurant_tables")
        .update({ is_active: isActive })
        .eq("id", tableId)
        .select()
        .single();

      if (error) {
        console.error("TOGGLE ACTIVE ERROR:", error);
        throw new Error(error.message || "Failed to change table active state.");
      }
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((t) => (t.id === updated.id ? { ...t, is_active: updated.is_active } : t));
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 8. OPTIMISTIC TABLE STATUS MUTATION
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
    onMutate: async ({ tableId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTables = queryClient.getQueryData<RestaurantTableItem[]>(queryKey);

      if (previousTables) {
        queryClient.setQueryData<RestaurantTableItem[]>(queryKey, (old) =>
          old ? old.map((tbl) => (tbl.id === tableId ? { ...tbl, status: newStatus } : tbl)) : []
        );
      }

      return { previousTables };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(queryKey, context.previousTables);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const allTables = query.data || [];
  const activeTables = allTables.filter((t) => t.is_active !== false);

  const rawSections = sectionsQuery.data || [];
  const sectionNames = Array.from(new Set(rawSections.map((s) => s.name)));

  return {
    ...query,
    tables: activeTables,
    allTables,
    sections: sectionNames,
    sectionsList: rawSections,
    isLoadingSections: sectionsQuery.isLoading,
    sectionsError: sectionsQuery.error,
    restaurantId: resolvedRestaurantId,
    branchId: resolvedBranchId,
    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    addTable: addTableMutation.mutate,
    addTableAsync: addTableMutation.mutateAsync,
    isAddingTable: addTableMutation.isPending,
    updateTable: updateTableMutation.mutate,
    updateTableAsync: updateTableMutation.mutateAsync,
    isUpdatingTable: updateTableMutation.isPending,
    deleteTable: deleteTableMutation.mutate,
    deleteTableAsync: deleteTableMutation.mutateAsync,
    isDeletingTable: deleteTableMutation.isPending,
    toggleActive: toggleActiveMutation.mutate,
    toggleActiveAsync: toggleActiveMutation.mutateAsync,
    isTogglingActive: toggleActiveMutation.isPending,
    isSchemaMissing,
  };
}
