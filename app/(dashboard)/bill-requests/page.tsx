"use client";

import * as React from "react";
import {
  Receipt,
  BellRing,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Search,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDineInStore } from "@/stores/useDineInStore";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { formatCurrency, cn } from "@/lib/utils";

interface BillRequestItem {
  tableId: string;
  tableNumber: string;
  orderNumber: string;
  waiterName: string;
  guestCount: number;
  requestedAt?: string;
  status: "waiting_for_admin" | "bill_ready" | "paid";
  amount: number;
  billNumber?: string;
}

export default function BillRequestsPage() {
  const { profile } = useAuthProfile();
  const { activeRole, canBill, canPay } = useRolePermissions();
  const { sessions, cancelBillRequest } = useDineInStore();

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedTableForModal, setSelectedTableForModal] = React.useState<{ id: string; number: string } | null>(null);

  const isWaiter = activeRole === "waiter";
  const isAdminOrCashier = canBill || canPay || activeRole === "admin" || activeRole === "cashier";

  // Filter sessions that have either bill requested or bill generated
  const billRequests: BillRequestItem[] = React.useMemo(() => {
    return Object.values(sessions)
      .filter((s) => (s.billRequested || s.bill) && s.paymentStatus !== "paid")
      .map((s) => {
        const subtotal = s.sentItems.reduce((acc, i) => acc + i.total_price, 0);
        const derivedAmount = s.bill?.final_total || Math.round(subtotal * 1.05);

        let derivedStatus: "waiting_for_admin" | "bill_ready" | "paid" = "waiting_for_admin";
        if (s.bill) {
          derivedStatus = "bill_ready";
        }

        return {
          tableId: s.tableId,
          tableNumber: s.tableNumber,
          orderNumber: s.orderNumber,
          waiterName: s.waiterName || "Staff",
          guestCount: s.guestCount,
          requestedAt: s.billRequestedAt || s.createdAt,
          status: derivedStatus,
          amount: derivedAmount,
          billNumber: s.bill?.bill_number,
        };
      });
  }, [sessions]);

  const filtered = billRequests.filter((r) =>
    r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.waiterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.billNumber && r.billNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: billRequests.length,
    waiting: billRequests.filter((r) => r.status === "waiting_for_admin").length,
    ready: billRequests.filter((r) => r.status === "bill_ready").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <Receipt className="h-6 w-6 mr-2 text-purple-600" />
              Bill Requests & Invoicing
            </h1>
            <Badge variant={stats.waiting > 0 ? "warning" : "primary"}>
              {stats.waiting > 0 ? `${stats.waiting} Awaiting Cashier` : "Live Tracker"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Waiter requests bill ➔ Cashier generates final invoice ➔ Guest settles payment
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search Table or Bill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Active Requests</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className={cn(
          "p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between transition-all",
          stats.waiting > 0
            ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 bg-amber-50/20"
            : "border-amber-200 dark:border-amber-900/60"
        )}>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Waiting For Cashier</p>
            <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">{stats.waiting}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <BellRing className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase">Bill Ready (Payment Pending)</p>
            <p className="text-2xl font-extrabold text-purple-800 dark:text-purple-300 mt-0.5">{stats.ready}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Bill Requests Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Table</th>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Guests</th>
                <th className="p-3.5">Staff</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Bill Status</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No active bill requests. Tables will appear here when a guest requests the bill.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isReady = item.status === "bill_ready";

                  return (
                    <tr
                      key={item.tableId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="h-8 w-8 rounded-lg bg-brand-600 text-white font-extrabold flex items-center justify-center text-xs">
                            {item.tableNumber}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            Table {item.tableNumber}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-500 font-semibold">
                        {item.billNumber || item.orderNumber}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {item.guestCount} Guests
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {item.waiterName}
                      </td>

                      <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="p-3.5">
                        {isReady ? (
                          <Badge variant="primary" className="text-[10px] font-extrabold bg-purple-600 text-white">
                            🟣 BILL READY
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                            🟡 WAITING FOR ADMIN
                          </Badge>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-400">
                        {item.requestedAt
                          ? new Date(item.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Just now"}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isWaiter && !isReady && (
                            <button
                              onClick={() => cancelBillRequest(item.tableId)}
                              className="text-[11px] font-bold text-rose-600 hover:underline px-2 py-1"
                            >
                              Cancel
                            </button>
                          )}

                          <Button
                            variant={isReady ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTableForModal({ id: item.tableId, number: item.tableNumber })}
                            className={cn(
                              "text-xs font-bold",
                              isReady && "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                            )}
                          >
                            {isReady ? "View Bill" : "Manage"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Order Modal */}
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
