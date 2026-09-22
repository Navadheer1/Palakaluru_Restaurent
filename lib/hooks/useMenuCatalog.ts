"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { MenuItem, MenuCategory } from "@/types/database";

export interface MenuCatalogData {
  categories: MenuCategory[];
  items: MenuItem[];
}

export function useMenuCatalog(restaurantId?: string | null) {
  return useQuery<MenuCatalogData>({
    queryKey: ["menu_catalog", restaurantId],
    queryFn: async () => {
      if (!restaurantId) {
        return { categories: [], items: [] };
      }

      const supabase = createClient();

      // Parallel fetch categories and items with projected fields
      const [catRes, itemsRes] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("id, restaurant_id, name, description, image_url, sort_order, is_active, created_at")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        supabase
          .from("menu_items")
          .select("id, restaurant_id, category_id, name, description, image_url, base_price, tax_rate, sku, preparation_time_mins, kitchen_station, is_available, is_active, created_at, updated_at")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("name", { ascending: true }),
      ]);

      if (catRes.error) throw catRes.error;
      if (itemsRes.error) throw itemsRes.error;

      return {
        categories: (catRes.data as MenuCategory[]) || [],
        items: (itemsRes.data as MenuItem[]) || [],
      };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes in memory
    refetchOnWindowFocus: false,
  });
}
