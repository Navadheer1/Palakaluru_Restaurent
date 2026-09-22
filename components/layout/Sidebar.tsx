"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Grid,
  ChefHat,
  Bike,
  BookOpen,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  ShieldCheck,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/useUiStore";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  prefetch?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, prefetch: true },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "POS / Billing", href: "/pos", icon: UtensilsCrossed, badge: "Live", prefetch: true },
      { name: "Orders", href: "/orders", icon: Receipt, prefetch: true },
      { name: "Tables & Floor", href: "/tables", icon: Grid, prefetch: true },
      { name: "KOT Tickets", href: "/kot", icon: ChefHat, badge: "Live", prefetch: true },
      { name: "Kitchen (KDS)", href: "/kitchen", icon: ChefHat, badge: "3", prefetch: true },
      { name: "Delivery", href: "/delivery", icon: Bike, prefetch: true },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Menu & Items", href: "/menu", icon: BookOpen, prefetch: true },
      { name: "Inventory", href: "/inventory", icon: Boxes, badge: "Alert" },
      { name: "Purchases", href: "/purchases", icon: ShoppingBag },
      { name: "Suppliers", href: "/suppliers", icon: Truck },
      { name: "Customers (CRM)", href: "/customers", icon: Users },
      { name: "Staff & Roles", href: "/staff", icon: ShieldCheck },
      { name: "Expenses", href: "/expenses", icon: DollarSign },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { name: "Reports & Insights", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { useNotificationStore } from "@/stores/useNotificationStore";

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileNavOpen, setMobileNavOpen } = useUiStore();
  const { profile } = useAuthProfile();
  const { activeRole } = useRolePermissions();
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const isWaiter = activeRole === "waiter";
  const userName = profile?.full_name || profile?.name || (isWaiter ? "R. Naresh" : "Palakaluru Admin");
  const roleLabel = isWaiter ? "WAITER" : (profile?.role ? profile.role.toUpperCase() : "SUPER ADMIN");

  const waiterNavSections: NavSection[] = [
    {
      title: "WAITER SERVICE",
      items: [
        { name: "My Tables", href: "/tables", icon: Grid, prefetch: true },
        { name: "Orders", href: "/orders", icon: Receipt, prefetch: true },
        { name: "KOT Status", href: "/kot", icon: ChefHat, badge: "Live", prefetch: true },
        { name: "Bill Requests", href: "/bill-requests", icon: UtensilsCrossed, prefetch: true },
        {
          name: "Notifications",
          href: "/notifications",
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
          prefetch: true,
        },
      ],
    },
  ];

  const currentNavSections = isWaiter ? waiterNavSections : navSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950",
          isSidebarCollapsed ? "w-20" : "w-64",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "relative flex h-16 items-center border-b border-slate-100 dark:border-slate-800/80 transition-all duration-300",
            isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Link href={isWaiter ? "/tables" : "/"} className="flex items-center space-x-3 overflow-hidden">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
              isWaiter
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20"
                : "bg-gradient-to-tr from-brand-600 to-amber-500 shadow-brand-500/20"
            )}>
              <Flame className="h-6 w-6" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                  CulinaCloud
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {isWaiter ? "Waiter POS Portal" : "Palakaluru RMS"}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-5 z-50 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {currentNavSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && !isSidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={item.prefetch}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? isWaiter
                            ? "bg-emerald-500/10 text-emerald-600 font-semibold dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-brand-500/10 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                        isSidebarCollapsed && "justify-center px-2"
                      )}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive
                            ? isWaiter
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-brand-600 dark:text-brand-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300",
                          !isSidebarCollapsed && "mr-3"
                        )}
                      />
                      {!isSidebarCollapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
                            typeof item.badge === "number" || item.badge === "Live"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse"
                              : item.badge === "Alert"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Quick Profile / System Status */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          <Link
            href="/profile"
            className={cn(
              "flex items-center rounded-lg bg-slate-50 p-2 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors",
              isSidebarCollapsed ? "justify-center" : "space-x-3"
            )}
            title={isWaiter ? "Waiter Profile" : "Manage Admin Profile"}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
              {userName.substring(0, 2).toUpperCase()}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {userName}
                </span>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {roleLabel}
                  </span>
                  <span>•</span>
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
