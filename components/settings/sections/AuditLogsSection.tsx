"use client";

import * as React from "react";
import { History, Search, ShieldCheck, Filter, ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function AuditLogsSection() {
  const { auditLogs, lastModified } = useSettingsStore();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [moduleFilter, setModuleFilter] = React.useState<string>("all");

  const filteredLogs = (auditLogs || []).filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const modules = Array.from(new Set((auditLogs || []).map((l) => l.module)));

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <History className="h-4 w-4 mr-2 text-brand-600" />
              Administrative Audit Log & Change Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Immutable historical trail of configuration updates, role assignments, and approvals.
            </p>
          </div>

          <div className="text-right text-[11px] text-slate-500">
            <span>Last change by: </span>
            <strong className="text-slate-700 dark:text-slate-300">{lastModified.by}</strong>
            <span className="block">{new Date(lastModified.at).toLocaleString()}</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by admin name, action, or module..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Module</th>
                <th className="p-3">Action</th>
                <th className="p-3">Old Value</th>
                <th className="p-3">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {log.userName}
                      </span>
                      <span className="text-[10px] uppercase text-brand-600 font-semibold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                        {log.module}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-[150px] truncate" title={log.oldValue}>
                      {log.oldValue}
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] max-w-[150px] truncate" title={log.newValue}>
                      {log.newValue}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
