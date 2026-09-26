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
  Grid,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useKotTickets, UnifiedKotTicket } from "@/lib/hooks/useKotTickets";
import { useDineInStore } from "@/stores/useDineInStore";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { BillReceiptModal, BillData } from "@/components/billing/BillReceiptModal";
import { formatCurrency, cn } from "@/lib/utils";
import { UserRole } from "@/lib/constants";

interface KotStatusViewProps {
  role: UserRole;
  initialStatusFilter?: string;
}

export function KotStatusView({ role, initialStatusFilter }: KotStatusViewProps) {
  const { profile } = useAuthProfile();
  const { updateKotStatusInSession } = useDineInStore();

  const isWaiter = role === "waiter";
  const loggedInWaiterName = profile?.full_name || profile?.name || "Waiter";

  // Filter States
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter || "all");
  const [orderTypeFilter, setOrderTypeFilter] = React.useState<string>("all");
  const [tableFilter, setTableFilter] = React.useState<string>("all");
  const [waiterFilter, setWaiterFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modal States
  const [selectedTableForModal, setSelectedTableForModal] = React.useState<{ id: string; number: string } | null>(null);
  const [selectedBillForPreview, setSelectedBillForPreview] = React.useState<BillData | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    tickets,
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
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <ChefHat className="h-6 w-6 mr-2 text-brand-600" />
              Kitchen Order Tickets (KOT)
            </h1>
            <Badge variant="primary" className="font-extrabold uppercase text-[10px]">
              {isWaiter ? "Waiter Station" : `${role.toUpperCase()} View`}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isWaiter
              ? `Live KOT orders created by ${loggedInWaiterName}. Track cooking progress.`
              : "Consolidated live KOT tickets across all dining tables, takeaway counter, and deliveries."}
          </p>
        </div>

        {/* Quick Search */}
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search KOT #, Table, Dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter("all")}
          className={cn(
            "p-3.5 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "all"
              ? "bg-brand-50/70 border-brand-500/50 shadow-xs dark:bg-brand-950/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Tickets</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{mounted ? totalCount : 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter("preparing")}
          className={cn(
            "p-3.5 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "preparing"
              ? "bg-amber-50/70 border-amber-500/50 shadow-xs dark:bg-amber-950/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Cooking
          </p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{mounted ? cookingCount : 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter("ready")}
          className={cn(
            "p-3.5 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "ready"
              ? "bg-emerald-50/70 border-emerald-500/50 shadow-xs dark:bg-emerald-950/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Food Ready
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{mounted ? readyCount : 0}</p>
        </div>

        <div
          onClick={() => setStatusFilter("served")}
          className={cn(
            "p-3.5 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "served"
              ? "bg-slate-100 border-slate-400 shadow-xs dark:bg-slate-800"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[11px] font-semibold text-slate-500 uppercase flex items-center">
            <CheckCheck className="h-3 w-3 mr-1" />
            Served
          </p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-0.5">{mounted ? servedCount : 0}</p>
        </div>
      </div>

      {/* 3. Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!mounted ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span>Loading KOT tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            No KOT tickets matching this filter.
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t.kotNumber}</span>
                  <span className="block text-[11px] text-slate-500 font-semibold">{t.tableNumber || "Order"}</span>
                </div>
                <Badge
                  variant={
                    t.status === "ready"
                      ? "success"
                      : t.status === "preparing"
                      ? "warning"
                      : "secondary"
                  }
                  className="font-extrabold text-[10px]"
                >
                  {t.status.toUpperCase()}
                </Badge>
              </div>

              <div className="p-4 flex-1 space-y-2">
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {t.items.map((i, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {i.name} <span className="font-bold text-brand-600">×{i.quantity}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-400">
                  {t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
                {t.tableId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTableForModal({ id: t.tableId!, number: t.tableNumber || "01" })}
                    className="text-[11px]"
                  >
                    Open Table
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table Order Modal */}
      {selectedTableForModal && (
        <TableOrderModal
          isOpen={!!selectedTableForModal}
          onClose={() => setSelectedTableForModal(null)}
          tableId={selectedTableForModal.id}
          tableNumber={selectedTableForModal.number}
          role={role}
        />
      )}

      {/* Bill Receipt Modal */}
      {selectedBillForPreview && (
        <BillReceiptModal
          isOpen={!!selectedBillForPreview}
          onClose={() => setSelectedBillForPreview(null)}
          bill={selectedBillForPreview}
          allowPrintOverride={!isWaiter}
        />
      )}
    </div>
  );
}
