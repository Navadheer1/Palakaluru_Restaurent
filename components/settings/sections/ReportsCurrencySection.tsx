"use client";

import * as React from "react";
import { BarChart3, Clock, DollarSign, Calendar, FileSpreadsheet } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function ReportsCurrencySection() {
  const { reportsCurrency, pendingChanges, updatePending } = useSettingsStore();

  const currentReports = pendingChanges?.reportsCurrency || reportsCurrency;

  const handleChange = (field: keyof typeof currentReports, val: any) => {
    updatePending("reportsCurrency", { [field]: val });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-brand-600" />
          Financial Day Cutoff & Business Day Rollover
        </h3>
        <p className="text-xs text-slate-500">
          Restaurants often trade past midnight (e.g. until 01:00 AM). The financial day cutoff ensures night shift sales stay grouped into the correct business day.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Daily Shift Cutoff Time (24h)
            </label>
            <Input
              type="time"
              value={currentReports.financialDayCutoffTime}
              onChange={(e) => handleChange("financialDayCutoffTime", e.target.value)}
              className="font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Default 04:00 AM ensures late-night dinners belong to previous calendar date.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Reporting Week Start Day
            </label>
            <select
              value={currentReports.weekStartDay}
              onChange={(e) => handleChange("weekStartDay", e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
            >
              <option value="monday">Monday (Standard Indian Financial Week)</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Decimal Precision
            </label>
            <Input
              type="number"
              value={currentReports.decimalPrecision}
              onChange={(e) => handleChange("decimalPrecision", parseInt(e.target.value) || 2)}
            />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-brand-600" />
          Export Formats & Data Integrity
        </h3>
        <p className="text-xs text-slate-500">
          Allowed administrative data export formats for chartered accountant audits.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          {["excel", "csv", "pdf"].map((fmt) => (
            <div
              key={fmt}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center space-x-2 text-xs font-bold uppercase"
            >
              <Badge variant="brand" size="sm">
                {fmt}
              </Badge>
              <span>Export Enabled</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
