"use client";

import * as React from "react";
import Link from "next/link";
import { Receipt, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/lib/../components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface OrderItemPreview {
  id: string;
  orderNumber: string;
  type: "dine_in" | "takeaway" | "delivery" | "online";
  target: string;
  itemSummary: string;
  amount: number;
  status: "new" | "preparing" | "ready" | "served" | "completed";
  time: string;
}

const recentOrders: OrderItemPreview[] = [
  {
    id: "1",
    orderNumber: "#ORD-1048",
    type: "dine_in",
    target: "Table 04 (AC Hall)",
    itemSummary: "1x Dum Biryani, 2x Butter Naan",
    amount: 400,
    status: "ready",
    time: "2m ago",
  },
  {
    id: "2",
    orderNumber: "#ORD-1047",
    type: "delivery",
    target: "Srinivas Rao (Palakaluru)",
    itemSummary: "2x Mutton Biryani, 1x Guntur Chilli Chicken",
    amount: 1100,
    status: "preparing",
    time: "8m ago",
  },
  {
    id: "3",
    orderNumber: "#ORD-1046",
    type: "dine_in",
    target: "Table 01 (AC Hall)",
    itemSummary: "1x Paneer Tikka, 1x Mango Lassi",
    amount: 330,
    status: "served",
    time: "18m ago",
  },
  {
    id: "4",
    orderNumber: "#ORD-1045",
    type: "takeaway",
    target: "Counter Pickup",
    itemSummary: "1x Family Pack Biryani",
    amount: 650,
    status: "new",
    time: "22m ago",
  },
];

const statusBadgeMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" }> = {
  new: { label: "New Order", variant: "warning" },
  preparing: { label: "Cooking", variant: "info" },
  ready: { label: "Ready", variant: "success" },
  served: { label: "Served", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
};

export function RecentOrdersWidget() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Orders Queue
          </h3>
          <p className="text-xs text-slate-500">Live order lifecycle stream</p>
        </div>
        <Link
          href="/orders"
          className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          All Orders →
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {recentOrders.map((order) => {
          const badge = statusBadgeMap[order.status] || { label: order.status, variant: "secondary" };

          return (
            <Link
              key={order.id}
              href={`/orders?id=${order.id}`}
              className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Receipt className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">
                      {order.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {order.target}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {order.itemSummary}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1 shrink-0 ml-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.amount)}
                </span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <span className="flex items-center text-[10px] text-slate-400">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  {order.time}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
