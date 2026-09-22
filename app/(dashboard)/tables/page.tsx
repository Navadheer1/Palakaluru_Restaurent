"use client";

import * as React from "react";
import {
  Grid,
  Plus,
  Users,
  Utensils,
  CheckCircle2,
  Clock,
  CreditCard,
  ChefHat,
  Filter,
  Sparkles,
  ShieldCheck,
  UserCheck,
  BellRing,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";
import { TableStatus, UserRole } from "@/lib/constants";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useTables, RestaurantTableItem } from "@/lib/hooks/useTables";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { useDineInStore } from "@/stores/useDineInStore";

interface TableCardInfo {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string | null;
  amount?: number;
  timeSpent?: string;
  kotCount?: number;
  guestCount?: number;
  waiterName?: string;
  billRequested?: boolean;
  billNumber?: string;
}

const mockFloorTables: TableCardInfo[] = [
  { id: "tbl-01", tableNumber: "T-01", section: "AC Hall", capacity: 4, status: "available" },
  { id: "tbl-02", tableNumber: "T-02", section: "AC Hall", capacity: 2, status: "available" },
  { id: "tbl-03", tableNumber: "T-03", section: "AC Hall", capacity: 6, status: "available" },
  { id: "tbl-04", tableNumber: "T-04", section: "AC Hall", capacity: 4, status: "available" },
  { id: "tbl-05", tableNumber: "F-01", section: "Family Section", capacity: 8, status: "available" },
  { id: "tbl-06", tableNumber: "F-02", section: "Family Section", capacity: 6, status: "available" },
  { id: "tbl-07", tableNumber: "R-01", section: "Open Terrace", capacity: 4, status: "available" },
  { id: "tbl-08", tableNumber: "R-02", section: "Open Terrace", capacity: 4, status: "available" },
];

const statusConfig: Record<
  string,
  { label: string; bg: string; border: string; text: string; icon: React.ElementType }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  occupied: {
    label: "Occupied",
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/60 hover:border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    icon: Utensils,
  },
  waiting_for_food: {
    label: "Cooking",
    bg: "bg-orange-50/70 dark:bg-orange-950/20",
    border: "border-orange-300 dark:border-orange-800 hover:border-orange-400",
    text: "text-orange-700 dark:text-orange-300",
    icon: ChefHat,
  },
  food_ready: {
    label: "Ready to Serve",
    bg: "bg-teal-50/70 dark:bg-teal-950/20",
    border: "border-teal-300 dark:border-teal-800 hover:border-teal-400",
    text: "text-teal-700 dark:text-teal-300",
    icon: CheckCircle2,
  },
  bill_requested: {
    label: "Bill Requested",
    bg: "bg-amber-500/15 dark:bg-amber-950/40",
    border: "border-amber-400 dark:border-amber-600 hover:border-amber-500 ring-2 ring-amber-400/30",
    text: "text-amber-800 dark:text-amber-200 font-extrabold",
    icon: BellRing,
  },
  bill_ready: {
    label: "Bill Ready",
    bg: "bg-purple-50/80 dark:bg-purple-950/30",
    border: "border-purple-300 dark:border-purple-800 hover:border-purple-400 ring-1 ring-purple-400/30",
    text: "text-purple-700 dark:text-purple-300 font-extrabold",
    icon: Receipt,
  },
  billing: {
    label: "Bill Pending",
    bg: "bg-purple-50/70 dark:bg-purple-950/20",
    border: "border-purple-300 dark:border-purple-800 hover:border-purple-400",
    text: "text-purple-700 dark:text-purple-300",
    icon: CreditCard,
  },
  reserved: {
    label: "Reserved",
    bg: "bg-sky-50/70 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800 hover:border-sky-400",
    text: "text-sky-700 dark:text-sky-300",
    icon: Users,
  },
  cleaning: {
    label: "Cleaning",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-300 dark:border-slate-700 hover:border-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    icon: Clock,
  },
};

