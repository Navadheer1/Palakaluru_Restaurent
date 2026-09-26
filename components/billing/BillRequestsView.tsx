"use client";

import * as React from "react";
import {
  Receipt,
  BellRing,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useDineInStore } from "@/stores/useDineInStore";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { formatCurrency, cn } from "@/lib/utils";
import { UserRole } from "@/lib/constants";

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

interface BillRequestsViewProps {
  role: UserRole;
}

export function BillRequestsView({ role }: BillRequestsViewProps) {
  const { sessions, cancelBillRequest } = useDineInStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedTableForModal, setSelectedTableForModal] = React.useState<{ id: string; number: string } | null>(null);

  const isWaiter = role === "waiter";
  const isCashierOrAdmin = role === "cashier" || role === "admin" || role === "manager";

  // Filter sessions that have either bill requested or bill generated
  const billRequests: BillRequestItem[] = React.useMemo(() => {
    if (!mounted) return [];
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
          orderNumber: s.orderId ? `ORD-${s.orderId.slice(-4).toUpperCase()}` : `TBL-${s.tableNumber}`,
          waiterName: s.waiterName || "Floor Waiter",
          guestCount: s.guestCount || 2,
          requestedAt: new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: derivedStatus,
          amount: derivedAmount,
          billNumber: s.bill?.bill_number,
        };
      })
      .filter(
        (r) =>
          r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.billNumber && r.billNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [sessions, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <Receipt className="h-6 w-6 mr-2 text-purple-600" />
              {isWaiter ? "Guest Bill Requests" : "Cashier Bill Settlement Queue"}
            </h1>
            <Badge variant="primary" className="font-extrabold uppercase text-[10px]">
              {isWaiter ? "Waiter View" : "Cashier POS Live"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isWaiter
              ? "Monitor guest bill requests sent to Cashier. Once bill is ready, present to table."
              : "Review table bill requests, generate final GST invoices, and settle payments."}
          </p>
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Search Table #, Order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
      </div>

      {/* Grid of Bill Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!mounted ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span>Loading bill requests...</span>
          </div>
        ) : billRequests.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            No active bill requests at this moment.
          </div>
        ) : (
          billRequests.map((req) => {
            const isReady = req.status === "bill_ready";

            return (
              <div
                key={req.tableId}
                className={cn(
                  "rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all bg-white dark:bg-slate-900",
                  isReady
                    ? "border-purple-300 dark:border-purple-800/80 bg-purple-50/20"
                    : "border-amber-300 dark:border-amber-800/80 bg-amber-50/20"
                )}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                        Table {req.tableNumber}
                      </h3>
                      <p className="text-[11px] text-slate-500">{req.orderNumber} • {req.guestCount} Guests</p>
                    </div>
                    <Badge
                      variant={isReady ? "primary" : "warning"}
                      className={cn(
                        "font-extrabold text-[10px]",
                        !isReady && "animate-pulse"
                      )}
                    >
                      {isReady ? "BILL READY" : "BILL REQUESTED"}
                    </Badge>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Payable Amount</span>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(req.amount)}
                    </span>
                  </div>

                  {req.billNumber && (
                    <p className="text-[11px] font-bold text-purple-600 mt-2">
                      Invoice #{req.billNumber}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTableForModal({ id: req.tableId, number: req.tableNumber })}
                    className="flex-1 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Review Table
                  </Button>

                  {isWaiter && !isReady && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => cancelBillRequest(req.tableId)}
                      className="text-xs text-amber-700"
                    >
                      Cancel
                    </Button>
                  )}

                  {isCashierOrAdmin && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedTableForModal({ id: req.tableId, number: req.tableNumber })}
                      className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" />
                      {isReady ? "Record Payment" : "Generate Bill"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
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
    </div>
  );
}
