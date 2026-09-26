"use client";

import * as React from "react";
import { Store, Clock, Building2, Plus, Trash2, MapPin, Phone, Mail, Globe, Shield, Check } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { BranchConfigItem } from "@/types/settings";

export function RestaurantProfileSection() {
  const { profile, businessHours, branches, pendingChanges, updatePending } = useSettingsStore();

  const currentProfile = pendingChanges?.profile || profile;
  const currentHours = pendingChanges?.businessHours || businessHours;
  const currentBranches = pendingChanges?.branches || branches;

  const [activeSubTab, setActiveSubTab] = React.useState<"profile" | "hours" | "branches">("profile");
  const [branchModalOpen, setBranchModalOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<BranchConfigItem | null>(null);

  // Profile field handlers
  const handleProfileChange = (key: keyof typeof currentProfile, val: string) => {
    updatePending("profile", { [key]: val });
  };

  // Business hours handlers
  const handleDayToggle = (day: keyof typeof currentHours.weeklyHours) => {
    const existing = currentHours.weeklyHours[day];
    updatePending("businessHours", {
      weeklyHours: {
        ...currentHours.weeklyHours,
        [day]: { ...existing, isOpen: !existing.isOpen },
      },
    });
  };

  const handleDayTimeChange = (
    day: keyof typeof currentHours.weeklyHours,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    const existing = currentHours.weeklyHours[day];
    updatePending("businessHours", {
      weeklyHours: {
        ...currentHours.weeklyHours,
        [day]: { ...existing, [field]: value },
      },
    });
  };

  const handleSplitShiftToggle = (day: keyof typeof currentHours.weeklyHours) => {
    const existing = currentHours.weeklyHours[day];
    updatePending("businessHours", {
      weeklyHours: {
        ...currentHours.weeklyHours,
        [day]: {
          ...existing,
          hasSplitShift: !existing.hasSplitShift,
          lunchShift: existing.lunchShift || { start: "11:00", end: "15:30" },
          dinnerShift: existing.dinnerShift || { start: "18:00", end: "23:00" },
        },
      },
    });
  };

  // Branch handlers
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    let updated: BranchConfigItem[];
    if (currentBranches.some((b) => b.id === editingBranch.id)) {
      updated = currentBranches.map((b) => (b.id === editingBranch.id ? editingBranch : b));
    } else {
      updated = [...currentBranches, editingBranch];
    }
    updatePending("branches", updated);
    setBranchModalOpen(false);
    setEditingBranch(null);
  };

  const handleDeleteBranch = (id: string) => {
    if (currentBranches.length <= 1) {
      alert("At least one primary branch is required.");
      return;
    }
    const updated = currentBranches.filter((b) => b.id !== id);
    updatePending("branches", updated);
  };

  const daysList: (keyof typeof currentHours.weeklyHours)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("profile")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "profile"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Restaurant Identity</span>
        </button>
        <button
          onClick={() => setActiveSubTab("hours")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "hours"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Operating Hours & Shifts</span>
        </button>
        <button
          onClick={() => setActiveSubTab("branches")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "branches"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Branches ({currentBranches.length})</span>
        </button>
      </div>

      {/* 1. RESTAURANT IDENTITY */}
      {activeSubTab === "profile" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Store className="h-4 w-4 mr-2 text-brand-600" />
              General Restaurant Information
            </h3>
            <p className="text-xs text-slate-500">
              Primary brand identity used across bills, digital menus, kitchen slips, and delivery tracking.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Restaurant Brand Name *
                </label>
                <Input
                  value={currentProfile.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  placeholder="e.g. Palakaluru Restaurant"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Legal / Registered Business Entity Name
                </label>
                <Input
                  value={currentProfile.legalName}
                  onChange={(e) => handleProfileChange("legalName", e.target.value)}
                  placeholder="e.g. Palakaluru Foods & Hospitality Pvt. Ltd."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Restaurant Description (Digital Menu & Bills)
              </label>
              <textarea
                value={currentProfile.description}
                onChange={(e) => handleProfileChange("description", e.target.value)}
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                placeholder="Brief description of cuisines and culinary legacy..."
              />
            </div>

            {/* Address & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Street Address
                </label>
                <Input
                  value={currentProfile.address}
                  onChange={(e) => handleProfileChange("address", e.target.value)}
                  placeholder="Street / Highway Landmark"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  City
                </label>
                <Input
                  value={currentProfile.city}
                  onChange={(e) => handleProfileChange("city", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  State
                </label>
                <Input
                  value={currentProfile.state}
                  onChange={(e) => handleProfileChange("state", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Postal Pincode
                </label>
                <Input
                  value={currentProfile.pincode}
                  onChange={(e) => handleProfileChange("pincode", e.target.value)}
                />
              </div>
            </div>

            {/* Contact Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Primary Phone
                </label>
                <Input
                  value={currentProfile.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Official Email
                </label>
                <Input
                  value={currentProfile.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center">
                  <Globe className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Website / Google Maps URL
                </label>
                <Input
                  value={currentProfile.website}
                  onChange={(e) => handleProfileChange("website", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Statutory & Legal Registrations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-brand-600" />
              Statutory & Government Compliance Registrations
            </h3>
            <p className="text-xs text-slate-500">
              Printed on thermal receipts and consumer invoices as mandatory statutory compliance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  GSTIN (Tax Identification)
                </label>
                <Input
                  value={currentProfile.gstin}
                  onChange={(e) => handleProfileChange("gstin", e.target.value)}
                  placeholder="37AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  FSSAI License Number
                </label>
                <Input
                  value={currentProfile.fssaiNumber}
                  onChange={(e) => handleProfileChange("fssaiNumber", e.target.value)}
                  placeholder="14-digit FSSAI"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Trade License / Municipal Reg
                </label>
                <Input
                  value={currentProfile.tradeLicenseNumber}
                  onChange={(e) => handleProfileChange("tradeLicenseNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  PAN Number
                </label>
                <Input
                  value={currentProfile.panNumber}
                  onChange={(e) => handleProfileChange("panNumber", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OPERATING HOURS & SHIFTS */}
      {activeSubTab === "hours" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-brand-600" />
                  Weekly Operating Schedule & Shifts
                </h3>
                <p className="text-xs text-slate-500">
                  Configure daily operating windows, closed days, and split shifts (Lunch & Dinner).
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {daysList.map((day) => {
                const dayConfig = currentHours.weeklyHours[day];
                return (
                  <div
                    key={day}
                    className={`p-3.5 rounded-xl border transition-all ${
                      dayConfig.isOpen
                        ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                        : "border-rose-200/50 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 opacity-75"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 w-36">
                        <button
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`w-4 h-4 rounded-sm flex items-center justify-center border cursor-pointer ${
                            dayConfig.isOpen
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {dayConfig.isOpen && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>
                        <span className="text-xs font-bold capitalize text-slate-900 dark:text-slate-100">
                          {day}
                        </span>
                      </div>

                      {dayConfig.isOpen ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-500 text-[11px]">Overall:</span>
                            <Input
                              type="time"
                              value={dayConfig.openTime}
                              onChange={(e) => handleDayTimeChange(day, "openTime", e.target.value)}
                              className="h-8 w-28 text-xs font-mono"
                            />
                            <span className="text-slate-400">to</span>
                            <Input
                              type="time"
                              value={dayConfig.closeTime}
                              onChange={(e) => handleDayTimeChange(day, "closeTime", e.target.value)}
                              className="h-8 w-28 text-xs font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSplitShiftToggle(day)}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                              dayConfig.hasSplitShift
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                : "border-slate-200 dark:border-slate-700 text-slate-500"
                            }`}
                          >
                            {dayConfig.hasSplitShift ? "Split Shift Active" : "+ Add Split Shift"}
                          </button>
                        </div>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Closed All Day
                        </Badge>
                      )}
                    </div>

                    {dayConfig.isOpen && dayConfig.hasSplitShift && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300 w-16">Lunch:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {dayConfig.lunchShift?.start || "11:00"} – {dayConfig.lunchShift?.end || "15:30"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300 w-16">Dinner:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {dayConfig.dinnerShift?.start || "18:00"} – {dayConfig.dinnerShift?.end || "23:00"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-BRANCH OUTLETS */}
      {activeSubTab === "branches" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-brand-600" />
                  Branch Management & Store Isolation
                </h3>
                <p className="text-xs text-slate-500">
                  Operational records, table inventories, and KOT routing stay strictly isolated per branch.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingBranch({
                    id: `b-${Date.now()}`,
                    name: "",
                    code: `BR-${currentBranches.length + 1}`,
                    address: "",
                    phone: "",
                    isMain: false,
                    isActive: true,
                    taxRate: 5.0,
                    tablesCount: 0,
                    assignedStaffCount: 0,
                  });
                  setBranchModalOpen(true);
                }}
                className="space-x-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Branch</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {currentBranches.map((br) => (
                <div
                  key={br.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {br.name || "Untitled Branch"}
                        </span>
                        {br.isMain && (
                          <Badge variant="brand" size="sm">
                            Main HQ
                          </Badge>
                        )}
                        <Badge variant={br.isActive ? "success" : "neutral"} size="sm">
                          {br.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">Code: {br.code}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBranch(br);
                          setBranchModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      {!br.isMain && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBranch(br.id)}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {br.address || "No address provided"}
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {br.phone || "No phone registered"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Tables: {br.tablesCount}</span>
                    <span>Staff: {br.assignedStaffCount}</span>
                    <span>GST: {br.taxRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Branch Modal */}
      <Dialog open={branchModalOpen} onOpenChange={setBranchModalOpen}>
        {editingBranch && (
          <form onSubmit={handleSaveBranch} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingBranch.name ? "Edit Branch" : "Add New Branch"}</DialogTitle>
              <DialogDescription>
                Configure branch location, contact number, and tax attributes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Branch Name</label>
                <Input
                  required
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  placeholder="e.g. Arundelpet Express"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Branch Code</label>
                  <Input
                    required
                    value={editingBranch.code}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. EXP-02"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Phone</label>
                  <Input
                    value={editingBranch.phone}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="+91..."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Address</label>
                <Input
                  value={editingBranch.address}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  placeholder="Full street address"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setBranchModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Branch
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
}
