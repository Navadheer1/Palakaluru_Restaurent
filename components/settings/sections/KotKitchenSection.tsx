"use client";

import * as React from "react";
import { Flame, Bell, Volume2, Printer, Plus, Trash2, Check, HelpCircle } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function KotKitchenSection() {
  const { kotKitchen, pendingChanges, updatePending } = useSettingsStore();

  const currentKot = pendingChanges?.kotKitchen || kotKitchen;

  const [activeSubTab, setActiveSubTab] = React.useState<"kot_rules" | "stations" | "alerts">("kot_rules");

  const handleKotChange = (field: keyof typeof currentKot, val: any) => {
    updatePending("kotKitchen", { [field]: val });
  };

  const handleAddStation = () => {
    const newStation = {
      id: `ks-${Date.now()}`,
      name: "New Prep Station",
      description: "Appetizers & Fast Bites",
      assignedPrinterId: "prn-2",
    };
    updatePending("kotKitchen", {
      kitchenStations: [...currentKot.kitchenStations, newStation],
    });
  };

  const handleDeleteStation = (id: string) => {
    if (currentKot.kitchenStations.length <= 1) {
      alert("At least one kitchen station is required.");
      return;
    }
    updatePending("kotKitchen", {
      kitchenStations: currentKot.kitchenStations.filter((s) => s.id !== id),
    });
  };

  const handleUpdateStation = (id: string, field: string, val: string) => {
    const updated = currentKot.kitchenStations.map((s) =>
      s.id === id ? { ...s, [field]: val } : s
    );
    updatePending("kotKitchen", { kitchenStations: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("kot_rules")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "kot_rules"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>KOT Lifecycle & Numbering</span>
        </button>
        <button
          onClick={() => setActiveSubTab("stations")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "stations"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>Kitchen Prep Stations ({currentKot.kitchenStations.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("alerts")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "alerts"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Volume2 className="h-4 w-4" />
          <span>Audio Alerts & Chimes</span>
        </button>
      </div>

      {/* 1. KOT RULES & NUMBERING */}
      {activeSubTab === "kot_rules" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Flame className="h-4 w-4 mr-2 text-brand-600" />
              Kitchen Order Ticket (KOT) Sequence & Dispatch Rules
            </h3>
            <p className="text-xs text-slate-500">
              Control sequential ticket generation, automatic sending, and reprint authorizations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  KOT Numbering Prefix
                </label>
                <Input
                  value={currentKot.kotNumberingPrefix}
                  onChange={(e) => handleKotChange("kotNumberingPrefix", e.target.value)}
                  placeholder="KOT-"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Next KOT Sequence Counter
                </label>
                <Input
                  type="number"
                  value={currentKot.nextKotNumber}
                  onChange={(e) => handleKotChange("nextKotNumber", parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  KOT Send Behavior
                </label>
                <select
                  value={currentKot.sendBehavior}
                  onChange={(e) => handleKotChange("sendBehavior", e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                >
                  <option value="manual">Manual (Waiter reviews before sending to kitchen)</option>
                  <option value="automatic">Automatic (Immediate send upon item addition)</option>
                </select>
              </div>
            </div>

            {/* Workflow Guarantees */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Takeaway & Delivery: Pre-Payment Required Before KOT
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Strict restaurant policy: Parcel orders cannot enter the kitchen queue until paid in full.
                  </span>
                </div>
                <Badge variant="success" size="sm">
                  Active Rule
                </Badge>
              </div>

              <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentKot.allowKotCancellationWithoutApproval}
                  onChange={(e) => handleKotChange("allowKotCancellationWithoutApproval", e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Allow Waiters to Void/Cancel Sent KOT Without Manager PIN
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Unchecked = Waiter must request Manager approval to cancel an already-printed kitchen ticket.
                  </span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentKot.allowKotEditingAfterPrint}
                  onChange={(e) => handleKotChange("allowKotEditingAfterPrint", e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Allow Editing Items on Existing KOT (Sends Supplementary Ticket)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Generates a supplementary addition slip to avoid food duplication.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 2. KITCHEN PREP STATIONS */}
      {activeSubTab === "stations" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Printer className="h-4 w-4 mr-2 text-brand-600" />
                Kitchen Stations & Work Centers
              </h3>
              <p className="text-xs text-slate-500">
                Segment food preparation by kitchen section (Biryani, Tandoor, Starters, Bar & Desserts).
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddStation} className="space-x-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Station</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {currentKot.kitchenStations.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {st.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStation(st.id)}
                    className="text-rose-500 hover:text-rose-600 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Station Name
                    </label>
                    <Input
                      value={st.name}
                      onChange={(e) => handleUpdateStation(st.id, "name", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Dish Types / Description
                    </label>
                    <Input
                      value={st.description}
                      onChange={(e) => handleUpdateStation(st.id, "description", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUDIO ALERTS */}
      {activeSubTab === "alerts" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Volume2 className="h-4 w-4 mr-2 text-brand-600" />
            Kitchen Display Screen Audio Alerts
          </h3>
          <p className="text-xs text-slate-500">
            Play high-pitched audio chimes on chef display tablets whenever a new ticket arrives.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  New Order Audio Chime
                </span>
                <span className="text-[11px] text-slate-500">
                  Rings kitchen tablet speakers immediately upon order dispatch.
                </span>
              </div>
              <input
                type="checkbox"
                checked={currentKot.soundAlertsEnabled}
                onChange={(e) => handleKotChange("soundAlertsEnabled", e.target.checked)}
                className="rounded text-brand-600 h-5 w-5"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Audio Volume: {currentKot.soundAlertVolume}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={currentKot.soundAlertVolume}
                onChange={(e) => handleKotChange("soundAlertVolume", parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
