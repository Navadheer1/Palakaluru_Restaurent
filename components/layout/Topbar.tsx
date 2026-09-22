"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Store, Plus, Search } from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationMenu } from "./NotificationMenu";
import { UserDropdown } from "./UserDropdown";

export function Topbar() {
  const { setMobileNavOpen } = useUiStore();

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
          <span>Palakaluru Main (PLK-01)</span>
        </div>

        <div className="hidden md:block pl-2 border-l border-slate-200 dark:border-slate-800">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: Quick POS Action, Search, Notifications, User */}
      <div className="flex items-center space-x-3">
        {/* Global Search shortcut preview */}
        <div className="hidden lg:flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <Search className="h-3.5 w-3.5" />
          <span>Search orders, tables, items...</span>
          <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Quick POS action button */}
        <Link
          href="/pos"
          className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Notifications */}
        <NotificationMenu />

        {/* User profile dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
