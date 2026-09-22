"use client";

import * as React from "react";
import { Boxes, Plus, AlertTriangle, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const stockList = [
  { id: "1", name: "Basmati Rice Premium", sku: "ING-RICE-01", stock: 120, min: 30, unit: "kg", cost: 110, status: "in_stock" },
  { id: "2", name: "Fresh Farm Chicken", sku: "ING-CHIK-01", stock: 45, min: 15, unit: "kg", cost: 180, status: "in_stock" },
  { id: "3", name: "Pure Desi Ghee", sku: "ING-GHEE-01", stock: 8.5, min: 10, unit: "L", cost: 580, status: "low_stock" },
  { id: "4", name: "Malai Paneer Cubes", sku: "ING-PAN-01", stock: 2.0, min: 5.0, unit: "kg", cost: 320, status: "low_stock" },
];

export default function InventoryPage() {
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
              {stockList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="p-3.5 font-mono text-slate-400">{item.sku}</td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                    {item.stock} {item.unit}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {item.min} {item.unit}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.cost)} / {item.unit}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={item.status === "low_stock" ? "warning" : "success"}>
                      {item.status === "low_stock" ? "Low Stock Alert" : "In Stock"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
