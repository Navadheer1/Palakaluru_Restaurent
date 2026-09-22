"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface StockAlert {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

const lowStockItems: StockAlert[] = [
  { id: "1", name: "Pure Desi Ghee", currentStock: 8.5, minStock: 10, unit: "L" },
  { id: "2", name: "Malai Paneer Cubes", currentStock: 2.0, minStock: 5.0, unit: "kg" },
  { id: "3", name: "Kashmiri Red Chilli Powder", currentStock: 1.2, minStock: 3.0, unit: "kg" },
];

export function LowStockWidget() {
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

      <div className="space-y-3">
        {lowStockItems.map((item) => {
          const percent = Math.min(100, Math.round((item.currentStock / item.minStock) * 100));

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
                  {item.currentStock} {item.unit} left
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
                  Min: {item.minStock} {item.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
