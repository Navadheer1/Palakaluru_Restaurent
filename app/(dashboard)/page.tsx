"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  ChefHat,
  Bike,
  Plus,
  Calendar,
  Store,
  CheckCircle2,
  BookOpen,
  Grid,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { LiveTableStatusWidget } from "@/components/dashboard/LiveTableStatusWidget";
import { RecentOrdersWidget } from "@/components/dashboard/RecentOrdersWidget";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { WaiterDashboard } from "@/components/waiter/WaiterDashboard";

export default function DashboardPage() {
  const { profile, restaurant } = useAuthProfile();
  const { activeRole } = useRolePermissions();
  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetrics(profile?.restaurant_id);

  // Maintain scoped Supabase Realtime channel that patches cache directly
  useRealtimeSync(profile?.restaurant_id);

  // If logged-in user is WAITER, display the dedicated Waiter Operational POS
  if (activeRole === "waiter") {
    return <WaiterDashboard />;
  }

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const adminName = profile?.full_name || profile?.name || "Administrator";
  const restaurantName = restaurant?.name || "Palakaluru Restaurant";

  const todaySales = metrics?.todaySales || 0;
  const todayOrders = metrics?.todayOrders || 0;
  const activeTables = metrics?.activeTables || 0;
  const pendingKitchen = metrics?.pendingKitchen || 0;
  const activeDeliveries = metrics?.activeDeliveries || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Operational Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Operational Hub Online</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Welcome, {adminName}
          </h1>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center font-medium text-slate-700 dark:text-slate-300">
              <Store className="h-3.5 w-3.5 mr-1 text-brand-600" />
              Restaurant: {restaurantName}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-slate-400" />
              {currentDate}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link href="/menu" prefetch={true}>
            <Button variant="outline" size="sm" className="space-x-1.5">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span>Menu Catalog</span>
            </Button>
          </Link>
          <Link href="/pos" prefetch={true}>
            <Button variant="primary" size="sm" className="space-x-1.5">
              <Plus className="h-4 w-4" />
              <span>Launch POS</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Top Metric Cards Grid (Parallel Loading with Independent Skeletons) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isMetricsLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              title="Today's Sales"
              value={`₹${todaySales.toLocaleString("en-IN")}`}
              icon={DollarSign}
              variant="brand"
              description={todaySales === 0 ? "No sales recorded yet today" : "Total gross receipts"}
            />
            <MetricCard
              title="Today's Orders"
              value={todayOrders.toString()}
              icon={ShoppingBag}
              variant="emerald"
              description={todayOrders === 0 ? "Zero orders placed today" : "Orders fulfilled today"}
            />
            <MetricCard
              title="Active Tables"
              value={activeTables.toString()}
              icon={UtensilsCrossed}
              variant="amber"
              description={activeTables === 0 ? "All dining tables available" : "Currently seated"}
            />
            <MetricCard
              title="Pending Kitchen Orders"
              value={pendingKitchen.toString()}
              icon={ChefHat}
              variant="indigo"
              description={pendingKitchen === 0 ? "Kitchen line queue clear" : "Live tickets cooking"}
            />
            <MetricCard
              title="Active Deliveries"
              value={activeDeliveries.toString()}
              icon={Bike}
              variant="rose"
              description={activeDeliveries === 0 ? "No dispatches pending" : "Riders in transit"}
            />
          </>
        )}
      </div>

      {/* Operational Live Floor Plan Widget */}
      <LiveTableStatusWidget />

      {/* Split Queue Views: Active Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersWidget />
        </div>
        <div className="lg:col-span-1">
          <LowStockWidget />
        </div>
      </div>

      {/* Readiness / Security Status Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Fast UI & Synchronized Backend Ready
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Multi-tenant RLS isolation enforced • High-throughput cache active • 0ms interaction latency
            </p>
          </div>
          <div className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Admin Role Authorized
          </div>
        </div>
      </div>

      {/* Operational Station Quick Links with Route Prefetching */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/pos"
          prefetch={true}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                POS Billing
              </h4>
              <p className="text-xs text-slate-500">Counter & table orders</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
        </Link>

        <Link
          href="/tables"
          prefetch={true}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Table Manager
              </h4>
              <p className="text-xs text-slate-500">Dining floor sections</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </Link>

        <Link
          href="/kitchen"
          prefetch={true}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Kitchen KDS
              </h4>
              <p className="text-xs text-slate-500">Live order tickets</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </Link>

        <Link
          href="/settings"
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Settings & Taxes
              </h4>
              <p className="text-xs text-slate-500">Branch & GST parameters</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
