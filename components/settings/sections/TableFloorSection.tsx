"use client";

import * as React from "react";
import { Grid, Layers, Plus, Trash2, Check, RefreshCw } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TablesManagementView } from "@/components/tables/TablesManagementView";
import { TableSectionItem } from "@/types/settings";

export function TableFloorSection() {
  const { tableSections, tables, pendingChanges, updatePending } = useSettingsStore();

  const currentSections = pendingChanges?.tableSections || tableSections;
  const currentTables = pendingChanges?.tables || tables;

  const [activeSubTab, setActiveSubTab] = React.useState<"live_management" | "sections" | "statuses">("live_management");

  const handleAddSection = () => {
    const newSec: TableSectionItem = {
      id: `sec-${Date.now()}`,
      name: "New Floor Section",
      floor: 0,
      area: "Indoor",
      isActive: true,
      displayOrder: currentSections.length + 1,
    };
    updatePending("tableSections", [...currentSections, newSec]);
  };

  const handleUpdateSection = (id: string, field: keyof TableSectionItem, val: any) => {
    const updated = currentSections.map((s) => (s.id === id ? { ...s, [field]: val } : s));
    updatePending("tableSections", updated);
  };

  const handleDeleteSection = (id: string) => {
    if (currentSections.length <= 1) {
      alert("At least one section must exist.");
      return;
    }
    updatePending("tableSections", currentSections.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("live_management")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "live_management"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>Interactive Table Management</span>
        </button>
        <button
          onClick={() => setActiveSubTab("sections")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "sections"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Floor Sections & Zones ({currentSections.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("statuses")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "statuses"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Table Status Lifecycle Rules</span>
        </button>
      </div>

      {/* 1. INTERACTIVE LIVE MANAGEMENT */}
      {activeSubTab === "live_management" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/40 text-xs text-brand-900 dark:text-brand-300 flex items-center justify-between">
            <div>
              <span className="font-bold">Direct Supabase Table Manager</span>
              <p className="text-[11px] text-brand-700 dark:text-brand-400 mt-0.5">
                Real-time addition, editing, capacity assignment, and live waiter order tracking.
              </p>
            </div>
            <Badge variant="brand" size="sm">
              Live Grid Active
            </Badge>
          </div>
          <TablesManagementView role="admin" />
        </div>
      )}

      {/* 2. SECTIONS & ZONES */}
      {activeSubTab === "sections" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Layers className="h-4 w-4 mr-2 text-brand-600" />
                Floor Sections & Dining Zones
              </h3>
              <p className="text-xs text-slate-500">
                Organize tables by geographical restaurant section (Main Hall, AC, Outdoor Garden, First Floor, VIP).
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddSection} className="space-x-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Floor Section</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {currentSections.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {sec.name}
                    </span>
                    <Badge variant={sec.isActive ? "success" : "neutral"} size="sm">
                      {sec.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSection(sec.id)}
                    className="text-rose-500 hover:text-rose-600 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Section Name
                    </label>
                    <Input
                      value={sec.name}
                      onChange={(e) => handleUpdateSection(sec.id, "name", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Floor Number (0=Ground)
                    </label>
                    <Input
                      type="number"
                      value={sec.floor}
                      onChange={(e) => handleUpdateSection(sec.id, "floor", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Atmosphere / Area Label
                  </label>
                  <Input
                    value={sec.area}
                    onChange={(e) => handleUpdateSection(sec.id, "area", e.target.value)}
                    className="h-8 text-xs"
                    placeholder="e.g. AC Family Cabin, Open Garden"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TABLE STATUS LIFECYCLE */}
      {activeSubTab === "statuses" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 text-brand-600" />
            Table State Workflow Integrity Rules
          </h3>
          <p className="text-xs text-slate-500">
            Guards to prevent accidental status conflicts while active dining orders or KOTs are underway.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Auto-Free Table After Bill Settlement
                </span>
                <span className="text-[11px] text-slate-500">
                  When cashier settles final payment, table automatically resets to 'Available' for next guest.
                </span>
              </div>
              <Badge variant="success" size="sm">
                Enforced
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Block Deactivation of Occupied Tables
                </span>
                <span className="text-[11px] text-slate-500">
                  Admin/waiter cannot deactivate or delete a table while an active order or KOT is unbilled.
                </span>
              </div>
              <Badge variant="brand" size="sm">
                Safety Guard Active
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
