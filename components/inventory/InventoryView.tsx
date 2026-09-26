"use client";

import * as React from "react";
import { Boxes, Plus, ArrowDownUp, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";
import { InventoryItem } from "@/types/database";

export function InventoryView() {
  const { profile } = useAuthProfile();
  const [stockList, setStockList] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchInventory = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("restaurant_id", profile.restaurant_id)
          .order("name", { ascending: true });

        if (!error && data && isSubscribed) {
          setStockList(data as InventoryItem[]);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchInventory();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <Boxes className="h-6 w-6 mr-2 text-brand-600" />
            Inventory & Ingredient Stock
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock ledger, minimum threshold tracking, and recipe-level deductions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <ArrowDownUp className="h-4 w-4 mr-1.5" />
            Stock Adjustment
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Ingredient
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading inventory ledger...</div>
        ) : stockList.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No inventory items recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add raw ingredients and stock levels to track inventory and calculate consumption.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Ingredient</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Minimum Stock</th>
                  <th className="p-3.5">Cost / Unit</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockList.map((item) => {
                  const isLow = item.current_stock <= (item.minimum_stock || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                      <td className="p-3.5 font-mono text-slate-400">{item.sku || "—"}</td>
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {item.minimum_stock} {item.unit}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.cost_per_unit || 0)} / {item.unit}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={isLow ? "warning" : "success"}>
                          {isLow ? "Low Stock Alert" : "In Stock"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
