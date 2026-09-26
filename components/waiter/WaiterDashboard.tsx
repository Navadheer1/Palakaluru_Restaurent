"use client";

import * as React from "react";
import Link from "next/link";
import {
  Grid,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  RefreshCw,
  Sparkles,
  CheckCheck,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useTables } from "@/lib/hooks/useTables";
import { useDineInStore } from "@/stores/useDineInStore";
import { useKotTickets } from "@/lib/hooks/useKotTickets";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { useOptionalRestaurantContext } from "@/lib/context/RestaurantContext";
import { formatCurrency, cn } from "@/lib/utils";

export function WaiterDashboard() {
  const { profile } = useAuthProfile();
  const restContext = useOptionalRestaurantContext();
  const restaurantId = restContext?.restaurantId || profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const branchId = restContext?.branchId || profile?.branch_id || "b0000000-0000-0000-0000-000000000001";
  const waiterName = profile?.full_name || profile?.name || (profile?.email ? profile.email.split("@")[0] : "Floor Waiter");

  // Real-time synchronization
  useRealtimeSync(restaurantId);

  // Hydration safety
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Data sources
  const { tables: dbTables, isLoading: tablesLoading, refetch } = useTables(restaurantId, branchId);
  const { sessions } = useDineInStore();
  const unreadNotifications = useNotificationStore((s) => s.getUnreadCount());

  // KOT Tickets for this waiter
  const {
    tickets,
    cookingCount,
    readyCount,
    servedCount,
  } = useKotTickets({
    waiterOnlyName: waiterName,
  });

  // Calculate Metrics: Only consider active sessions for real existing tables in this restaurant/branch
  const activeSessionsList = mounted && dbTables
    ? Object.values(sessions).filter((s) =>
        dbTables.some((t) => t.id === s.tableId)
      )
    : [];
  const assignedTablesCount = dbTables?.length || 0;
  const activeTablesCount = activeSessionsList.filter(
    (s) => s.status !== "closed" && s.paymentStatus !== "paid"
  ).length;

  const billRequestsCount = activeSessionsList.filter(
    (s) => s.billRequested || s.status === "bill_requested"
  ).length;

  // Ready tickets specifically requiring serving
  const readyTickets = mounted
    ? tickets.filter((t) => t.status === "ready")
    : [];

  // Recent activity stream derived from live sessions and KOTs
  const recentActivities = React.useMemo(() => {
    if (!mounted) return [];
    const activities: { id: string; time: string; text: string; type: "ready" | "bill" | "kot" | "seat" }[] = [];

    // Extract from sessions history
    activeSessionsList.forEach((s) => {
      if (s.billRequested) {
        activities.push({
          id: `act_bill_${s.tableId}`,
          time: s.billRequestedAt
            ? new Date(s.billRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
          text: `Table ${s.tableNumber} requested the final bill`,
          type: "bill",
        });
      }
      s.kots.forEach((k) => {
        if (k.status === "ready") {
          activities.push({
            id: `act_ready_${k.id}`,
            time: k.ready_at
              ? new Date(k.ready_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Just now",
            text: `Table ${s.tableNumber} — ${k.kot_number} is plated & READY to serve`,
            type: "ready",
          });
        } else if (k.status === "sent" || k.status === "preparing") {
          activities.push({
            id: `act_kot_${k.id}`,
            time: k.sent_at
              ? new Date(k.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Just now",
            text: `Table ${s.tableNumber} — ${k.kot_number} dispatched to Kitchen`,
            type: "kot",
          });
        }
      });
    });

    return activities.slice(0, 6);
  }, [activeSessionsList, mounted]);

  // Greeting based on time of day
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 rounded-3xl text-white shadow-lg shadow-emerald-900/10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse mr-1.5" />
              On Duty • Floor Station
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {greeting}, {waiterName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Live shift briefing • Monitor alerts and jump straight to your tables for taking orders and serving.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/waiter/tables"
            prefetch={true}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-emerald-800 hover:bg-emerald-50 transition-all shadow-md active:scale-95"
          >
            <UtensilsCrossed className="h-4 w-4 mr-2 text-emerald-600" />
            Open My Tables
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Link>
        </div>
      </div>

      {/* 2. Today's Service Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Floor Tables</span>
            <Grid className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {mounted && !tablesLoading ? assignedTablesCount : "--"}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">In your assigned floor</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Dining</span>
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {mounted && !tablesLoading ? activeTablesCount : "--"}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Seated &amp; ordering</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cooking</span>
            <ChefHat className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {mounted ? cookingCount : "--"}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">In Kitchen queue</span>
        </div>

        {/* Metric 4 */}
        <div className={cn(
          "bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all",
          readyCount > 0
            ? "border-emerald-400 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
            : "border-slate-200/80 dark:border-slate-800"
        )}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ready to Serve</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {mounted ? readyCount : "--"}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Hot on pass counter</span>
        </div>

        {/* Metric 5 */}
        <div className={cn(
          "bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1 transition-all",
          billRequestsCount > 0
            ? "border-amber-400 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 ring-2 ring-amber-500/20"
            : "border-slate-200/80 dark:border-slate-800"
        )}>
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bill Requests</span>
            <Receipt className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {mounted ? billRequestsCount : "--"}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Waiting on Cashier</span>
        </div>
      </div>

      {/* 3. Action Required Focus Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
          Action Required Right Now
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Ready Orders */}
          <div className={cn(
            "rounded-2xl border p-5 transition-all flex flex-col justify-between",
            readyCount > 0
              ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80"
          )}>
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Food Ready on Counter
                </span>
                <Badge variant={readyCount > 0 ? "success" : "secondary"}>
                  {readyCount} Orders
                </Badge>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                {readyCount > 0
                  ? `${readyCount} dishes ready to serve`
                  : "No dishes waiting to serve"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {readyCount > 0
                  ? "Kitchen staff has plated the food. Pick up and serve tables immediately."
                  : "All prepared orders have been served to guests."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <Link
                href="/waiter/ready-orders"
                prefetch={true}
                className={cn(
                  "inline-flex items-center justify-center w-full py-2 rounded-xl text-xs font-bold transition-all",
                  readyCount > 0
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                Go to Ready Orders →
              </Link>
            </div>
          </div>

          {/* Card 2: Bill Requests */}
          <div className={cn(
            "rounded-2xl border p-5 transition-all flex flex-col justify-between",
            billRequestsCount > 0
              ? "bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80"
          )}>
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <Receipt className="h-3 w-3 mr-1" />
                  Customer Bill Requests
                </span>
                <Badge variant={billRequestsCount > 0 ? "warning" : "secondary"}>
                  {billRequestsCount} Requests
                </Badge>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                {billRequestsCount > 0
                  ? `${billRequestsCount} tables requested bill`
                  : "No bill requests pending"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {billRequestsCount > 0
                  ? "Guests are ready to pay. Cashier is notified to generate the bill."
                  : "All seated tables are still dining or not requesting bill."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/60">
              <Link
                href="/waiter/bill-requests"
                prefetch={true}
                className={cn(
                  "inline-flex items-center justify-center w-full py-2 rounded-xl text-xs font-bold transition-all",
                  billRequestsCount > 0
                    ? "bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                Go to Bill Requests →
              </Link>
            </div>
          </div>

          {/* Card 3: Dining Workspace */}
          <div className="rounded-2xl border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  <UtensilsCrossed className="h-3 w-3 mr-1" />
                  Primary Work Desk
                </span>
                <Badge variant="primary">
                  {activeTablesCount} Active
                </Badge>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                Floor Service &amp; Orders
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Seat new guests, take orders, dispatch KOTs, and request final bills directly from My Tables.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/60">
              <Link
                href="/waiter/tables"
                prefetch={true}
                className="inline-flex items-center justify-center w-full py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-all"
              >
                Go to My Tables Workspace →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Hub */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
          <Grid className="h-4 w-4 mr-2 text-emerald-600" />
          Quick Navigation Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/waiter/tables"
            prefetch={true}
            className="flex items-center p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">My Tables Floor</p>
              <p className="text-[11px] text-slate-500">Seat guests &amp; manage orders</p>
            </div>
          </Link>

          <Link
            href="/waiter/ready-orders"
            prefetch={true}
            className="flex items-center p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Ready Orders</p>
              <p className="text-[11px] text-slate-500">Pick up &amp; mark food served</p>
            </div>
          </Link>

          <Link
            href="/waiter/bill-requests"
            prefetch={true}
            className="flex items-center p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Bill Requests</p>
              <p className="text-[11px] text-slate-500">Track cashier invoices</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Live Recent Floor Activity Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-slate-500" />
            Recent Service Activity
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">Live Feed</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No table service activities yet today. Open My Tables to begin seating guests.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      act.type === "ready"
                        ? "bg-emerald-500"
                        : act.type === "bill"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    )}
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{act.text}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
