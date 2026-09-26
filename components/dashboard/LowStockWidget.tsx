"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";
import { InventoryItem } from "@/types/database";

export function LowStockWidget() {
  const { profile } = useAuthProfile();
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchLowStock = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("restaurant_id", profile.restaurant_id)
          .order("current_stock", { ascending: true })
          .limit(5);

        if (!error && data && isSubscribed) {
          // Filter to items where current_stock is less than or equal to minimum_stock
          const low = (data as InventoryItem[]).filter(
            (i) => i.current_stock <= (i.minimum_stock || 0)
          );
          setItems(low);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchLowStock();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Low Stock Alerts
            </h3>
            <p className="text-[11px] text-slate-500">Items requiring restock</p>
          </div>
        </div>
        <Link
          href="/inventory"
          className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Inventory →
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Checking inventory levels...</div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All inventory in stock</p>
          <p className="text-[11px] text-slate-400 mt-0.5">No ingredients below minimum threshold.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const min = item.minimum_stock || 1;
            const percent = Math.min(100, Math.round((item.current_stock / min) * 100));

            return (
              <div
                key={item.id}
                className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.name}
                  </span>
                  <Badge variant="warning">
                    {item.current_stock} {item.unit} left
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-2 flex items-center space-x-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Min: {item.minimum_stock} {item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
