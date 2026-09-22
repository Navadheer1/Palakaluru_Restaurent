"use client";

import * as React from "react";
import { CheckCircle2, CreditCard, Banknote, QrCode, ShieldCheck, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { PaymentMethod } from "@/lib/constants";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  orderNumber: string;
  billNumber?: string;
  tableNumber?: string | null;
  orderType: "dine_in" | "takeaway" | "delivery";
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  payableAmount: number;
  mode?: "initial" | "additional_charge" | "refund_adjustment";
  originalTotal?: number;
  newTotal?: number;
  confirmLabel?: string;
  onConfirmPayment: (method: PaymentMethod, reference?: string) => Promise<void> | void;
  isProcessing?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  title,
  orderNumber,
  billNumber,
  tableNumber,
  orderType,
  subtotal,
  taxAmount,
  discountAmount = 0,
  payableAmount,
  mode = "initial",
  originalTotal,
  newTotal,
  confirmLabel,
  onConfirmPayment,
  isProcessing = false,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>("cash");
  const [cashTendered, setCashTendered] = React.useState<number>(payableAmount);
  const [reference, setReference] = React.useState<string>("");
  const [localSubmitting, setLocalSubmitting] = React.useState(false);

  React.useEffect(() => {
    setCashTendered(payableAmount);
    setReference("");
  }, [payableAmount, isOpen]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - payableAmount);

  const handleConfirm = async () => {
    if (localSubmitting || isProcessing) return;
    setLocalSubmitting(true);
    try {
      await onConfirmPayment(selectedMethod, reference);
      onClose();
    } finally {
      setLocalSubmitting(false);
    }
  };

  const cashSuggestions = [
    payableAmount,
    Math.ceil(payableAmount / 100) * 100,
    500,
    1000,
    2000,
  ].filter((amt, idx, arr) => amt >= payableAmount && arr.indexOf(amt) === idx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
              {tableNumber && (
                <Badge variant="primary" className="font-bold">
                  {tableNumber}
                </Badge>
              )}
              <Badge variant="secondary" className="uppercase text-[10px]">
                {orderType.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order: {orderNumber} {billNumber ? `• Bill: ${billNumber}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={localSubmitting || isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Bill Summary breakdown */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/60 dark:bg-slate-950/40 space-y-1.5 text-xs">
            {mode === "additional_charge" && originalTotal !== undefined && newTotal !== undefined ? (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>Original Total Paid</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(originalTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Updated Order Total</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(newTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Additional Amount Due</span>
                  <span className="text-lg">
                    {formatCurrency(payableAmount)}
                  </span>
                </div>
              </>
            ) : mode === "refund_adjustment" && originalTotal !== undefined && newTotal !== undefined ? (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>Original Total Paid</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(originalTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Updated Order Total</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(newTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-rose-600 dark:text-rose-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Refund / Adjustment Due</span>
                  <span className="text-lg">
                    {formatCurrency(payableAmount)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount Applied</span>
                    <span className="font-semibold">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-50 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Payable</span>
                  <span className="text-brand-600 dark:text-brand-400 text-lg">
                    {formatCurrency(payableAmount)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "cash" as PaymentMethod, label: "Cash", icon: Banknote },
                { id: "upi" as PaymentMethod, label: "UPI / QR", icon: QrCode },
                { id: "card" as PaymentMethod, label: "Card", icon: CreditCard },
                { id: "other" as PaymentMethod, label: "Other", icon: ShieldCheck },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/70 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tender & Change calculation */}
          {selectedMethod === "cash" && (
            <div className="space-y-3 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Cash Received (₹)
                </span>
                <input
                  type="number"
                  min={payableAmount}
                  value={cashTendered || ""}
                  onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                  className="w-28 text-right font-bold text-sm px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              {/* Quick suggestions */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] text-slate-400 mr-1">Quick:</span>
                {cashSuggestions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt)}
                    className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
                      cashTendered === amt
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Change to Return
                </span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* UPI Reference */}
          {selectedMethod === "upi" && (
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Dynamic UPI QR / Reference
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Instant Verify</span>
              </div>
              <input
                type="text"
                placeholder="UPI UTR / Reference ID (Optional)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Customer can scan the restaurant UPI QR code or enter transaction ID.
              </p>
            </div>
          )}

          {/* Card Reference */}
          {selectedMethod === "card" && (
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Card Transaction / Approval Code
              </span>
              <input
                type="text"
                placeholder="Approval Code (e.g. TXN-84920)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={localSubmitting || isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={localSubmitting || isProcessing}
            className="space-x-1.5 px-4 font-bold"
          >
            {localSubmitting || isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {confirmLabel
                    ? confirmLabel
                    : mode === "additional_charge"
                    ? "Collect Difference & Settle"
                    : mode === "refund_adjustment"
                    ? "Record Refund / Adjustment"
                    : "Confirm Payment"}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
