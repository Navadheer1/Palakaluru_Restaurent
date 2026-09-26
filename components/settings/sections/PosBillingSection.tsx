"use client";

import * as React from "react";
import { CreditCard, ShoppingBag, Sliders, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

export function PosBillingSection() {
  const { pos, orderTypes, paymentMethods, managerApprovals, pendingChanges, updatePending } = useSettingsStore();

  const currentPos = pendingChanges?.pos || pos;
  const currentOrderTypes = pendingChanges?.orderTypes || orderTypes;
  const currentPaymentMethods = pendingChanges?.paymentMethods || paymentMethods;
  const currentApprovals = pendingChanges?.managerApprovals || managerApprovals;

  const [activeSubTab, setActiveSubTab] = React.useState<"pos_core" | "order_types" | "payments" | "approvals">("pos_core");
  const [warningModalOpen, setWarningModalOpen] = React.useState(false);
  const [pendingDisableType, setPendingDisableType] = React.useState<"dineIn" | "takeaway" | "delivery" | null>(null);

  const handlePosChange = (field: keyof typeof currentPos, val: any) => {
    updatePending("pos", { [field]: val });
  };

  const handleApprovalsChange = (field: keyof typeof currentApprovals, val: any) => {
    updatePending("managerApprovals", { [field]: val });
  };

  const handleToggleOrderType = (type: "dineIn" | "takeaway" | "delivery") => {
    const isCurrentlyEnabled = currentOrderTypes[type].enabled;
    if (isCurrentlyEnabled) {
      // Disabling an order type requires safety confirmation
      setPendingDisableType(type);
      setWarningModalOpen(true);
    } else {
      updatePending("orderTypes", {
        [type]: { ...currentOrderTypes[type], enabled: true },
      });
    }
  };

  const confirmDisableOrderType = () => {
    if (!pendingDisableType) return;
    updatePending("orderTypes", {
      [pendingDisableType]: { ...currentOrderTypes[pendingDisableType], enabled: false },
    });
    setWarningModalOpen(false);
    setPendingDisableType(null);
  };

  const handleTogglePaymentMethod = (id: string) => {
    const updated = currentPaymentMethods.map((pm) =>
      pm.id === id ? { ...pm, enabled: !pm.enabled } : pm
    );
    updatePending("paymentMethods", updated);
  };

  const handleUpdatePaymentMethod = (id: string, field: string, val: any) => {
    const updated = currentPaymentMethods.map((pm) =>
      pm.id === id ? { ...pm, [field]: val } : pm
    );
    updatePending("paymentMethods", updated);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("pos_core")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "pos_core"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>POS Terminal Workflow</span>
        </button>
        <button
          onClick={() => setActiveSubTab("order_types")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "order_types"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Order Types Controls</span>
        </button>
        <button
          onClick={() => setActiveSubTab("payments")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "payments"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Payment Methods ({currentPaymentMethods.filter((p) => p.enabled).length} Active)</span>
        </button>
        <button
          onClick={() => setActiveSubTab("approvals")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "approvals"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Manager Approval Thresholds</span>
        </button>
      </div>

      {/* 1. POS TERMINAL WORKFLOW */}
      {activeSubTab === "pos_core" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Sliders className="h-4 w-4 mr-2 text-brand-600" />
              Cashier & POS Screen Operational Controls
            </h3>
            <p className="text-xs text-slate-500">
              Configure search speed, item photography display, draft persistence, and reprint limits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Order Type
                </label>
                <select
                  value={currentPos.defaultOrderType}
                  onChange={(e) => handlePosChange("defaultOrderType", e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                >
                  <option value="dine_in">Dine-In (Table Seating)</option>
                  <option value="takeaway">Takeaway (Counter Parcel)</option>
                  <option value="delivery">Direct Home Delivery</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Payment Mode
                </label>
                <select
                  value={currentPos.defaultPaymentMethod}
                  onChange={(e) => handlePosChange("defaultPaymentMethod", e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                >
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash Tender</option>
                  <option value="card">Card POS Machine</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Max Allowed Bill Reprints
                </label>
                <Input
                  type="number"
                  value={currentPos.reprintLimit}
                  onChange={(e) => handlePosChange("reprintLimit", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Toggle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPos.showItemImages}
                  onChange={(e) => handlePosChange("showItemImages", e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Display Food Images
                  </span>
                  <span className="text-[11px] text-slate-500">Show visual food thumbnails on POS menu cards</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPos.autoSaveDrafts}
                  onChange={(e) => handlePosChange("autoSaveDrafts", e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Auto-Save Active Drafts
                  </span>
                  <span className="text-[11px] text-slate-500">Prevent cart loss on accidental browser refresh</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPos.holdBillEnabled}
                  onChange={(e) => handlePosChange("holdBillEnabled", e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    Enable Bill Park / Hold
                  </span>
                  <span className="text-[11px] text-slate-500">Allows cashier to hold a cart and serve next customer</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDER TYPES */}
      {activeSubTab === "order_types" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2 text-brand-600" />
            Restaurant Fulfillment Channels
          </h3>
          <p className="text-xs text-slate-500">
            Control channel availability and mandatory workflow rules per order type.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Dine-In */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentOrderTypes.dineIn.enabled
                ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Dine-In Operations
                </span>
                <Button
                  variant={currentOrderTypes.dineIn.enabled ? "outline" : "primary"}
                  size="sm"
                  onClick={() => handleToggleOrderType("dineIn")}
                  className="text-xs"
                >
                  {currentOrderTypes.dineIn.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Full table management, waiter KOT sending, split billing, and table turnovers.
              </p>
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={currentOrderTypes.dineIn.requireTableAssignment}
                  onChange={(e) =>
                    updatePending("orderTypes", {
                      dineIn: { ...currentOrderTypes.dineIn, requireTableAssignment: e.target.checked },
                    })
                  }
                  className="rounded text-brand-600"
                />
                <span>Require Table Assignment</span>
              </label>
            </div>

            {/* Takeaway */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentOrderTypes.takeaway.enabled
                ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Takeaway / Parcel
                </span>
                <Button
                  variant={currentOrderTypes.takeaway.enabled ? "outline" : "primary"}
                  size="sm"
                  onClick={() => handleToggleOrderType("takeaway")}
                  className="text-xs"
                >
                  {currentOrderTypes.takeaway.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Quick parcel service at cashier desk with automated takeaway packaging charges.
              </p>
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={currentOrderTypes.takeaway.requirePaymentBeforeKot}
                  onChange={(e) =>
                    updatePending("orderTypes", {
                      takeaway: { ...currentOrderTypes.takeaway, requirePaymentBeforeKot: e.target.checked },
                    })
                  }
                  className="rounded text-brand-600"
                />
                <span>Require Payment Before Kitchen KOT</span>
              </label>
            </div>

            {/* Delivery */}
            <div className={`p-4 rounded-xl border transition-all ${
              currentOrderTypes.delivery.enabled
                ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Direct Home Delivery
                </span>
                <Button
                  variant={currentOrderTypes.delivery.enabled ? "outline" : "primary"}
                  size="sm"
                  onClick={() => handleToggleOrderType("delivery")}
                  className="text-xs"
                >
                  {currentOrderTypes.delivery.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Rider dispatch, distance-based zones, and real-time live GPS location tracking.
              </p>
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={currentOrderTypes.delivery.requireAddress}
                  onChange={(e) =>
                    updatePending("orderTypes", {
                      delivery: { ...currentOrderTypes.delivery, requireAddress: e.target.checked },
                    })
                  }
                  className="rounded text-brand-600"
                />
                <span>Mandatory Customer Street Address</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAYMENT METHODS */}
      {activeSubTab === "payments" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-brand-600" />
            Configured Settlement & Payment Methods
          </h3>
          <p className="text-xs text-slate-500">
            Define allowed cashier payment modes, transaction reference rules, and thermal receipt labels.
          </p>

          <div className="space-y-3 pt-2">
            {currentPaymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod(pm.id)}
                      className={`w-4 h-4 rounded-sm flex items-center justify-center border cursor-pointer ${
                        pm.enabled
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {pm.enabled && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {pm.displayName}
                    </span>
                    <Badge variant={pm.enabled ? "success" : "neutral"} size="sm">
                      {pm.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={pm.requireReferenceNumber}
                      onChange={(e) => handleUpdatePaymentMethod(pm.id, "requireReferenceNumber", e.target.checked)}
                      className="rounded text-brand-600"
                    />
                    <span>Require Transaction Reference / UTR</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Receipt Print Display Name
                    </label>
                    <Input
                      value={pm.receiptDisplayName}
                      onChange={(e) => handleUpdatePaymentMethod(pm.id, "receiptDisplayName", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Cashier Guidance Instructions
                    </label>
                    <Input
                      value={pm.instructions}
                      onChange={(e) => handleUpdatePaymentMethod(pm.id, "instructions", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MANAGER APPROVAL THRESHOLDS */}
      {activeSubTab === "approvals" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2 text-brand-600" />
            Manager Authorization Security Thresholds
          </h3>
          <p className="text-xs text-slate-500">
            Enforce managerial PIN authorization for high-risk financial overrides to prevent internal leakages.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Max Cashier Discount Without Approval (%)
              </label>
              <Input
                type="number"
                value={currentApprovals.discountThresholdPercent}
                onChange={(e) => handleApprovalsChange("discountThresholdPercent", parseInt(e.target.value) || 0)}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Discounts exceeding this percent will prompt for Manager PIN authorization.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Cash Discrepancy Escalation Limit (₹)
              </label>
              <Input
                type="number"
                value={currentApprovals.requireApprovalForCashDiscrepancy}
                onChange={(e) => handleApprovalsChange("requireApprovalForCashDiscrepancy", parseInt(e.target.value) || 0)}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Shift cash shortages greater than this require Manager sign-off upon register closure.
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentApprovals.requireApprovalForBillVoid}
                onChange={(e) => handleApprovalsChange("requireApprovalForBillVoid", e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Bill Voiding & Settlement Cancellation
                </span>
                <span className="text-[11px] text-slate-500">
                  Cashiers cannot void printed bills without Manager approval.
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentApprovals.requireApprovalForRefund}
                onChange={(e) => handleApprovalsChange("requireApprovalForRefund", e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Customer Refunds & Post-Payment Adjustments
                </span>
                <span className="text-[11px] text-slate-500">
                  Requires explicit manager sign-off before cashier can dispense refunded cash.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Safety Confirmation Dialog for Disabling Order Type */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Confirm Order Type Deactivation</DialogTitle>
            </div>
            <DialogDescription>
              Disabling {pendingDisableType?.toUpperCase()} will prevent cashiers, waitstaff, and online customers from placing orders of this type. Existing orders currently in progress will complete normally.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDisableOrderType}>
              Confirm Deactivation
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
