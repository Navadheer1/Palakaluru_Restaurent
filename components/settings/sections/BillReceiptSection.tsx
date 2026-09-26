"use client";

import * as React from "react";
import { Receipt, Eye, Sliders, Check, Smartphone } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export function BillReceiptSection() {
  const { billReceipt, profile, taxes, pendingChanges, updatePending } = useSettingsStore();

  const currentReceipt = pendingChanges?.billReceipt || billReceipt;
  const currentProfile = pendingChanges?.profile || profile;
  const currentTaxes = pendingChanges?.taxes || taxes;

  const handleReceiptChange = (field: keyof typeof currentReceipt, val: any) => {
    updatePending("billReceipt", { [field]: val });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Receipt className="h-4 w-4 mr-2 text-brand-600" />
              Thermal Bill Receipt Customization
            </h3>
            <p className="text-xs text-slate-500">
              Customize headers, legal tax identifiers, and thank-you footers printed on customer receipts.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Header Custom Banner Text
                </label>
                <Input
                  value={currentReceipt.headerCustomText}
                  onChange={(e) => handleReceiptChange("headerCustomText", e.target.value)}
                  placeholder="PALAKALURU RESTAURANT"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Receipt Roll Width
                  </label>
                  <select
                    value={currentReceipt.paperWidth}
                    onChange={(e) => handleReceiptChange("paperWidth", e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                  >
                    <option value="80mm">80mm (Standard POS Thermal)</option>
                    <option value="58mm">58mm (Compact Mobile Roll)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Thermal Font Density
                  </label>
                  <select
                    value={currentReceipt.fontSize}
                    onChange={(e) => handleReceiptChange("fontSize", e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                  >
                    <option value="compact">Compact / Tight</option>
                    <option value="normal">Standard POS</option>
                    <option value="large">High-Legibility / Bold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Thank You / Farewell Message
                </label>
                <Input
                  value={currentReceipt.thankYouMessage}
                  onChange={(e) => handleReceiptChange("thankYouMessage", e.target.value)}
                  placeholder="Please visit again! Have a flavorful day."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Receipt Footer / Feedback Notice
                </label>
                <Input
                  value={currentReceipt.footerMessage}
                  onChange={(e) => handleReceiptChange("footerMessage", e.target.value)}
                  placeholder="For catering enquiries call +91..."
                />
              </div>

              {/* Elements Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentReceipt.showGstin}
                    onChange={(e) => handleReceiptChange("showGstin", e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Print GSTIN on Bill</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentReceipt.showFssai}
                    onChange={(e) => handleReceiptChange("showFssai", e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Print FSSAI License Number</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentReceipt.showTaxBreakup}
                    onChange={(e) => handleReceiptChange("showTaxBreakup", e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Print CGST & SGST Split</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentReceipt.showQrCodeForFeedbackOrPayment}
                    onChange={(e) => handleReceiptChange("showQrCodeForFeedbackOrPayment", e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Print Digital Menu / Feedback QR</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview: Live Thermal Receipt Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Eye className="h-4 w-4 mr-1.5 text-brand-600" />
              Live Thermal Paper Preview ({currentReceipt.paperWidth})
            </span>
            <Badge variant="brand" size="sm">
              Live Mockup
            </Badge>
          </div>

          <div
            className={`mx-auto bg-amber-50/70 dark:bg-amber-100 text-slate-900 shadow-xl rounded-sm p-5 font-mono text-[11px] leading-tight border border-amber-200/80 transition-all ${
              currentReceipt.paperWidth === "80mm" ? "max-w-[340px]" : "max-w-[270px]"
            }`}
          >
            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
              <h4 className="font-extrabold text-sm tracking-wide">
                {currentReceipt.headerCustomText || currentProfile.name}
              </h4>
              <p className="text-[10px] text-slate-600">{currentProfile.address}</p>
              <p className="text-[10px] text-slate-600">{currentProfile.city}, {currentProfile.state}</p>
              <p className="text-[10px] font-bold">Ph: {currentProfile.phone}</p>
              {currentReceipt.showGstin && (
                <p className="text-[10px] text-slate-700">GSTIN: {currentProfile.gstin}</p>
              )}
              {currentReceipt.showFssai && (
                <p className="text-[10px] text-slate-700">FSSAI: {currentProfile.fssaiNumber}</p>
              )}
            </div>

            {/* Bill Meta */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Bill No: INV-10425</span>
                <span>Table: T-1 (Dine-In)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date: 25-Sep-2026</span>
                <span>Time: 08:42 PM</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cashier: V. Lakshmi</span>
                <span>Pax: 4</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[10px] mb-1">
                <span className="w-1/2">ITEM</span>
                <span className="w-12 text-center">QTY</span>
                <span className="w-14 text-right">AMT (₹)</span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="w-1/2 truncate font-semibold">Spl Chicken Biryani</span>
                  <span className="w-12 text-center font-bold">2</span>
                  <span className="w-14 text-right">640.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="w-1/2 truncate font-semibold">Paneer Butter Masala</span>
                  <span className="w-12 text-center font-bold">1</span>
                  <span className="w-14 text-right">240.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="w-1/2 truncate font-semibold">Butter Naan</span>
                  <span className="w-12 text-center font-bold">4</span>
                  <span className="w-14 text-right">120.00</span>
                </div>
              </div>
            </div>

            {/* Calculation Totals */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Item Subtotal:</span>
                <span>₹1,000.00</span>
              </div>
              {currentReceipt.showTaxBreakup && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (2.5%):</span>
                    <span>₹25.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (2.5%):</span>
                    <span>₹25.00</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-slate-400">
                <span>GRAND TOTAL:</span>
                <span>₹1,050.00</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Settlement: UPI / PhonePe</span>
                <span>PAID</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-3 space-y-1 text-[10px]">
              <p className="font-bold">{currentReceipt.thankYouMessage}</p>
              <p className="text-[9px] text-slate-600">{currentReceipt.footerMessage}</p>
              {currentReceipt.showQrCodeForFeedbackOrPayment && (
                <div className="pt-2 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white border border-slate-400 flex items-center justify-center p-1">
                    <span className="text-[8px] font-bold text-center">QR CODE PREVIEW</span>
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1">Scan for Digital Bill / Review</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
