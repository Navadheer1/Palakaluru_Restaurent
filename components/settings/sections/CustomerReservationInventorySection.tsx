"use client";

import * as React from "react";
import { UserCheck, CalendarDays, Boxes, Check, AlertCircle } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function CustomerReservationInventorySection() {
  const {
    customerFields,
    reservations,
    inventory,
    pendingChanges,
    updatePending,
  } = useSettingsStore();

  const currentCustomer = pendingChanges?.customerFields || customerFields;
  const currentReservations = pendingChanges?.reservations || reservations;
  const currentInventory = pendingChanges?.inventory || inventory;

  const [activeSubTab, setActiveSubTab] = React.useState<"customer" | "reservations" | "inventory">("customer");

  const handleCustomerToggle = (field: keyof typeof currentCustomer) => {
    updatePending("customerFields", { [field]: !currentCustomer[field] });
  };

  const handleReservationChange = (field: keyof typeof currentReservations, val: any) => {
    updatePending("reservations", { [field]: val });
  };

  const handleInventoryChange = (field: keyof typeof currentInventory, val: any) => {
    updatePending("inventory", { [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("customer")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "customer"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Customer Information Rules</span>
        </button>
        <button
          onClick={() => setActiveSubTab("reservations")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "reservations"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Table Reservations</span>
        </button>
        <button
          onClick={() => setActiveSubTab("inventory")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "inventory"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Kitchen Raw Inventory Controls</span>
        </button>
      </div>

      {/* 1. CUSTOMER INFORMATION */}
      {activeSubTab === "customer" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-brand-600" />
            Mandatory Customer Fields at Checkout
          </h3>
          <p className="text-xs text-slate-500">
            Define which contact details cashiers must capture before billing can be finalized.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentCustomer.requireName}
                onChange={() => handleCustomerToggle("requireName")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Customer Full Name
                </span>
                <span className="text-[11px] text-slate-500">Required on billing modal</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentCustomer.requirePhone}
                onChange={() => handleCustomerToggle("requirePhone")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  10-Digit Mobile Phone
                </span>
                <span className="text-[11px] text-slate-500">Essential for WhatsApp invoice & loyalty points</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentCustomer.requireEmail}
                onChange={() => handleCustomerToggle("requireEmail")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Email Address
                </span>
                <span className="text-[11px] text-slate-500">Optional for regular walk-in diners</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentCustomer.requireAddressForDelivery}
                onChange={() => handleCustomerToggle("requireAddressForDelivery")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Mandatory Street Address for Delivery
                </span>
                <span className="text-[11px] text-slate-500">Prevents booking deliveries without destination</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 2. TABLE RESERVATIONS */}
      {activeSubTab === "reservations" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-brand-600" />
                Table Reservation Booking Policy
              </h3>
              <p className="text-xs text-slate-500">
                Manage advance table booking windows, slot durations, and party sizes.
              </p>
            </div>
            <Badge variant={currentReservations.enabled ? "success" : "neutral"} size="sm">
              {currentReservations.enabled ? "Reservations Open" : "Walk-in Only"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dining Slot Duration (Mins)
              </label>
              <Input
                type="number"
                value={currentReservations.slotDurationMins}
                onChange={(e) => handleReservationChange("slotDurationMins", parseInt(e.target.value) || 60)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Advance Booking Horizon (Days)
              </label>
              <Input
                type="number"
                value={currentReservations.advanceBookingDays}
                onChange={(e) => handleReservationChange("advanceBookingDays", parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Maximum Party Size (Pax)
              </label>
              <Input
                type="number"
                value={currentReservations.maxPartySize}
                onChange={(e) => handleReservationChange("maxPartySize", parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY */}
      {activeSubTab === "inventory" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Boxes className="h-4 w-4 mr-2 text-brand-600" />
            Kitchen Raw Stock & Recipe Deduction Policies
          </h3>
          <p className="text-xs text-slate-500">
            Rules governing automatic raw ingredient deduction upon KOT punch and low-stock alerts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Default Low-Stock Alert Threshold (Units)
              </label>
              <Input
                type="number"
                value={currentInventory.defaultLowStockThreshold}
                onChange={(e) => handleInventoryChange("defaultLowStockThreshold", parseInt(e.target.value) || 5)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Food Wastage Recording Permission
              </label>
              <select
                value={currentInventory.wastagePermissions}
                onChange={(e) => handleInventoryChange("wastagePermissions", e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
              >
                <option value="admin_only">Admin Only</option>
                <option value="manager_and_above">Manager & Admin</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
