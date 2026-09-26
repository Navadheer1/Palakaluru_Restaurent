"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Store, Plus, Search, ChefHat, Bike, Grid } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";
import { Breadcrumbs } from "../Breadcrumbs";
import { NotificationMenu } from "../NotificationMenu";
import { UserDropdown } from "../UserDropdown";
import { UserRole } from "@/lib/constants";

import { useOptionalRestaurantContext } from "@/lib/context/RestaurantContext";

interface RoleTopbarProps {
  role: UserRole;
}

export function RoleTopbar({ role }: RoleTopbarProps) {
  const { setMobileNavOpen } = useUiStore();
  const restaurantContext = useOptionalRestaurantContext();
  const branch = restaurantContext?.branch;
  const branchDisplayName = branch
    ? `${branch.name} (${branch.code})`
    : "Palakaluru Main (MAIN-01)";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      {/* Left: Mobile Trigger & Branch / Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Branch Selector Badge */}
        <div className="hidden sm:flex items-center space-x-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
          <Store className="h-3.5 w-3.5 text-brand-600" />
          <span>{branchDisplayName}</span>
        </div>

        <div className="hidden md:block pl-2 border-l border-slate-200 dark:border-slate-800">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: Role-specific action buttons, Notifications, User */}
      <div className="flex items-center space-x-3">
        {/* Admin Quick POS */}
        {role === "admin" && (
          <Link
            href="/admin/pos"
            className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">POS Order</span>
          </Link>
        )}

        {/* Cashier Quick POS */}
        {role === "cashier" && (
          <Link
            href="/cashier/pos"
            className="flex items-center space-x-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Bill</span>
          </Link>
        )}

        {/* Waiter Quick Tables (NEVER /pos!) */}
        {role === "waiter" && (
          <Link
            href="/waiter/tables"
            className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Grid className="h-4 w-4" />
            <span className="hidden sm:inline">My Tables</span>
          </Link>
        )}

        {/* Kitchen Live KDS Status */}
        {role === "kitchen" && (
          <div className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
            <ChefHat className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span>KDS Active</span>
          </div>
        )}

        {/* Delivery Fleet Status */}
        {role === "delivery" && (
          <div className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300">
            <Bike className="h-3.5 w-3.5 text-cyan-600 animate-pulse" />
            <span>Fleet Active</span>
          </div>
        )}

        {/* Notifications */}
        <NotificationMenu />

        {/* User profile dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
