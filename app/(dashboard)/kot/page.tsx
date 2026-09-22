"use client";

import * as React from "react";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Utensils,
  Search,
  CheckCheck,
  Receipt,
  Printer,
  Calendar,
  UserCheck,
  Grid,
  ShoppingBag,
  Bike,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { useKotTickets, UnifiedKotTicket } from "@/lib/hooks/useKotTickets";
import { useDineInStore } from "@/stores/useDineInStore";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { BillReceiptModal, BillData } from "@/components/billing/BillReceiptModal";
import { formatCurrency, cn } from "@/lib/utils";

export default function KotStatusPage() {
  const { profile } = useAuthProfile();
  const { activeRole } = useRolePermissions();
  const { updateKotStatusInSession } = useDineInStore();

  const isWaiter = activeRole === "waiter";
  const loggedInWaiterName = profile?.full_name || profile?.name || "R. Naresh";

  // Filter States
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [orderTypeFilter, setOrderTypeFilter] = React.useState<string>("all");
  const [tableFilter, setTableFilter] = React.useState<string>("all");
  const [waiterFilter, setWaiterFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modal States
  const [selectedTableForModal, setSelectedTableForModal] = React.useState<{ id: string; number: string } | null>(null);
  const [selectedBillForPreview, setSelectedBillForPreview] = React.useState<BillData | null>(null);

  // Hook retrieving unified real-time KOT tickets
  const {
    tickets,
    allTickets,
    filterOptions,
    totalCount,
    cookingCount,
    readyCount,
    servedCount,
  } = useKotTickets({
    statusFilter,
    orderTypeFilter,
    tableFilter,
    waiterFilter,
    dateFilter,
    searchQuery,
    waiterOnlyName: isWaiter ? loggedInWaiterName : undefined,
  });

  const handleMarkServed = (ticket: UnifiedKotTicket) => {
    updateKotStatusInSession(ticket.id, "ready");
  };

  const handleViewBill = (ticket: UnifiedKotTicket) => {
    setSelectedBillForPreview(ticket.billData);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <ChefHat className="h-6 w-6 mr-2 text-brand-600" />
              Kitchen Order Tickets (KOT)
            </h1>
            <Badge variant="primary" className="font-extrabold uppercase text-[10px]">
              {isWaiter ? "Waiter Station" : "Admin Live Dispatch"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isWaiter
              ? `Live KOT orders created by ${loggedInWaiterName}. Track cooking progress and view bills.`
              : "Consolidated live KOT orders across all dining floor tables, takeaway counter, and deliveries."}
          </p>
        </div>

        {/* Quick Search */}
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search KOT #, Bill #, Table, Dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* 2. Operational KPI Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Tickets</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <ChefHat className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Cooking in Kitchen</p>
            <p className="text-2xl font-black text-amber-800 dark:text-amber-300">{cookingCount}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase">Ready To Serve</p>
            <p className="text-2xl font-black text-teal-800 dark:text-teal-300">{readyCount}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Served / Done</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{servedCount}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Utensils className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar (Table, Waiter, Order Type, Date, Status) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {[
              { id: "all", label: "All Tickets" },
              { id: "pending", label: "Cooking in Kitchen" },
              { id: "ready", label: "Ready to Serve" },
              { id: "served", label: "Served / Done" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  statusFilter === tab.id
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button */}
          {(tableFilter !== "all" || waiterFilter !== "all" || orderTypeFilter !== "all" || dateFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setTableFilter("all");
                setWaiterFilter("all");
                setOrderTypeFilter("all");
                setDateFilter("all");
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid: Table, Waiter, Order Type, Date */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-0.5">
          {/* Filter by Table */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center">
              <Grid className="h-3 w-3 mr-1" />
              Filter by Table
            </label>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Tables</option>
              {filterOptions.tables.map((t) => (
                <option key={t} value={t}>
                  {t.startsWith("T-") || t.startsWith("Table") ? `Table ${t.replace("Table ", "")}` : t}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Waiter (Admin only or disabled for waiter) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center">
              <UserCheck className="h-3 w-3 mr-1" />
              Filter by Waiter
            </label>
            {isWaiter ? (
              <div className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 text-slate-600 dark:text-slate-400">
                {loggedInWaiterName} (Locked)
              </div>
            ) : (
              <select
                value={waiterFilter}
                onChange={(e) => setWaiterFilter(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Waiters & Staff</option>
                {filterOptions.waiters.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Filter by Order Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center">
              <ShoppingBag className="h-3 w-3 mr-1" />
              Filter by Order Type
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Order Types</option>
              <option value="dine_in">Dine-In</option>
              <option value="takeaway">Takeaway Counter</option>
              <option value="delivery">Home Delivery</option>
            </select>
          </div>

          {/* Filter by Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. KOT Cards Grid */}
      {tickets.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl bg-white dark:bg-slate-900 space-y-2">
          <ChefHat className="h-10 w-10 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No KOT tickets match your current filters</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Dispatched kitchen tickets from floor tables, counter takeaway, or online orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((k) => {
            const isReady = k.status === "ready";
            const isPreparing = k.status === "preparing" || k.status === "sent";
            const isServed = k.status === "served" || k.status === "completed";

            return (
              <div
                key={k.id}
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
                  {/* Top Header: KOT #, Type/Table Badge, Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-base text-slate-900 dark:text-slate-100">
                        {k.kotNumber}
                      </span>
                      <span className={cn(
                        "font-extrabold text-[11px] px-2 py-0.5 rounded-lg border",
                        k.orderType === "dine_in"
                          ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800"
                          : k.orderType === "takeaway"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                          : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                      )}>
                        {k.orderType === "dine_in"
                          ? `Table ${k.tableNumber.replace("Table ", "")}`
                          : k.orderType === "takeaway"
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

                  {/* Metadata: Waiter, Time, Bill # */}
                  <div className="py-2.5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Staff / Waiter: <strong className="text-slate-800 dark:text-slate-200">{k.waiterName}</strong></span>
                      <span className="flex items-center text-[11px]">
                        <Clock className="h-3 w-3 mr-1 text-slate-400" />
                        {k.sentAt ? new Date(k.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Bill Ref: <strong className="font-mono text-purple-700 dark:text-purple-300">{k.billNumber}</strong></span>
                      <span className="font-mono text-slate-400">{k.orderNumber}</span>
                    </div>

                    {k.customerName && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        Customer: <strong>{k.customerName}</strong> {k.customerPhone ? `(${k.customerPhone})` : ""}
                      </p>
                    )}
                  </div>

                  {/* Ordered Items Table: Name, Qty, Unit Price, Total */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1.5 my-1">
                    <div className="grid grid-cols-12 text-[10px] font-extrabold text-slate-400 uppercase pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="col-span-6">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                      {k.items.map((item, idx) => (
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

                  {/* Financial Breakdown: Subtotal, Taxes, Discount, Grand Total */}
                  <div className="py-2.5 px-1 space-y-1 text-xs border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(k.subtotal)}
                      </span>
                    </div>

                    {k.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold text-[11px]">
                        <span>Discount</span>
                        <span>-{formatCurrency(k.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>GST / Tax (5%)</span>
                      <span>{formatCurrency(k.taxAmount)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          Grand Total:
                        </span>
                        <Badge
                          variant={k.paymentStatus === "paid" ? "success" : "warning"}
                          className="text-[9px] uppercase font-bold px-1.5 py-0.2"
                        >
                          {k.paymentStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-base font-black text-brand-600 dark:text-brand-400">
                        {formatCurrency(k.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: View Bill & Serve */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleViewBill(k)}
                    className="flex-1 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-xs space-x-1.5 py-2"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>View Bill</span>
                  </Button>

                  {k.tableId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTableForModal({ id: k.tableId!, number: k.tableNumber })}
                      className="text-xs font-bold py-2"
                      title="Open Table Dining Order"
                    >
                      Table
                    </Button>
                  )}

                  {isReady && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMarkServed(k)}
                      className="text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white shadow-xs py-2 px-2.5"
                      title="Mark Dish Served"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Printable / Screen Bill Receipt Modal */}
      {selectedBillForPreview && (
        <BillReceiptModal
          isOpen={!!selectedBillForPreview}
          onClose={() => setSelectedBillForPreview(null)}
          bill={selectedBillForPreview}
          allowPrintOverride={false}
          showPrintButton={false}
        />
      )}

      {/* 6. Table Order Modal */}
      {selectedTableForModal && (
        <TableOrderModal
          isOpen={!!selectedTableForModal}
          onClose={() => setSelectedTableForModal(null)}
          tableId={selectedTableForModal.id}
          tableNumber={selectedTableForModal.number}
        />
      )}
    </div>
  );
}
