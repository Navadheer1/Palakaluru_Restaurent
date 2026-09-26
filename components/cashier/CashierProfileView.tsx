"use client";

import React from "react";
import { User, ShieldCheck, Wallet, LogOut, Phone, Mail, Building, Clock } from "lucide-react";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useCashierShiftStore } from "@/stores/useCashierShiftStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export function CashierProfileView() {
  const { profile } = useAuthProfile();
  const { activeShift } = useCashierShiftStore();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const cashierName = profile?.full_name || profile?.name || "Cashier Staff";
  const cashierEmail = profile?.email || "cashier@palakaluru.com";
  const cashierPhone = profile?.phone || "+91 98480 23456";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white text-2xl font-black flex items-center justify-center mx-auto shadow-md">
          {cashierName.slice(0, 2).toUpperCase()}
        </div>

        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            {cashierName}
          </h1>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
            Counter Billing & Cashier
          </span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{cashierEmail}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{cashierPhone}</span>
          </div>
        </div>
      </div>

      {/* Current Shift Status Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Active Register Session
        </h3>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                activeShift ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {activeShift ? "Register Open" : "Register Closed"}
              </span>
              <span className="text-[11px] text-slate-500">
                {activeShift
                  ? `Float: ${formatCurrency(activeShift.opening_cash)} • Started ${new Date(activeShift.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "No open register session"}
              </span>
            </div>
          </div>

          <Link
            href="/cashier/shift"
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            {activeShift ? "Manage Drawer" : "Open Register"}
          </Link>
        </div>
      </div>

      {/* Permissions Disclosure */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs text-slate-500">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Cashier Role Permissions</span>
        </h3>
        <p>• Authorized for POS billing, Dine-in payments, Takeaway and Delivery order bills.</p>
        <p>• Authorized for receipt printing and reprinting.</p>
        <p>• Authorized for cash drawer shift opening, float balancing, and closing reconciliations.</p>
        <p>• System and pricing configurations are restricted to restaurant administration.</p>
      </div>

      {/* Logout Action */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Cashier Session</span>
      </button>
    </div>
  );
}
