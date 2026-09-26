"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Receipt,
  Sparkles,
  RefreshCw,
  History
} from "lucide-react";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useCashierShiftStore } from "@/stores/useCashierShiftStore";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { CashierShift } from "@/types/database";

export function CashierDrawerShiftView() {
  const { profile } = useAuthProfile();
  const cashierId = profile?.id || "cashier";
  const cashierName = profile?.full_name || profile?.name || "Cashier";
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  const { activeShift, openShift, closeShift } = useCashierShiftStore();

  const [openingInput, setOpeningInput] = useState("5000");
  const [actualCashInput, setActualCashInput] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [pastShifts, setPastShifts] = useState<CashierShift[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Fetch past shifts for this cashier
  const fetchPastShifts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("cashier_shifts")
      .select("*")
      .eq("cashier_id", cashierId)
      .eq("status", "closed")
      .order("opened_at", { ascending: false })
      .limit(20);

    if (data) {
      setPastShifts(data as CashierShift[]);
    }
  }, [cashierId]);

  useEffect(() => {
    fetchPastShifts();
  }, [fetchPastShifts]);

  // Expected Cash calculation
  const expectedCash = (activeShift?.opening_cash || 0) + (activeShift?.cash_sales || 0);
  const actualCash = parseFloat(actualCashInput) || 0;
  const cashDifference = actualCash - expectedCash;

  const handleOpenRegister = async () => {
    const amt = parseFloat(openingInput) || 0;
    await openShift(restaurantId, cashierId, cashierName, amt, "Opened from Cash Drawer");
    setIsOpenModalOpen(false);
    setNotice("Cash drawer session opened successfully!");
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCloseRegister = async () => {
    const res = await closeShift(actualCash, closingNotes);
    if (res.success) {
      setIsCloseModalOpen(false);
      fetchPastShifts();
      setNotice(
        `Shift closed. Cash difference: ${
          res.difference >= 0 ? `+${formatCurrency(res.difference)}` : formatCurrency(res.difference)
        }`
      );
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Cash Drawer & Shift Management
            </h1>
            <p className="text-xs text-slate-500">
              Cash float accountability, drawer balancing, and shift reconciliation
            </p>
          </div>
        </div>

        <button
          onClick={fetchPastShifts}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{notice}</span>
        </div>
      )}

      {/* ACTIVE REGISTER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "w-3 h-3 rounded-full",
                activeShift ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              )}
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeShift ? "Register Open" : "Register Closed"}
              </h2>
              <span className="text-xs text-slate-500">
                Cashier: {cashierName}
              </span>
            </div>
          </div>

          <div>
            {activeShift ? (
              <button
                onClick={() => {
                  setActualCashInput(expectedCash.toString());
                  setIsCloseModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                Close Register & Shift
              </button>
            ) : (
              <button
                onClick={() => setIsOpenModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                Start Shift & Open Register
              </button>
            )}
          </div>
        </div>

        {/* Live Float & Sales Breakdown */}
        {activeShift ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">Opening Cash Float</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(activeShift.opening_cash)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Starting cash float</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">Cash Received in Shift</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(activeShift.cash_sales)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">From cash sales</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold block mb-1">
                  Expected Cash in Drawer
                </span>
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  {formatCurrency(expectedCash)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">
                  Float + Cash Sales
                </span>
              </div>
            </div>

            {/* Non-Cash Sales Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                <span className="text-slate-500">UPI Sales:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(activeShift.upi_sales)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-500" />
                <span className="text-slate-500">Card Sales:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(activeShift.card_sales)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Total Bills:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeShift.total_bills}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-1" />
            <p>No active register session. Click "Start Shift & Open Register" to begin billing.</p>
          </div>
        )}
      </div>

      {/* SHIFT HISTORY SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            My Past Shifts History
          </h3>
        </div>

        {pastShifts.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No closed shifts found in your history.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pastShifts.map((s) => (
              <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{new Date(s.opened_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                    <span className="text-slate-400 font-normal">
                      ({new Date(s.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                      {s.closed_at ? new Date(s.closed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bills: {s.total_bills} • Cash: {formatCurrency(s.cash_sales)} • UPI: {formatCurrency(s.upi_sales)} • Card: {formatCurrency(s.card_sales)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Difference</span>
                    <span
                      className={cn(
                        "font-extrabold text-xs",
                        (s.cash_difference || 0) === 0
                          ? "text-emerald-500"
                          : (s.cash_difference || 0) < 0
                          ? "text-rose-500"
                          : "text-blue-500"
                      )}
                    >
                      {(s.cash_difference || 0) >= 0 ? `+${formatCurrency(s.cash_difference || 0)}` : formatCurrency(s.cash_difference || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Register Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Open Register Shift
            </h3>
            <p className="text-xs text-slate-500">
              Count and enter the initial cash float in your drawer.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Starting Cash Float (₹)
              </label>
              <input
                type="number"
                value={openingInput}
                onChange={(e) => setOpeningInput(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsOpenModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenRegister}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm & Open Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Close Register & Shift
            </h3>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Opening Cash Float</span>
                <span>{formatCurrency(activeShift?.opening_cash || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cash Sales</span>
                <span>{formatCurrency(activeShift?.cash_sales || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Expected Cash</span>
                <span>{formatCurrency(expectedCash)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Actual Cash Counted in Drawer (₹)
              </label>
              <input
                type="number"
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Difference callout */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs flex justify-between items-center">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Difference:</span>
              <span
                className={cn(
                  "font-black text-sm",
                  cashDifference === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : cashDifference < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-blue-600 dark:text-blue-400"
                )}
              >
                {cashDifference >= 0 ? `+${formatCurrency(cashDifference)}` : formatCurrency(cashDifference)}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Handover Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Discrepancies, cash handovers..."
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl h-14"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseRegister}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm & Close Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
