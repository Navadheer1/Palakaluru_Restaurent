"use client";

import * as React from "react";
import Link from "next/link";
import {
  Grid,
  Receipt,
  ChefHat,
  Boxes,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LiveTableStatusWidget } from "@/components/dashboard/LiveTableStatusWidget";
import { RecentOrdersWidget } from "@/components/dashboard/RecentOrdersWidget";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";

export function ManagerDashboard() {
  const { profile, restaurant } = useAuthProfile();
  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetrics(profile?.restaurant_id);

  useRealtimeSync(profile?.restaurant_id);

  const managerName = profile?.full_name || profile?.name || "Operations Manager";
  const restaurantName = restaurant?.name || "Palakaluru Restaurant";

  const activeTables = metrics?.activeTables || 0;
  const pendingKitchen = metrics?.pendingKitchen || 0;
  const todayOrders = metrics?.todayOrders || 0;
  const activeDeliveries = metrics?.activeDeliveries || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-md mb-2">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-300" />
              Manager Operations Terminal
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Welcome, {managerName}
            </h1>
            <p className="text-xs text-blue-100/90 mt-1 max-w-xl">
              Live floor management, KOT monitoring, active inventory thresholds, and service operations for {restaurantName}.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/manager/tables"
              className="inline-flex items-center justify-center rounded-xl bg-white text-blue-900 font-bold px-4 py-2.5 text-xs shadow-md hover:bg-blue-50 transition-colors"
            >
              <Grid className="h-4 w-4 mr-1.5" />
              Manage Floor
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Occupied Tables"
          value={activeTables}
          subtext="Realtime floor dining"
          icon={Grid}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="KOT Orders in Kitchen"
          value={pendingKitchen}
          subtext="Cooking & ready tickets"
          icon={ChefHat}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Today's Orders"
          value={todayOrders}
          subtext="All dining channels"
          icon={Receipt}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Dispatched Deliveries"
          value={activeDeliveries}
          subtext="Riders on road"
          icon={Boxes}
          isLoading={isMetricsLoading}
        />
      </div>

      {/* Two Column Layout: Floor Status & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveTableStatusWidget />
          <RecentOrdersWidget />
        </div>

        <div className="space-y-6">
          <LowStockWidget />

          {/* Quick Manager Actions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Operations Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/manager/kot"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <ChefHat className="h-4 w-4 text-blue-600" />
                  <span>KOT Kitchen Queue</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/manager/inventory"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <Boxes className="h-4 w-4 text-blue-600" />
                  <span>Stock Adjustments</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/manager/reports"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Daily Operations Report</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
