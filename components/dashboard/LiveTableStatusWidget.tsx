"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Utensils, Clock, CheckCircle2, CreditCard, Sparkles, RefreshCw, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStatus } from "@/lib/constants";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useTables, RestaurantTableItem } from "@/lib/hooks/useTables";

interface TablePreview {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: TableStatus;
  orderNumber?: string;
  amount?: number;
  timeSpent?: string;
}

const mockLiveTables: TablePreview[] = [
  { id: "t-1", tableNumber: "T-01", section: "AC Hall", capacity: 4, status: "occupied", orderNumber: "#1038", amount: 1240, timeSpent: "32m" },
  { id: "t-2", tableNumber: "T-02", section: "AC Hall", capacity: 2, status: "available" },
  { id: "t-3", tableNumber: "T-03", section: "AC Hall", capacity: 6, status: "waiting_for_food", orderNumber: "#1041", amount: 2850, timeSpent: "14m" },
  { id: "t-4", tableNumber: "T-04", section: "AC Hall", capacity: 4, status: "food_ready", orderNumber: "#1039", amount: 1680, timeSpent: "24m" },
  { id: "t-5", tableNumber: "F-01", section: "Family", capacity: 8, status: "billing", orderNumber: "#1034", amount: 4320, timeSpent: "58m" },
  { id: "t-6", tableNumber: "F-02", section: "Family", capacity: 6, status: "available" },
  { id: "t-7", tableNumber: "R-01", section: "Terrace", capacity: 4, status: "reserved" },
  { id: "t-8", tableNumber: "R-02", section: "Terrace", capacity: 4, status: "cleaning" },
];

const statusStyles: Record<
  TableStatus,
  { label: string; bg: string; border: string; text: string; icon: React.ElementType }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/60",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  occupied: {
    label: "Occupied",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/60",
    text: "text-amber-700 dark:text-amber-300",
    icon: Utensils,
  },
  waiting_for_food: {
    label: "Cooking",
    bg: "bg-orange-50/60 dark:bg-orange-950/20",
    border: "border-orange-300 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    icon: Clock,
  },
  food_ready: {
    label: "Ready to Serve",
    bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
    border: "border-indigo-300 dark:border-indigo-800",
    text: "text-indigo-700 dark:text-indigo-300",
    icon: CheckCircle2,
  },
  bill_requested: {
    label: "Bill Requested",
    bg: "bg-amber-500/20 dark:bg-amber-950/40",
    border: "border-amber-400 dark:border-amber-600",
    text: "text-amber-800 dark:text-amber-200 font-bold",
    icon: BellRing,
  },
  bill_ready: {
    label: "Bill Ready",
    bg: "bg-purple-50/80 dark:bg-purple-950/30",
    border: "border-purple-300 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300 font-bold",
    icon: CreditCard,
  },
  billing: {
    label: "Billing",
    bg: "bg-purple-50/60 dark:bg-purple-950/20",
    border: "border-purple-300 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    icon: CreditCard,
  },
  reserved: {
    label: "Reserved",
    bg: "bg-sky-50/60 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-300",
    icon: Users,
  },
  cleaning: {
    label: "Cleaning",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    icon: Clock,
  },
};

const nextStatusCycle: Record<TableStatus, TableStatus> = {
  available: "occupied",
  occupied: "bill_requested",
  waiting_for_food: "food_ready",
  food_ready: "bill_requested",
  bill_requested: "bill_ready",
  bill_ready: "cleaning",
  billing: "cleaning",
  cleaning: "available",
  reserved: "occupied",
};

import { useDineInStore } from "@/stores/useDineInStore";
import { useRouter } from "next/navigation";

export function LiveTableStatusWidget() {
  const { profile } = useAuthProfile();
  const { tables: dbTables, isLoading, updateStatus } = useTables(profile?.restaurant_id);
  const { sessions } = useDineInStore();
  const router = useRouter();

  // Map dbTables if present, otherwise fallback to mockLiveTables, and overlay live sessions
  const displayTables: TablePreview[] = React.useMemo(() => {
    const source: TablePreview[] = (dbTables && dbTables.length > 0)
      ? dbTables.map((t) => ({
          id: t.id,
          tableNumber: t.table_number,
          section: t.section_name || "Dining Floor",
          capacity: t.capacity,
          status: (t.status as TableStatus) || "available",
          amount: t.amount,
          timeSpent: t.timeSpent,
        }))
      : mockLiveTables;

    return source.map((tbl) => {
      const liveSession = sessions[tbl.id];
      if (liveSession) {
        const subtotal = liveSession.sentItems.reduce((s, i) => s + i.total_price, 0) +
          liveSession.unsentItems.reduce((s, i) => s + i.totalPrice, 0);
        return {
          ...tbl,
          status: (liveSession.status === "bill_generated"
            ? "billing"
            : liveSession.sentItems.length > 0
            ? "occupied"
            : tbl.status) as TableStatus,
          amount: subtotal > 0 ? Math.round(subtotal * 1.05) : tbl.amount,
        };
      }
      return tbl;
    });
  }, [dbTables, sessions]);

  const handleTableClick = (tbl: TablePreview) => {
    router.push("/tables");
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Floor Monitoring
            </h3>
            <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
              Dine-In Hub
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time table dining stages • Click any table to open in Tables &amp; Floor
          </p>
        </div>
        <Link
          href="/tables"
          className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Open Tables &amp; Floor →
        </Link>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {displayTables.map((tbl) => {
          const style = statusStyles[tbl.status] || statusStyles.available;
          const Icon = style.icon;

          return (
            <div
              key={tbl.id}
              onClick={() => handleTableClick(tbl)}
              className={cn(
                "group flex flex-col justify-between rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-sm cursor-pointer select-none",
                style.bg,
                style.border
              )}
              title="Click to open table in Tables & Floor"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {tbl.tableNumber}
                </span>
                <span
                  className={cn(
                    "flex items-center space-x-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    style.text
                  )}
                >
                  <Icon className="h-3 w-3 mr-0.5" />
                  {style.label}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{tbl.section}</span>
                <span>Cap: {tbl.capacity}</span>
              </div>

              {tbl.amount ? (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    ₹{tbl.amount}
                  </span>
                  <span className="text-[10px] text-slate-400">{tbl.timeSpent}</span>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-transparent text-[11px] text-slate-400 italic">
                  Click to occupy
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
