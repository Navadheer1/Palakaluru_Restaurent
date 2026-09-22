"use client";

import * as React from "react";
import { ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const purchaseOrders = [
  { id: "PO-301", supplier: "Guntur Wholesale Spices", items: 4, total: 14500, status: "received", date: "21 Sep 2026" },
  { id: "PO-302", supplier: "Krishna Dairy Cooperative", items: 2, total: 5800, status: "ordered", date: "22 Sep 2026" },
  { id: "PO-303", supplier: "Royal Poultry Farms", items: 3, total: 9200, status: "draft", date: "22 Sep 2026" },
];

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2 text-brand-600" />
            Purchase Orders & Stock Procurement
          </h1>
          <p className="text-xs text-slate-500">
            Create vendor orders, receive stock, and automatically sync inventory levels
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create PO
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">PO Number</th>
              <th className="p-3.5">Supplier</th>
              <th className="p-3.5">Items</th>
              <th className="p-3.5">Total Cost</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-brand-600">{po.id}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{po.supplier}</td>
                <td className="p-3.5 text-slate-500">{po.items} items</td>
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(po.total)}</td>
                <td className="p-3.5">
                  <Badge variant={po.status === "received" ? "success" : po.status === "ordered" ? "info" : "secondary"}>
                    {po.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5 text-slate-400">{po.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
