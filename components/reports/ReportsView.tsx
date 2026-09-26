"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { BarChart3, Download, Utensils, PackageCheck, Bike, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";

// Code splitting: Lazy-load heavy Recharts chart component with SSR disabled and skeleton fallback
const DynamicSalesChart = dynamic(
  () =>
    import("@/components/dashboard/SalesChart").then((mod) => mod.SalesChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading chart analytics module...
      </div>
    ),
  }
);

interface ChannelMetric {
  channel: string;
  amount: number;
  orders: number;
  percentage: string;
  avgTicket: number;
  icon: React.ElementType;
  color: string;
}

export function ReportsView() {
  const { profile } = useAuthProfile();
  const [metrics, setMetrics] = React.useState<{
    dineIn: { amount: number; count: number };
    takeaway: { amount: number; count: number };
    delivery: { amount: number; count: number };
  }>({
    dineIn: { amount: 0, count: 0 },
    takeaway: { amount: 0, count: 0 },
    delivery: { amount: 0, count: 0 },
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchReportData = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("order_type, total_amount, status")
          .eq("restaurant_id", profile.restaurant_id);

        if (!error && data && isSubscribed) {
          const acc = {
            dineIn: { amount: 0, count: 0 },
            takeaway: { amount: 0, count: 0 },
            delivery: { amount: 0, count: 0 },
          };

          data.forEach((ord) => {
            const amt = Number(ord.total_amount || 0);
            const type = ord.order_type || "dine_in";
            if (type === "dine_in") {
              acc.dineIn.amount += amt;
              acc.dineIn.count += 1;
            } else if (type === "takeaway") {
              acc.takeaway.amount += amt;
              acc.takeaway.count += 1;
            } else if (type === "delivery" || type === "online") {
              acc.delivery.amount += amt;
              acc.delivery.count += 1;
            }
          });

          setMetrics(acc);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchReportData();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

  const totalGrossSales = metrics.dineIn.amount + metrics.takeaway.amount + metrics.delivery.amount;
  const totalOrders = metrics.dineIn.count + metrics.takeaway.count + metrics.delivery.count;
  const totalTaxCollected = Math.round(totalGrossSales * 0.05);

  const getPercentage = (amount: number) => {
    if (totalGrossSales === 0) return "0%";
    return `${Math.round((amount / totalGrossSales) * 100)}%`;
  };

  const channelBreakdown: ChannelMetric[] = [
    {
      channel: "Dine-In Sales",
      amount: metrics.dineIn.amount,
      orders: metrics.dineIn.count,
      percentage: getPercentage(metrics.dineIn.amount),
      avgTicket: metrics.dineIn.count > 0 ? Math.round(metrics.dineIn.amount / metrics.dineIn.count) : 0,
      icon: Utensils,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
    },
    {
      channel: "Takeaway Sales",
      amount: metrics.takeaway.amount,
      orders: metrics.takeaway.count,
      percentage: getPercentage(metrics.takeaway.amount),
      avgTicket: metrics.takeaway.count > 0 ? Math.round(metrics.takeaway.amount / metrics.takeaway.count) : 0,
      icon: PackageCheck,
      color: "text-brand-600 bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-900/60",
    },
    {
      channel: "Delivery Sales",
      amount: metrics.delivery.amount,
      orders: metrics.delivery.count,
      percentage: getPercentage(metrics.delivery.amount),
      avgTicket: metrics.delivery.count > 0 ? Math.round(metrics.delivery.amount / metrics.delivery.count) : 0,
      icon: Bike,
      color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-brand-600" />
            Reports & Channel Financial Insights
          </h1>
          <p className="text-xs text-slate-500">
            Segregated analytics for Dine-in tables, Takeaway counter, and Delivery dispatch
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Channel Sales Segregation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channelBreakdown.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.channel}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {item.channel}
                </span>
                <div className={`p-2 rounded-lg border ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.amount)}
                </h3>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.orders} Orders ({item.percentage})</span>
                  <span>Avg: ₹{item.avgTicket}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* GST & Tax Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Total GST Collected (5%)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
              <Receipt className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalTaxCollected)}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              On ₹{totalGrossSales.toLocaleString("en-IN")} total volume ({totalOrders} orders)
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Sales Chart */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Today&apos;s Sales & Velocity Curve
            </h3>
            <p className="text-xs text-slate-400">Consolidated across all dining channels</p>
          </div>
          <Badge variant="primary">Real-time Aggregation</Badge>
        </div>
        <DynamicSalesChart />
      </div>
    </div>
  );
}
