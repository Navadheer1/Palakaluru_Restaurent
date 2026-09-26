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
  BookOpen,
  Grid,
  ShieldCheck,
  ArrowRight,
  Boxes,
  BarChart3,
  Settings,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/Button";
import { LiveTableStatusWidget } from "@/components/dashboard/LiveTableStatusWidget";
import { RecentOrdersWidget } from "@/components/dashboard/RecentOrdersWidget";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { formatCurrency } from "@/lib/utils";

export function AdminDashboard() {
  const { profile, restaurant } = useAuthProfile();
  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetrics(profile?.restaurant_id);

  useRealtimeSync(profile?.restaurant_id);

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
            <span>Master System Online</span>
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
          <Link href="/admin/menu">
            <Button variant="outline" size="sm" className="space-x-1.5">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span>Menu Catalog</span>
            </Button>
          </Link>
          <Link href="/admin/pos">
            <Button variant="primary" size="sm" className="space-x-1.5">
              <Plus className="h-4 w-4" />
              <span>Launch POS</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Today's Gross Sales"
          value={formatCurrency(todaySales)}
          subtext="Combined floor & online"
          icon={DollarSign}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Today's Orders"
          value={todayOrders}
          subtext="Total completed orders"
          icon={ShoppingBag}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Active Occupied Tables"
          value={activeTables}
          subtext="Realtime floor dining"
          icon={UtensilsCrossed}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Kitchen KOT Orders"
          value={pendingKitchen}
          subtext="Preparing & ready"
          icon={ChefHat}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Active Deliveries"
          value={activeDeliveries}
          subtext="Dispatched to riders"
          icon={Bike}
          isLoading={isMetricsLoading}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Floor Tables & Orders */}
        <div className="space-y-6 lg:col-span-2">
          <LiveTableStatusWidget />
          <RecentOrdersWidget />
        </div>

        {/* Right Column: Inventory & Admin Control */}
        <div className="space-y-6">
          <LowStockWidget />

          {/* Quick Operations Matrix */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Administration Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/tables"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <Grid className="h-4 w-4 text-brand-600" />
                  <span>Floor & Table Layout</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/admin/staff"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  <span>Staff & Roles</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className="h-4 w-4 text-brand-600" />
                  <span>Financial & Sales Reports</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="h-4 w-4 text-brand-600" />
                  <span>Restaurant Settings</span>
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
