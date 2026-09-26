"use client";

import * as React from "react";
import { ShieldCheck, Database, Download, Lock, KeyRound, Clock, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function SecurityBackupSection() {
  const {
    security,
    backupRetention,
    pendingChanges,
    updatePending,
    triggerDataExport,
  } = useSettingsStore();

  const currentSecurity = pendingChanges?.security || security;
  const currentBackup = pendingChanges?.backupRetention || backupRetention;

  const [activeSubTab, setActiveSubTab] = React.useState<"security" | "backup">("security");

  const handleSecurityChange = (field: keyof typeof currentSecurity, val: any) => {
    updatePending("security", { [field]: val });
  };

  const handleBackupChange = (field: keyof typeof currentBackup, val: any) => {
    updatePending("backupRetention", { [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("security")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "security"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security & Session Policies</span>
        </button>
        <button
          onClick={() => setActiveSubTab("backup")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "backup"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Backup, Data Export & Retention</span>
        </button>
      </div>

      {/* 1. SECURITY & SESSIONS */}
      {activeSubTab === "security" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Lock className="h-4 w-4 mr-2 text-brand-600" />
              Session Expiry & Device Concurrency
            </h3>
            <p className="text-xs text-slate-500">
              Protect against unauthorized terminal takeovers when staff walk away from POS desks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Inactivity Logout Timeout (Minutes)
                </label>
                <Input
                  type="number"
                  value={currentSecurity.sessionTimeoutMins}
                  onChange={(e) => handleSecurityChange("sessionTimeoutMins", parseInt(e.target.value) || 30)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Remember Device Duration (Days)
                </label>
                <Input
                  type="number"
                  value={currentSecurity.rememberDeviceDays}
                  onChange={(e) => handleSecurityChange("rememberDeviceDays", parseInt(e.target.value) || 7)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Max Active Sessions Per Account
                </label>
                <Input
                  type="number"
                  value={currentSecurity.maxActiveSessionsPerUser}
                  onChange={(e) => handleSecurityChange("maxActiveSessionsPerUser", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Max Failed Password Attempts Before Lockout
                </label>
                <Input
                  type="number"
                  value={currentSecurity.maxFailedLoginAttempts}
                  onChange={(e) => handleSecurityChange("maxFailedLoginAttempts", parseInt(e.target.value) || 5)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Account Lockout Duration (Minutes)
                </label>
                <Input
                  type="number"
                  value={currentSecurity.lockoutDurationMins}
                  onChange={(e) => handleSecurityChange("lockoutDurationMins", parseInt(e.target.value) || 15)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BACKUP & RETENTION */}
      {activeSubTab === "backup" && (
        <div className="space-y-6">
          {/* Data Export Cards */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Download className="h-4 w-4 mr-2 text-brand-600" />
              Download Restaurant Records & Snapshots
            </h3>
            <p className="text-xs text-slate-500">
              Instantly export operational, financial, and catalog datasets in structured JSON / CSV.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Sales Ledger
                </span>
                <p className="text-[11px] text-slate-500">Aggregated revenue, daily shifts and payment breakdown.</p>
                <Button variant="outline" size="sm" onClick={() => triggerDataExport("sales")} className="w-full text-xs">
                  Export Sales
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Customer Bills
                </span>
                <p className="text-[11px] text-slate-500">All customer invoices with GSTIN tax breakdowns.</p>
                <Button variant="outline" size="sm" onClick={() => triggerDataExport("bills")} className="w-full text-xs">
                  Export Invoices
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Menu & Dishes
                </span>
                <p className="text-[11px] text-slate-500">Full recipe inventory, prices, stations and categories.</p>
                <Button variant="outline" size="sm" onClick={() => triggerDataExport("menu")} className="w-full text-xs">
                  Export Menu
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Full Configuration
                </span>
                <p className="text-[11px] text-slate-500">Complete JSON snapshot of all restaurant settings.</p>
                <Button variant="primary" size="sm" onClick={() => triggerDataExport("all")} className="w-full text-xs">
                  Export System JSON
                </Button>
              </div>
            </div>
          </div>

          {/* Retention Policies */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Database className="h-4 w-4 mr-2 text-brand-600" />
              Automated Data Retention & Financial Integrity Guard
            </h3>
            <p className="text-xs text-slate-500">
              Configure cleanup for high-frequency logs. Financial records and sales ledgers are strictly immutable and never purged automatically.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Audit Logs Retention Period (Days)
                </label>
                <Input
                  type="number"
                  value={currentBackup.retentionDaysAuditLogs}
                  onChange={(e) => handleBackupChange("retentionDaysAuditLogs", parseInt(e.target.value) || 90)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Delivery GPS Location Ping History (Days)
                </label>
                <Input
                  type="number"
                  value={currentBackup.retentionDaysDeliveryLocations}
                  onChange={(e) => handleBackupChange("retentionDaysDeliveryLocations", parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 flex items-center space-x-2 text-xs">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Statutory Financial Protection Active:</strong> Bills, payments, tax calculations, and cashier shifts are permanently preserved to comply with Indian tax regulations.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
