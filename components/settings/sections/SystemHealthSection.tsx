"use client";

import * as React from "react";
import { Activity, Database, Radio, HardDrive, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SystemHealthSection() {
  const { systemHealth, toggleMaintenanceMode } = useSettingsStore();

  const [message, setMessage] = React.useState(systemHealth.maintenanceMode.message);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleToggle = () => {
    toggleMaintenanceMode(!systemHealth.maintenanceMode.enabled, message);
  };

  const handleSaveMessage = () => {
    toggleMaintenanceMode(systemHealth.maintenanceMode.enabled, message);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEALTH METRICS */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-brand-600" />
              Real-Time Infrastructure Health & Sync Status
            </h3>
            <p className="text-xs text-slate-500">
              Diagnostic overview of core backend services, Postgres connectivity, and Realtime sync.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
            {systemHealth.appVersion}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Database className="h-3.5 w-3.5 mr-1.5 text-brand-600" />
                PostgreSQL DB
              </span>
              <Badge variant="success" size="sm">
                Connected
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Supabase cloud pool active. Latency: 42ms.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Radio className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Realtime Channel
              </span>
              <Badge variant="success" size="sm">
                Subscribed
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              WebSocket channels alive for orders, tables & KOTs.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <HardDrive className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                Local Storage Fallback
              </span>
              <Badge variant="brand" size="sm">
                Synced
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Offline cache resilient. Zero transaction loss guarantee.
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAINTENANCE MODE */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-amber-600" />
              Public Maintenance Mode
            </h3>
            <p className="text-xs text-slate-500">
              Temporarily show an advisory notice on the public QR digital menu without stopping in-house POS or kitchen operations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {systemHealth.maintenanceMode.enabled ? "Maintenance Active" : "Normal Live Operations"}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                systemHealth.maintenanceMode.enabled ? "bg-amber-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  systemHealth.maintenanceMode.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Public Announcement Banner Message
          </label>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isEditing}
              className="text-xs"
            />
            {isEditing ? (
              <Button variant="primary" size="sm" onClick={handleSaveMessage}>
                Save
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Internal POS terminals and Waiter handhelds continue working uninterrupted.
          </p>
        </div>
      </div>
    </div>
  );
}
