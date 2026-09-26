"use client";

import * as React from "react";
import { FileText, Percent, Hash, DollarSign, Plus, Trash2, HelpCircle, Check, AlertCircle } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TaxSlab } from "@/types/settings";

export function BusinessLegalSection() {
  const { taxes, billing, reportsCurrency, pendingChanges, updatePending } = useSettingsStore();

  const currentTaxes = pendingChanges?.taxes || taxes;
  const currentBilling = pendingChanges?.billing || billing;
  const currentReports = pendingChanges?.reportsCurrency || reportsCurrency;

  const [activeSubTab, setActiveSubTab] = React.useState<"tax" | "invoice" | "currency">("tax");

  // Tax handlers
  const handleTaxToggle = () => {
    updatePending("taxes", { taxesEnabled: !currentTaxes.taxesEnabled });
  };

  const handlePricingTypeChange = (type: "tax_inclusive" | "tax_exclusive") => {
    updatePending("taxes", { pricingType: type });
  };

  const handleUpdateTaxRate = (rate: number) => {
    updatePending("taxes", { defaultTaxRate: rate });
  };

  const handleAddTaxSlab = () => {
    const newSlab: TaxSlab = {
      id: `tax-${Date.now()}`,
      name: "Custom Goods Surcharge",
      rate: 18.0,
      cgst: 9.0,
      sgst: 9.0,
      igst: 0,
      isDefault: false,
      isActive: true,
    };
    updatePending("taxes", {
      taxSlabs: [...currentTaxes.taxSlabs, newSlab],
    });
  };

  const handleDeleteTaxSlab = (id: string) => {
    if (currentTaxes.taxSlabs.length <= 1) {
      alert("At least one tax slab must be configured.");
      return;
    }
    updatePending("taxes", {
      taxSlabs: currentTaxes.taxSlabs.filter((s) => s.id !== id),
    });
  };

  const handleToggleSlabDefault = (id: string) => {
    const updated = currentTaxes.taxSlabs.map((s) => ({
      ...s,
      isDefault: s.id === id,
    }));
    const target = updated.find((s) => s.id === id);
    updatePending("taxes", {
      taxSlabs: updated,
      defaultTaxRate: target ? target.rate : currentTaxes.defaultTaxRate,
    });
  };

  // Billing handlers
  const handleBillingChange = (field: keyof typeof currentBilling, val: any) => {
    updatePending("billing", { [field]: val });
  };

  // Currency handlers
  const handleReportsChange = (field: keyof typeof currentReports, val: any) => {
    updatePending("reportsCurrency", { [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("tax")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "tax"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>GST & Tax Configuration</span>
        </button>
        <button
          onClick={() => setActiveSubTab("invoice")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "invoice"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Hash className="h-4 w-4" />
          <span>Invoice & Billing Charges</span>
        </button>
        <button
          onClick={() => setActiveSubTab("currency")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "currency"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Currency & Date/Time</span>
        </button>
      </div>

      {/* 1. TAX CONFIGURATION */}
      {activeSubTab === "tax" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Percent className="h-4 w-4 mr-2 text-brand-600" />
                  Goods & Services Tax (GST) Slabs
                </h3>
                <p className="text-xs text-slate-500">
                  Tax rates are dynamically calculated on POS, kitchen bills, and sales reports.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {currentTaxes.taxesEnabled ? "Tax Collection Enabled" : "Tax Disabled"}
                </span>
                <button
                  type="button"
                  onClick={handleTaxToggle}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    currentTaxes.taxesEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                      currentTaxes.taxesEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Pricing Model (Inclusive vs Exclusive) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                Pricing Calculation Model
                <span className="ml-1 text-slate-400" title="Inclusive means menu price contains tax. Exclusive adds tax on top.">
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handlePricingTypeChange("tax_exclusive")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    currentTaxes.pricingType === "tax_exclusive"
                      ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Tax Exclusive (Add on top)
                    </span>
                    {currentTaxes.pricingType === "tax_exclusive" && <Check className="h-4 w-4 text-brand-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bill adds GST ({currentTaxes.defaultTaxRate}%) on subtotal. Standard for dine-in & restaurants.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePricingTypeChange("tax_inclusive")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    currentTaxes.pricingType === "tax_inclusive"
                      ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Tax Inclusive (All-inclusive)
                    </span>
                    {currentTaxes.pricingType === "tax_inclusive" && <Check className="h-4 w-4 text-brand-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Displayed menu prices already include GST. Reverse tax calculation on invoices.
                  </p>
                </button>
              </div>
            </div>

            {/* Configured Tax Slabs Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Configured GST Tax Slabs
                </span>
                <Button variant="outline" size="sm" onClick={handleAddTaxSlab} className="space-x-1 text-xs">
                  <Plus className="h-3 w-3" />
                  <span>Add Tax Slab</span>
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Slab Name</th>
                      <th className="p-3">Total Rate (%)</th>
                      <th className="p-3">CGST</th>
                      <th className="p-3">SGST</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentTaxes.taxSlabs.map((slab) => (
                      <tr key={slab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                          {slab.name}
                          {slab.isDefault && (
                            <Badge variant="brand" size="sm" className="ml-2 text-[10px]">
                              Default POS Rate
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {slab.rate}%
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {slab.cgst}%
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {slab.sgst}%
                        </td>
                        <td className="p-3">
                          <Badge variant={slab.isActive ? "success" : "neutral"} size="sm">
                            {slab.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {!slab.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleSlabDefault(slab.id)}
                              className="text-[11px]"
                            >
                              Make Default
                            </Button>
                          )}
                          {!slab.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTaxSlab(slab.id)}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVOICE & BILLING CHARGES */}
      {activeSubTab === "invoice" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Hash className="h-4 w-4 mr-2 text-brand-600" />
              Invoice Sequential Numbering & Prefix
            </h3>
            <p className="text-xs text-slate-500">
              Unique financial sequential counter for customer bills. Never allows duplicate invoice numbers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Invoice Prefix
                </label>
                <Input
                  value={currentBilling.invoicePrefix}
                  onChange={(e) => handleBillingChange("invoicePrefix", e.target.value)}
                  placeholder="e.g. INV-"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Next Invoice Number (Counter)
                </label>
                <Input
                  type="number"
                  value={currentBilling.nextInvoiceNumber}
                  onChange={(e) => handleBillingChange("nextInvoiceNumber", parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cashier Round-Off Rule
                </label>
                <select
                  value={currentBilling.roundingRule}
                  onChange={(e) => handleBillingChange("roundingRule", e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="nearest_1">Round to Nearest ₹1 (Standard)</option>
                  <option value="nearest_5">Round to Nearest ₹5</option>
                  <option value="round_up">Always Round Up to Next ₹1</option>
                  <option value="none">No Rounding (Exact Paise)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Operational Surcharges */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-brand-600" />
              Configurable Service & Operational Charges
            </h3>
            <p className="text-xs text-slate-500">
              Automated service charges, parcel packaging, and delivery surcharge parameters.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Service Charge (%)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={currentBilling.serviceChargeRate}
                  onChange={(e) => handleBillingChange("serviceChargeRate", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Takeaway Parcel Charge (₹)
                </label>
                <Input
                  type="number"
                  value={currentBilling.packagingChargeTakeaway}
                  onChange={(e) => handleBillingChange("packagingChargeTakeaway", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Base Delivery Fee (₹)
                </label>
                <Input
                  type="number"
                  value={currentBilling.deliveryChargeBase}
                  onChange={(e) => handleBillingChange("deliveryChargeBase", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Convenience / Platform Fee (₹)
                </label>
                <Input
                  type="number"
                  value={currentBilling.convenienceFee}
                  onChange={(e) => handleBillingChange("convenienceFee", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CURRENCY & DATE/TIME */}
      {activeSubTab === "currency" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-brand-600" />
            Currency, Timezone & Regional Localization
          </h3>
          <p className="text-xs text-slate-500">
            System timestamps and amounts conform strictly to the configured timezone and currency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Currency Code
              </label>
              <Input
                value={currentReports.currency}
                onChange={(e) => handleReportsChange("currency", e.target.value)}
                placeholder="INR"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Currency Symbol
              </label>
              <Input
                value={currentReports.currencySymbol}
                onChange={(e) => handleReportsChange("currencySymbol", e.target.value)}
                placeholder="₹"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Operating Timezone
              </label>
              <select
                value={currentReports.timezone}
                onChange={(e) => handleReportsChange("timezone", e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                <option value="UTC">UTC (Universal Time)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
