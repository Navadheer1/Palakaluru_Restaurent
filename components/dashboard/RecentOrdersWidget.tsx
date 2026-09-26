"use client";

import * as React from "react";
import Link from "next/link";
import { Receipt, Clock, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useOrders } from "@/lib/hooks/useOrders";

const statusBadgeMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" }> = {
  pending: { label: "Pending", variant: "warning" },
  new: { label: "New Order", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  preparing: { label: "Cooking", variant: "info" },
  ready: { label: "Ready", variant: "success" },
  served: { label: "Served", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Just now";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentOrdersWidget() {
  const { profile } = useAuthProfile();
  const { data, isLoading } = useOrders(profile?.restaurant_id, { pageSize: 5 });
  const orders = data?.orders || [];

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

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No active orders</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Orders placed will appear here in real-time.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {orders.map((order) => {
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
                        {order.order_number || `#ORD-${order.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase">
                        {(order.order_type || "dine_in").replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      Status: {order.status}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1 shrink-0 ml-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.total_amount || 0)}
                  </span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <span className="flex items-center text-[10px] text-slate-400">
                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                    {formatTimeAgo(order.created_at)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
