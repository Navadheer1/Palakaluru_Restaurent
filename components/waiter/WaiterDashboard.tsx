"use client";

import * as React from "react";
import Link from "next/link";
import {
  Grid,
  Users,
  Utensils,
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  Receipt,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  Eye,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableStatus } from "@/lib/constants";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useTables, RestaurantTableItem } from "@/lib/hooks/useTables";
import { useDineInStore } from "@/stores/useDineInStore";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { useKotTickets, UnifiedKotTicket } from "@/lib/hooks/useKotTickets";
import { BillReceiptModal, BillData } from "@/components/billing/BillReceiptModal";
import { formatCurrency, cn } from "@/lib/utils";

interface TableCardInfo {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string | null;
  amount?: number;
  kotCount?: number;
  guestCount?: number;
  waiterName?: string;
  billRequested?: boolean;
  billNumber?: string;
  timeSpent?: string;
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

const statusStyles: Record<
  string,
  { label: string; bg: string; border: string; text: string; icon: React.ElementType }
> = {
  available: {
    label: "AVAILABLE",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  occupied: {
    label: "OCCUPIED",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/60 hover:border-blue-400",
    text: "text-blue-700 dark:text-blue-400",
    icon: Utensils,
  },
  kot_sent: {
    label: "KOT SENT",
    bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400",
    text: "text-indigo-700 dark:text-indigo-400",
    icon: ChefHat,
  },
  waiting_for_food: {
    label: "KOT PREPARING",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    border: "border-amber-300 dark:border-amber-800 hover:border-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    icon: ChefHat,
  },
  food_ready: {
    label: "KOT READY",
    bg: "bg-teal-50/70 dark:bg-teal-950/30",
    border: "border-teal-400 dark:border-teal-700 hover:border-teal-500 ring-2 ring-teal-400/20",
    text: "text-teal-700 dark:text-teal-300 font-extrabold",
    icon: CheckCircle2,
  },
  bill_requested: {
    label: "BILL REQUESTED",
    bg: "bg-amber-500/15 dark:bg-amber-950/40",
    border: "border-amber-400 dark:border-amber-600 hover:border-amber-500 ring-2 ring-amber-400/30",
    text: "text-amber-800 dark:text-amber-200 font-extrabold",
    icon: BellRing,
  },
  bill_ready: {
    label: "BILL READY",
    bg: "bg-purple-50/80 dark:bg-purple-950/30",
    border: "border-purple-300 dark:border-purple-800 hover:border-purple-400 ring-2 ring-purple-400/30",
    text: "text-purple-700 dark:text-purple-300 font-extrabold",
    icon: Receipt,
  },
  paid: {
    label: "PAYMENT COMPLETED",
    bg: "bg-emerald-100/70 dark:bg-emerald-950/40",
    border: "border-emerald-400 dark:border-emerald-700 hover:border-emerald-500",
    text: "text-emerald-800 dark:text-emerald-200 font-extrabold",
    icon: CheckCircle2,
  },
};

export function WaiterDashboard() {
  const { profile } = useAuthProfile();
  const { tables: dbTables, refetch } = useTables(profile?.restaurant_id);
  const { sessions, setGuestCount, initSession } = useDineInStore();

  const [selectedSection, setSelectedSection] = React.useState<string>("all");
  const [selectedTableForOrder, setSelectedTableForOrder] = React.useState<TableCardInfo | null>(null);

  // Quick Seating Prompt Modal for available tables
  const [seatingTable, setSeatingTable] = React.useState<TableCardInfo | null>(null);
  const [seatingGuestCount, setSeatingGuestCount] = React.useState<number>(4);
  const waiterName = profile?.full_name || profile?.name || "R. Naresh";

  // Tab State: Floor Tables vs Waiter KOT Orders
  const [mainTab, setMainTab] = React.useState<"floor" | "kot">("floor");
  const [kotStatusFilter, setKotStatusFilter] = React.useState<string>("all");
  const [kotSearchQuery, setKotSearchQuery] = React.useState<string>("");
  const [selectedBillForPreview, setSelectedBillForPreview] = React.useState<BillData | null>(null);

  // Hook for Waiter's KOT Orders
  const {
    tickets: waiterKotTickets,
    cookingCount: waiterCookingCount,
    readyCount: waiterReadyCount,
  } = useKotTickets({
    waiterOnlyName: waiterName,
    statusFilter: kotStatusFilter,
    searchQuery: kotSearchQuery,
  });

  // Build unified floor tables with local live sessions
  const tables: TableCardInfo[] = React.useMemo(() => {
    const source = dbTables && dbTables.length > 0
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
        if (liveSession.paymentStatus === "paid") {
          derivedStatus = "available"; // or completed
        } else if (liveSession.bill) {
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

  // Operational metrics
  const totalTables = tables.length;
  const activeOrdersCount = Object.values(sessions).filter(
    (s) => s.paymentStatus !== "paid" && (s.sentItems.length > 0 || s.unsentItems.length > 0)
  ).length;
  const kotPendingCount = Object.values(sessions).reduce(
    (acc, s) => acc + s.kots.filter((k) => k.status === "sent" || k.status === "preparing").length,
    0
  );
  const billRequestsCount = Object.values(sessions).filter(
    (s) => s.billRequested && !s.bill && s.paymentStatus !== "paid"
  ).length;

  const handleTableClick = (tbl: TableCardInfo) => {
    const live = sessions[tbl.id];
    const isOccupied = live && (live.sentItems.length > 0 || live.unsentItems.length > 0);

    if (!isOccupied && tbl.status === "available") {
      // Show fast seating prompt
      setSeatingTable(tbl);
      setSeatingGuestCount(tbl.capacity || 4);
    } else {
      // Open full Table Order Modal
      setSelectedTableForOrder(tbl);
    }
  };

  const handleStartOrderFromPrompt = () => {
    if (!seatingTable) return;
    initSession(seatingTable.id, seatingTable.tableNumber, null, seatingGuestCount, waiterName);
    setGuestCount(seatingTable.id, seatingGuestCount);
    const updated = { ...seatingTable, guestCount: seatingGuestCount, status: "occupied" as TableStatus };
    setSeatingTable(null);
    setSelectedTableForOrder(updated);
  };

  // Active Orders list
  const activeOrderSessions = Object.values(sessions).filter(
    (s) => s.paymentStatus !== "paid" && (s.sentItems.length > 0 || s.unsentItems.length > 0)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Greeting & Service Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-transparent p-5 rounded-2xl border border-emerald-500/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>WAITER STATION ONLINE</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Good Morning, {waiterName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your tables, take orders and keep service smooth.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant={mainTab === "kot" ? "primary" : "outline"}
            size="sm"
            onClick={() => setMainTab(mainTab === "kot" ? "floor" : "kot")}
            className="space-x-1.5 font-bold"
          >
            <ChefHat className="h-4 w-4 text-brand-600" />
            <span>{mainTab === "kot" ? "View Tables" : "My KOT Orders"}</span>
            {waiterKotTickets.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-brand-600 text-white">
                {waiterKotTickets.length}
              </span>
            )}
          </Button>
          <Link href="/bill-requests" prefetch={true}>
            <Button
              variant={billRequestsCount > 0 ? "primary" : "secondary"}
              size="sm"
              className={cn(
                "space-x-1.5 font-bold",
                billRequestsCount > 0 && "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
              )}
            >
              <BellRing className="h-4 w-4" />
              <span>Bill Requests ({billRequestsCount})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tables */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Tables</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{totalTables}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Floor capacity</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Grid className="h-5 w-5" />
          </div>
        </div>

        {/* Active Orders */}
        <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Active Orders</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{activeOrdersCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tables dining now</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
            <Utensils className="h-5 w-5" />
          </div>
        </div>

        {/* KOT Pending */}
        <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">KOT Pending</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{kotPendingCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cooking in kitchen</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
            <ChefHat className="h-5 w-5" />
          </div>
        </div>

        {/* Bill Requests */}
        <div className={cn(
          "p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between transition-all",
          billRequestsCount > 0
            ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 bg-amber-50/20"
            : "border-purple-200/80 dark:border-purple-900/60"
        )}>
          <div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Bill Requests</p>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{billRequestsCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {billRequestsCount > 0 ? "Awaiting Cashier invoice" : "All cleared"}
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Primary Station Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setMainTab("floor")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2",
            mainTab === "floor"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Grid className="h-4 w-4" />
          <span>Floor Tables & Dining ({tables.length})</span>
        </button>

        <button
          onClick={() => setMainTab("kot")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2",
            mainTab === "kot"
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <ChefHat className="h-4 w-4" />
          <span>My KOT Orders</span>
          {waiterKotTickets.length > 0 && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                mainTab === "kot"
                  ? "bg-white text-brand-700"
                  : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              )}
            >
              {waiterKotTickets.length}
            </span>
          )}
        </button>
      </div>

      {mainTab === "floor" ? (
        <>
          {/* Floor Grid Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                  <Grid className="h-4 w-4 mr-2 text-emerald-600" />
                  Floor 1 Tables
                </h2>
                <span className="text-xs text-slate-400">
                  Tap an available table to seat guests, or tap an active table to view KOTs/Bill.
                </span>
              </div>

              {/* Section filter tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                      selectedSection === sec
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {sec === "all" ? "All Sections" : sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredTables.map((tbl) => {
                const style = statusStyles[tbl.status] || statusStyles.available;
                const Icon = style.icon;

                return (
                  <div
                    key={tbl.id}
                    onClick={() => handleTableClick(tbl)}
                    className={cn(
                      "group flex flex-col justify-between rounded-2xl border-2 p-4 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] select-none min-h-[145px]",
                      style.bg,
                      style.border
                    )}
                  >
                    {/* Top: Table number & status badge */}
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

                    {/* Middle: Capacity, Section & Staff */}
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

                    {/* Bottom: Action / Total */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                      {tbl.billNumber ? (
                        <>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold font-mono">
                            {tbl.billNumber}
                          </span>
                          <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                            {formatCurrency(tbl.amount || 0)}
                          </span>
                        </>
                      ) : tbl.amount ? (
                        <>
                          <span className="text-[11px] text-slate-400">Total:</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {formatCurrency(tbl.amount)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center">
                          <Plus className="h-3 w-3 mr-0.5" />
                          Seat Guests & Order
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Orders Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/30">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                  <Utensils className="h-4 w-4 mr-2 text-brand-600" />
                  Active Dine-In Orders ({activeOrderSessions.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Current dining sessions on the floor with live KOT and billing status
                </p>
              </div>
              <Link href="/orders" prefetch={true} className="text-xs font-bold text-brand-600 hover:underline flex items-center">
                <span>View All Orders</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {activeOrderSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active dining orders at the moment. Tap any available table above to start a new order.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeOrderSessions.map((sess) => {
                  const totalAmount = sess.bill?.final_total ||
                    Math.round(sess.sentItems.reduce((s, i) => s + i.total_price, 0) * 1.05);

                  return (
                    <div
                      key={sess.tableId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                          {sess.tableNumber}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              Table {sess.tableNumber}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {sess.orderNumber}
                            </span>
                            {sess.bill ? (
                              <Badge variant="primary" className="text-[10px] font-extrabold bg-purple-600 text-white">
                                BILL READY
                              </Badge>
                            ) : sess.billRequested ? (
                              <Badge variant="warning" className="text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                                BILL REQUESTED
                              </Badge>
                            ) : sess.kots.some((k) => k.status === "ready") ? (
                              <Badge variant="success" className="text-[10px] font-bold">
                                FOOD READY
                              </Badge>
                            ) : sess.kots.some((k) => k.status === "preparing") ? (
                              <Badge variant="warning" className="text-[10px] font-bold">
                                COOKING
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-bold">
                                {sess.kots.length} KOT SENT
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                            <span>Staff: <strong>{sess.waiterName || waiterName}</strong></span>
                            <span>•</span>
                            <span>{sess.guestCount} Guests</span>
                            <span>•</span>
                            <span>{sess.sentItems.length} dishes</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Total Amount</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            const targetTbl = tables.find((t) => t.id === sess.tableId) || {
                              id: sess.tableId,
                              tableNumber: sess.tableNumber,
                              section: "AC Hall",
                              capacity: sess.guestCount,
                              status: "occupied" as TableStatus,
                            };
                            setSelectedTableForOrder(targetTbl);
                          }}
                          className="font-bold text-xs bg-brand-600 hover:bg-brand-700"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Manage Order
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* KOT TAB - WAITER */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
                <ChefHat className="h-4 w-4 mr-2 text-brand-600" />
                My Dispatched KOT Orders ({waiterKotTickets.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All food orders placed by {waiterName} with itemized pricing, taxes, and bills.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
                {[
                  { id: "all", label: "All Tickets" },
                  { id: "pending", label: "Cooking" },
                  { id: "ready", label: "Ready to Serve" },
                  { id: "served", label: "Completed" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setKotStatusFilter(st.id)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold transition-all",
                      kotStatusFilter === st.id
                        ? "bg-brand-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-56">
                <Input
                  placeholder="Search KOT # or dish..."
                  value={kotSearchQuery}
                  onChange={(e) => setKotSearchQuery(e.target.value)}
                  icon={<Search className="h-3.5 w-3.5 text-slate-400" />}
                />
              </div>
            </div>
          </div>

          {waiterKotTickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl bg-white dark:bg-slate-900 space-y-2">
              <ChefHat className="h-10 w-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No KOT orders found</p>
              <p className="text-xs text-slate-400">
                Dishes sent to the kitchen from your seated tables will appear here with full pricing details.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waiterKotTickets.map((kot) => {
                const isReady = kot.status === "ready";
                const isPreparing = kot.status === "preparing" || kot.status === "sent";

                return (
                  <div
                    key={kot.id}
                    className={cn(
                      "rounded-2xl border-2 p-4 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between transition-all",
                      isReady
                        ? "border-teal-400 dark:border-teal-700 ring-2 ring-teal-400/20"
                        : isPreparing
                        ? "border-amber-300 dark:border-amber-800"
                        : "border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-base text-slate-900 dark:text-slate-100">
                            {kot.kotNumber}
                          </span>
                          <span className="font-extrabold text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {kot.orderType === "dine_in"
                              ? `Table ${kot.tableNumber.replace("Table ", "")}`
                              : kot.orderType === "takeaway"
                              ? "Takeaway"
                              : "Delivery"}
                          </span>
                        </div>

                        <Badge
                          variant={isReady ? "success" : isPreparing ? "warning" : "secondary"}
                          className="text-[10px] font-extrabold uppercase"
                        >
                          {isReady ? "🟢 FOOD READY" : isPreparing ? "🟠 COOKING" : "🔵 QUEUED"}
                        </Badge>
                      </div>

                      {/* Meta Information */}
                      <div className="py-2.5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Waiter: <strong className="text-slate-800 dark:text-slate-200">{kot.waiterName}</strong></span>
                          <span className="flex items-center text-[11px]">
                            <Clock className="h-3 w-3 mr-1 text-slate-400" />
                            {kot.sentAt ? new Date(kot.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span>Bill Ref: <strong className="font-mono text-purple-700 dark:text-purple-300">{kot.billNumber}</strong></span>
                          <span className="font-mono text-slate-400">{kot.orderNumber}</span>
                        </div>
                      </div>

                      {/* Ordered Items Table */}
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1.5 my-1">
                        <div className="grid grid-cols-12 text-[10px] font-extrabold text-slate-400 uppercase pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span className="col-span-6">Item</span>
                          <span className="col-span-2 text-center">Qty</span>
                          <span className="col-span-2 text-right">Price</span>
                          <span className="col-span-2 text-right">Total</span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto">
                          {kot.items.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 text-xs py-1.5 text-slate-800 dark:text-slate-200 items-center">
                              <span className="col-span-6 font-semibold truncate pr-1">
                                {item.name}
                              </span>
                              <span className="col-span-2 text-center font-bold text-slate-900 dark:text-slate-100">
                                {item.quantity}×
                              </span>
                              <span className="col-span-2 text-right text-[11px] text-slate-500">
                                ₹{item.unitPrice}
                              </span>
                              <span className="col-span-2 text-right font-bold text-slate-900 dark:text-slate-100">
                                ₹{item.totalPrice}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Breakdown: Subtotal, Tax, Discount, Grand Total */}
                      <div className="py-2.5 px-1 space-y-1 text-xs border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatCurrency(kot.subtotal)}
                          </span>
                        </div>

                        {kot.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold text-[11px]">
                            <span>Discount</span>
                            <span>-{formatCurrency(kot.discountAmount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>GST / Tax (5%)</span>
                          <span>{formatCurrency(kot.taxAmount)}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              Grand Total:
                            </span>
                            <Badge
                              variant={kot.paymentStatus === "paid" ? "success" : "warning"}
                              className="text-[9px] uppercase font-bold px-1.5 py-0.2"
                            >
                              {kot.paymentStatus.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-base font-black text-brand-600 dark:text-brand-400">
                            {formatCurrency(kot.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: View Bill */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedBillForPreview(kot.billData)}
                        className="flex-1 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-xs space-x-1.5 py-2"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>View Bill</span>
                      </Button>

                      {kot.tableId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tbl = tables.find((t) => t.id === kot.tableId) || {
                              id: kot.tableId!,
                              tableNumber: kot.tableNumber,
                              section: "AC Hall",
                              capacity: 4,
                              status: "occupied" as TableStatus,
                            };
                            setSelectedTableForOrder(tbl);
                          }}
                          className="text-xs font-bold py-2"
                        >
                          Manage Table
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Quick Guest Seating Prompt Modal */}
      {seatingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Seat Table {seatingTable.tableNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {seatingTable.section} • Capacity: {seatingTable.capacity}
                </p>
              </div>
              <button
                onClick={() => setSeatingTable(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-center py-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Number of Guests
              </label>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setSeatingGuestCount((c) => Math.max(1, c - 1))}
                  className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-lg font-extrabold flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 w-12 text-center">
                  {seatingGuestCount}
                </span>
                <button
                  onClick={() => setSeatingGuestCount((c) => Math.min(24, c + 1))}
                  className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-lg font-extrabold flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSeatingTable(null)}
                className="flex-1 font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartOrderFromPrompt}
                className="flex-1 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                START ORDER
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Full Table Order & Details Modal */}
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

      {/* 7. Bill Receipt Modal (View-only for Waiter) */}
      {selectedBillForPreview && (
        <BillReceiptModal
          isOpen={!!selectedBillForPreview}
          onClose={() => setSelectedBillForPreview(null)}
          bill={selectedBillForPreview}
          allowPrintOverride={false}
        />
      )}
    </div>
  );
}
