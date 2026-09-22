"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types/database";

export interface OrdersFilterOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  orderType?: string;
  search?: string;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useOrders(
  restaurantId?: string | null,
  options: OrdersFilterOptions = {}
) {
  const { page = 1, pageSize = 25, status, orderType, search } = options;

  return useQuery<PaginatedOrdersResponse>({
    queryKey: ["orders", restaurantId, page, pageSize, status, orderType, search],
    queryFn: async () => {
      if (!restaurantId) {
        return { orders: [], totalCount: 0, page, pageSize, totalPages: 0 };
      }

      const supabase = createClient();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("orders")
        .select(
          "id, order_number, restaurant_id, branch_id, customer_id, table_id, order_type, status, subtotal, discount_amount, tax_amount, total_amount, payment_status, created_at",
          { count: "exact" }
        )
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      if (orderType && orderType !== "all") {
        query = query.eq("order_type", orderType);
      }
      if (search && search.trim()) {
        query = query.ilike("order_number", `%${search.trim()}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const total = count || 0;
      return {
        orders: (data as Order[]) || [],
        totalCount: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 20, // 20s
    gcTime: 1000 * 60 * 5,
  });
}
