"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  UtensilsCrossed, 
  Receipt, 
  Wallet, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  BellRing
} from "lucide-react";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useCashierShiftStore } from "@/stores/useCashierShiftStore";
import { useTables } from "@/lib/hooks/useTables";
import { useDineInStore } from "@/stores/useDineInStore";
import { formatCurrency } from "@/lib/utils";

export function CashierDashboardView() {
  const { profile } = useAuthProfile();
  const cashierName = profile?.full_name || profile?.name || "Cashier";
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  const { activeShift, openShift } = useCashierShiftStore();
  const [openingCashInput, setOpeningCashInput] = useState("5000");
  const [isOpenRegisterOpen, setIsOpenRegisterOpen] = useState(false);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Check tables waiting for bill
  const { data: dbTables } = useTables(restaurantId);
  const { sessions } = useDineInStore();

  const tablesWaitingForBill = useMemo(() => {
    return (dbTables || []).filter((t) => {
      const sess = sessions[t.id];
      return (
        t.status === "billing" ||
        t.status === "bill_requested" ||
        sess?.status === "bill_requested" ||
        sess?.billRequested
      );
    });
  }, [dbTables, sessions]);

  const handleOpenRegister = async () => {
    const amt = parseFloat(openingCashInput) || 0;
    await openShift(
      restaurantId,
      profile?.id || "cashier",
      cashierName,
      amt,
      "Shift opened from Cashier Home"
    );
    setIsOpenRegisterOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Cashier Greeting & Shift Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 mb-1">
            Cashier Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, {cashierName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Counter billing, payment collections, receipts & cash register
          </p>
        </div>

        {/* Register Status Pill */}
        <div className="flex items-center gap-3">
          {activeShift ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Register: OPEN</span>
            </div>
          ) : (
            <button
              onClick={() => setIsOpenRegisterOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Register: CLOSED • Open Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Tables Waiting for Bill Alert Banner */}
      {tablesWaitingForBill.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in-0">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-rose-500 animate-bounce" />
            <div>
              <strong className="font-bold">
                {tablesWaitingForBill.length} {tablesWaitingForBill.length === 1 ? "Table" : "Tables"} waiting for Bill Payment:
              </strong>{" "}
              {tablesWaitingForBill.map((t) => t.table_number).join(", ")}
            </div>
          </div>
          <Link
            href="/cashier/pos"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs whitespace-nowrap transition"
          >
            Collect Payment &rarr;
          </Link>
        </div>
      )}

      {/* Today's Shift Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Today's Active Shift Metrics
          </div>
          {activeShift && (
            <span className="text-[11px] text-slate-400 font-mono">
              Started: {new Date(activeShift.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Bills</span>
              <Receipt className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeShift?.total_bills || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Cash Sales</span>
              <Banknote className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(activeShift?.cash_sales || 0)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>UPI</span>
              <QrCode className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(activeShift?.upi_sales || 0)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Card</span>
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(activeShift?.card_sales || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 CORE CASHIER ACTIONS (Massive OPEN POS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OPEN POS - Extra Large / Prominent */}
        <Link
          href="/cashier/pos"
          className="sm:col-span-2 group p-6 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20 transition-all flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Fast Billing [F4]
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 group-hover:translate-x-1 transition-transform">
              <span>OPEN POS TERMINAL</span>
              <ArrowRight className="w-5 h-5" />
            </h2>
            <p className="text-xs text-amber-100 mt-1">
              Instant Dine-In, Takeaway & Delivery order billing
            </p>
          </div>
        </Link>

        {/* BILL HISTORY */}
        <Link
          href="/cashier/bills"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              BILL HISTORY
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Search bills, reprint receipts, void requests
            </p>
          </div>
        </Link>

        {/* CASH DRAWER / SHIFT */}
        <Link
          href="/cashier/shift"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              CASH DRAWER
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Opening float, expected cash, close shift
            </p>
          </div>
        </Link>
      </div>

      {/* Open Register Modal */}
      {isOpenRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Open Register Session
                </h3>
                <p className="text-xs text-slate-500">
                  Enter starting cash float in drawer
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Opening Cash Amount (₹)
              </label>
              <input
                type="number"
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsOpenRegisterOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenRegister}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition"
              >
                Start Shift & Open Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
