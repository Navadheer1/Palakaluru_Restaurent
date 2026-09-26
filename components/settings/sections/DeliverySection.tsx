"use client";

import * as React from "react";
import { Truck, MapPin, Navigation, Plus, Trash2, Shield, Users, Clock } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeliveryZoneItem } from "@/types/settings";

export function DeliverySection() {
  const { delivery, pendingChanges, updatePending } = useSettingsStore();

  const currentDelivery = pendingChanges?.delivery || delivery;

  const [activeSubTab, setActiveSubTab] = React.useState<"ops" | "zones" | "riders">("ops");

  const handleDeliveryChange = (field: keyof typeof currentDelivery, val: any) => {
    updatePending("delivery", { [field]: val });
  };

  const handleRiderSettingsChange = (field: string, val: any) => {
    updatePending("delivery", {
      deliveryBoySettings: {
        ...currentDelivery.deliveryBoySettings,
        [field]: val,
      },
    });
  };

  const handleAddZone = () => {
    const newZone: DeliveryZoneItem = {
      id: `dz-${Date.now()}`,
      name: `Zone ${String.fromCharCode(65 + currentDelivery.zones.length)}`,
      minKm: currentDelivery.zones.length > 0 ? currentDelivery.zones[currentDelivery.zones.length - 1].maxKm : 0,
      maxKm: currentDelivery.zones.length > 0 ? currentDelivery.zones[currentDelivery.zones.length - 1].maxKm + 4 : 4,
      deliveryCharge: 60,
      estimatedTimeMins: 45,
    };
    updatePending("delivery", {
      zones: [...currentDelivery.zones, newZone],
    });
  };

  const handleDeleteZone = (id: string) => {
    if (currentDelivery.zones.length <= 1) {
      alert("At least one delivery zone is required.");
      return;
    }
    updatePending("delivery", {
      zones: currentDelivery.zones.filter((z) => z.id !== id),
    });
  };

  const handleUpdateZone = (id: string, field: keyof DeliveryZoneItem, val: any) => {
    const updated = currentDelivery.zones.map((z) =>
      z.id === id ? { ...z, [field]: val } : z
    );
    updatePending("delivery", { zones: updated });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("ops")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "ops"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Delivery Operations</span>
        </button>
        <button
          onClick={() => setActiveSubTab("zones")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "zones"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Distance Zones ({currentDelivery.zones.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("riders")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "riders"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Rider & GPS Tracking Policy</span>
        </button>
      </div>

      {/* 1. OPERATIONS */}
      {activeSubTab === "ops" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Truck className="h-4 w-4 mr-2 text-brand-600" />
              General Home Delivery Parameters
            </h3>
            <p className="text-xs text-slate-500">
              Configure free delivery thresholds, COD eligibility, and maximum service radius.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Base Delivery Fee (₹)
                </label>
                <Input
                  type="number"
                  value={currentDelivery.baseDeliveryFee}
                  onChange={(e) => handleDeliveryChange("baseDeliveryFee", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Free Delivery Cart Threshold (₹)
                </label>
                <Input
                  type="number"
                  value={currentDelivery.freeDeliveryThreshold}
                  onChange={(e) => handleDeliveryChange("freeDeliveryThreshold", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Max Delivery Distance (km)
                </label>
                <Input
                  type="number"
                  value={currentDelivery.maxDeliveryDistanceKm}
                  onChange={(e) => handleDeliveryChange("maxDeliveryDistanceKm", parseFloat(e.target.value) || 10)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentDelivery.codAvailable}
                  onChange={(e) => handleDeliveryChange("codAvailable", e.target.checked)}
                  className="rounded text-brand-600 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Enable Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-slate-500">Allow customers to tender cash to rider at doorstep</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentDelivery.requireLandmark}
                  onChange={(e) => handleDeliveryChange("requireLandmark", e.target.checked)}
                  className="rounded text-brand-600 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Mandatory Address Landmark
                  </span>
                  <span className="text-[11px] text-slate-500">Improves courier dispatch accuracy</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 2. DELIVERY ZONES */}
      {activeSubTab === "zones" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-brand-600" />
                Distance-Based Delivery Pricing Slabs
              </h3>
              <p className="text-xs text-slate-500">
                Automatic fee calculation based on road distance from restaurant branch.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddZone} className="space-x-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Distance Zone</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {currentDelivery.zones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {zone.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id)}
                    className="text-rose-500 hover:text-rose-600 h-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Min Distance (km)
                    </label>
                    <Input
                      type="number"
                      value={zone.minKm}
                      onChange={(e) => handleUpdateZone(zone.id, "minKm", parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Max Distance (km)
                    </label>
                    <Input
                      type="number"
                      value={zone.maxKm}
                      onChange={(e) => handleUpdateZone(zone.id, "maxKm", parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Delivery Fee (₹)
                    </label>
                    <Input
                      type="number"
                      value={zone.deliveryCharge}
                      onChange={(e) => handleUpdateZone(zone.id, "deliveryCharge", parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-mono font-bold text-brand-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Estimated Time (mins)
                    </label>
                    <Input
                      type="number"
                      value={zone.estimatedTimeMins}
                      onChange={(e) => handleUpdateZone(zone.id, "estimatedTimeMins", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RIDERS & GPS TRACKING */}
      {activeSubTab === "riders" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Users className="h-4 w-4 mr-2 text-brand-600" />
            Delivery Boy Safety, COD Limits & Battery Preservation
          </h3>
          <p className="text-xs text-slate-500">
            Rules governing live background location pings and cash collected in transit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Max Concurrent Active Deliveries
              </label>
              <Input
                type="number"
                value={currentDelivery.deliveryBoySettings.maxActiveDeliveries}
                onChange={(e) => handleRiderSettingsChange("maxActiveDeliveries", parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                COD In-Hand Cash Limit (₹)
              </label>
              <Input
                type="number"
                value={currentDelivery.deliveryBoySettings.codHandlingLimit}
                onChange={(e) => handleRiderSettingsChange("codHandlingLimit", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                GPS Ping Interval (Seconds)
              </label>
              <Input
                type="number"
                value={currentDelivery.deliveryBoySettings.locationPingIntervalSecs}
                onChange={(e) => handleRiderSettingsChange("locationPingIntervalSecs", parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                Stop Tracking Immediately Upon Delivery Completion
              </span>
              <span className="text-[11px] text-slate-500">
                Respects rider privacy: GPS streaming halts immediately after customer sign-off.
              </span>
            </div>
            <Badge variant="success" size="sm">
              Enforced Policy
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
