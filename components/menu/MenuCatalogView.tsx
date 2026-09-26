"use client";

import * as React from "react";
import { BookOpen, Plus, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog";

export function MenuCatalogView() {
  const { profile } = useAuthProfile();
  const { data, isLoading } = useMenuCatalog(profile?.restaurant_id);
  const categories = data?.categories || [];
  const items = data?.items || [];

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-brand-600" />
            Menu Catalog & Pricing
          </h1>
          <p className="text-xs text-slate-500">
            Organize dishes, categories, variants, addons, and kitchen station routing
          </p>
        </div>
        <Button variant="primary" size="sm" className="space-x-1.5">
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading menu catalog...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <UtensilsCrossed className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No menu items created yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add dishes, beverages, and appetizers to build your restaurant catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Dish Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Prep Time</th>
                  <th className="p-3.5">Station</th>
                  <th className="p-3.5">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {categoryMap.get(item.category_id) || "General"}
                    </td>
                    <td className="p-3.5 font-bold text-brand-600">{formatCurrency(item.base_price)}</td>
                    <td className="p-3.5 text-slate-500">{item.preparation_time_mins ? `${item.preparation_time_mins}m` : "—"}</td>
                    <td className="p-3.5 text-slate-500">{item.kitchen_station || "Main Kitchen"}</td>
                    <td className="p-3.5">
                      <Badge variant={item.is_available ? "success" : "secondary"}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