export default function TablesPage() {
  const { profile } = useAuthProfile();
  const { activeRole, setRoleOverride, isRoleOverridden } = useRolePermissions();
  const { tables: dbTables, refetch } = useTables(profile?.restaurant_id);
  const { sessions } = useDineInStore();

  const [selectedSection, setSelectedSection] = React.useState<string>("all");
  const [selectedTableForOrder, setSelectedTableForOrder] = React.useState<TableCardInfo | null>(null);

  // Merge database tables or fallback with active local sessions
  const tables: TableCardInfo[] = React.useMemo(() => {
    const source = (dbTables && dbTables.length > 0)
      ? dbTables.map((t) => ({
          id: t.id,
          tableNumber: t.table_number,
          section: t.section_name || "AC Hall",
          capacity: t.capacity,
          status: (t.status as TableStatus) || "available",
          currentOrderId: t.current_order_id,
        }))
      : mockFloorTables;

    return source.map((tbl) => {
      const liveSession = sessions[tbl.id];
      if (liveSession) {
        const subtotal = liveSession.sentItems.reduce((s, i) => s + i.total_price, 0) +
          liveSession.unsentItems.reduce((s, i) => s + i.totalPrice, 0);

        let derivedStatus: TableStatus = "occupied";
        if (liveSession.bill) {
          derivedStatus = "bill_ready";
        } else if (liveSession.billRequested) {
          derivedStatus = "bill_requested";
        } else if (liveSession.kots.some((k) => k.status === "ready")) {
          derivedStatus = "food_ready";
        } else if (liveSession.kots.some((k) => k.status === "preparing")) {
          derivedStatus = "waiting_for_food";
        } else if (liveSession.kots.length > 0) {
          derivedStatus = "occupied";
        }

        return {
          ...tbl,
          status: derivedStatus,
          amount: liveSession.bill?.final_total || (subtotal > 0 ? Math.round(subtotal * 1.05) : undefined),
          kotCount: liveSession.kots.length,
          guestCount: liveSession.guestCount,
          waiterName: liveSession.waiterName,
          billRequested: liveSession.billRequested,
          billNumber: liveSession.bill?.bill_number,
          currentOrderId: liveSession.orderId,
        };
      }
      return tbl;
    });
  }, [dbTables, sessions]);

  const sections = ["all", "AC Hall", "Family Section", "Open Terrace"];

  const filteredTables = tables.filter(
    (t) => selectedSection === "all" || t.section === selectedSection
  );

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied" || t.status === "waiting_for_food" || t.status === "food_ready").length,
    billRequested: tables.filter((t) => t.status === "bill_requested").length,
    billing: tables.filter((t) => t.status === "bill_ready" || t.status === "billing").length,
  };

  const handleOpenTableOrder = (tbl: TableCardInfo) => {
    setSelectedTableForOrder(tbl);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <Grid className="h-6 w-6 mr-2 text-brand-600" />
              Tables & Floor (Dine-In Operations)
            </h1>
            <Badge variant="primary">Multi-Role RMS</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime Dine-In Floor: Waiter (KOT & Bill Request) ➔ Kitchen (Prep & Ready) ➔ Admin/Cashier (Invoice & Settlement)
          </p>
        </div>

        {/* Live Role Switcher to test and demonstrate Admin vs Waiter vs Cashier vs Kitchen */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center">
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            Active Role:
          </span>
          {(["waiter", "kitchen", "cashier", "admin"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleOverride(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                activeRole === r
                  ? "bg-white dark:bg-slate-900 text-brand-600 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {r}
            </button>
          ))}
          {isRoleOverridden && (
            <button
              onClick={() => setRoleOverride(null)}
              className="text-[10px] text-rose-500 hover:underline px-1 font-semibold"
              title="Reset to database profile role"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bill Requests Alert Banner for Admin & Cashier */}
      {stats.billRequested > 0 && (activeRole === "admin" || activeRole === "cashier") && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-100 flex items-center justify-between shadow-xs animate-in fade-in-0 duration-200">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center animate-bounce">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold">
                {stats.billRequested} Table{stats.billRequested > 1 ? "s" : ""} Requested Bill Settlement!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Guests have finished dining. Open highlighted tables below and click &quot;Generate Final Bill&quot;.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floor Overview Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Tables</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
          <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Grid className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Available</p>
            <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">{stats.available}</p>
          </div>
          <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">Occupied / Cook</p>
            <p className="text-base font-extrabold text-blue-800 dark:text-blue-300">{stats.occupied}</p>
          </div>
          <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
            <Utensils className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className={cn(
          "rounded-xl border p-3 flex items-center justify-between transition-all",
          stats.billRequested > 0
            ? "border-amber-400 dark:border-amber-600 bg-amber-100/50 dark:bg-amber-950/40 ring-1 ring-amber-400 animate-pulse"
            : "border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20"
        )}>
          <div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Bill Requested</p>
            <p className="text-base font-extrabold text-amber-800 dark:text-amber-300">{stats.billRequested}</p>
          </div>
          <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <BellRing className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 p-3 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">Bill Ready</p>
            <p className="text-base font-extrabold text-purple-800 dark:text-purple-300">{stats.billing}</p>
          </div>
          <div className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
            <Receipt className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              selectedSection === sec
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            {sec === "all" ? "All Sections" : sec}
          </button>
        ))}
      </div>

      {/* Visual Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredTables.map((tbl) => {
          const style = statusConfig[tbl.status] || statusConfig.available;
          const Icon = style.icon;

          return (
            <div
              key={tbl.id}
              onClick={() => handleOpenTableOrder(tbl)}
              className={cn(
                "group flex flex-col justify-between rounded-2xl border-2 p-4 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] select-none min-h-[145px]",
                style.bg,
                style.border
              )}
            >
              {/* Card Top: Table number, KOT count badge, Status pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {tbl.tableNumber}
                  </span>
                  {tbl.kotCount && tbl.kotCount > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-600 text-white shadow-xs">
                      {tbl.kotCount} KOT{tbl.kotCount > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "flex items-center space-x-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                    style.text
                  )}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {style.label}
                </span>
              </div>

              {/* Card Middle: Capacity, Section & Staff */}
              <div className="my-2.5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>{tbl.section}</span>
                  <span className="flex items-center font-medium">
                    <Users className="h-3 w-3 mr-1 text-slate-400" />
                    {tbl.guestCount || tbl.capacity} Guests
                  </span>
                </div>
                {tbl.waiterName && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    Staff: <strong className="text-slate-800 dark:text-slate-200">{tbl.waiterName}</strong>
                  </p>
                )}
              </div>

              {/* Card Bottom: Order Info or Prompt */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                {tbl.billNumber ? (
                  <>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold font-mono">
                      {tbl.billNumber}
                    </span>
                    <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                      ₹{tbl.amount}
                    </span>
                  </>
                ) : tbl.amount ? (
                  <>
                    <span className="text-[11px] text-slate-400">Current Total:</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      ₹{tbl.amount}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
                    + Seat & Open Ticket
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Order Drawer / Modal */}
      {selectedTableForOrder && (
        <TableOrderModal
          isOpen={!!selectedTableForOrder}
          onClose={() => setSelectedTableForOrder(null)}
          tableId={selectedTableForOrder.id}
          tableNumber={selectedTableForOrder.tableNumber}
          capacity={selectedTableForOrder.capacity}
          sectionName={selectedTableForOrder.section}
          onTableStatusChanged={refetch}
        />
      )}
    </div>
  );
}
