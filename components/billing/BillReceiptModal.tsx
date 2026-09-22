"use client";

import * as React from "react";
import { X, Printer, CheckCircle2, Clock, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { PaymentStatus } from "@/lib/constants";

export interface BillItemData {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BillData {
  billNumber: string;
  kotNumber: string | string[];
  orderNumber?: string;
  date: string;
  time?: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string | null;
  waiterName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  items: BillItemData[];
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  deliveryFee?: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  notes?: string | null;
}

interface BillReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillData | null;
  allowPrintOverride?: boolean;
  showPrintButton?: boolean;
}

export function BillReceiptModal({
  isOpen,
  onClose,
  bill,
  allowPrintOverride,
  showPrintButton,
}: BillReceiptModalProps) {
  const { restaurant } = useAuthProfile();
  const { activeRole } = useRolePermissions();

  if (!isOpen || !bill) return null;

  // Print button is ONLY available when explicitly enabled (in POS Billing section)
  // and user is Admin/Cashier. KOT tab is strictly View Bill only.
  const isAdminOrCashier = activeRole === "admin" || activeRole === "manager" || activeRole === "cashier";
  const canPrint = showPrintButton !== undefined
    ? (showPrintButton && isAdminOrCashier)
    : (allowPrintOverride !== undefined ? (allowPrintOverride && isAdminOrCashier) : false);

  const handlePrint = () => {
    window.print();
  };

  const restaurantName = restaurant?.name || "Palakaluru Restaurant";
  const restaurantAddress = restaurant?.address || "Main Road, Palakaluru, Guntur, AP - 522005";
  const restaurantPhone = restaurant?.phone || "+91 98480 12345";
  const restaurantGstin = restaurant?.gstin || "37AAAAA0000A1Z5";

  const kotLabel = Array.isArray(bill.kotNumber)
    ? bill.kotNumber.join(", ")
    : bill.kotNumber || "N/A";

  const formattedDateTime = bill.date.includes(":")
    ? bill.date
    : `${bill.date}${bill.time ? ` ${bill.time}` : ""}`;

  const isPaid = bill.paymentStatus === "paid";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in-0 duration-150">
      <div className="relative w-full max-w-md my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Modal Action Bar (Hidden during browser print) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 no-print">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Tax Invoice & Bill Preview
            </span>
            <Badge
              variant={isPaid ? "success" : "warning"}
              className="text-[10px] uppercase font-bold"
            >
              {isPaid ? "PAID" : "UNPAID"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {canPrint && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm space-x-1.5 px-3 py-1.5"
                title="Print Thermal Receipt"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>🖨 Print Bill</span>
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-slate-950/40">
          {/* THE PRINTABLE BILL CONTAINER: Identified by #printable-bill for Print CSS */}
          <div
            id="printable-bill"
            className="w-full max-w-[340px] mx-auto bg-white text-slate-900 font-mono text-[12px] leading-tight p-5 rounded-xl border border-slate-200 shadow-sm print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none"
          >
            {/* Restaurant Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                {restaurantName}
              </h2>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                {restaurantAddress}
              </p>
              <p className="text-[11px] text-slate-600">
                Phone: {restaurantPhone}
              </p>
              {restaurantGstin && (
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  GSTIN: {restaurantGstin}
                </p>
              )}
            </div>

            {/* Bill Meta Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Bill No:</span>
                <span className="font-bold text-slate-900">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">KOT No:</span>
                <span className="font-bold text-slate-900">{kotLabel}</span>
              </div>
              {bill.orderNumber && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Order Ref:</span>
                  <span className="font-medium text-slate-800">{bill.orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Date & Time:</span>
                <span className="text-slate-800">{formattedDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Type / Table:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {bill.orderType === "dine_in"
                    ? `Table ${bill.tableNumber || "Dine-In"}`
                    : bill.orderType === "takeaway"
                    ? "Takeaway Counter"
                    : "Home Delivery"}
                </span>
              </div>
              {bill.waiterName && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Staff / Waiter:</span>
                  <span className="font-bold text-slate-900">{bill.waiterName}</span>
                </div>
              )}
              {bill.customerName && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">
                    {bill.customerName}
                    {bill.customerPhone ? ` (${bill.customerPhone})` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 font-bold text-[11px] pb-1 border-b border-slate-200 text-slate-700">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-2 text-right">PRICE</span>
                <span className="col-span-2 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-slate-100 py-1 space-y-1">
                {bill.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 text-[11px] pt-1 text-slate-800"
                  >
                    <span className="col-span-6 font-semibold break-words pr-1">
                      {item.name}
                    </span>
                    <span className="col-span-2 text-center font-bold">
                      {item.quantity}
                    </span>
                    <span className="col-span-2 text-right text-slate-600">
                      ₹{item.unitPrice}
                    </span>
                    <span className="col-span-2 text-right font-bold text-slate-900">
                      ₹{item.totalPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal, Tax, Discounts, Grand Total */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-bold text-slate-900">₹{bill.subtotal.toFixed(2)}</span>
              </div>

              {bill.discountAmount !== undefined && bill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{bill.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>GST / Tax (5%):</span>
                <span>₹{bill.taxAmount.toFixed(2)}</span>
              </div>

              {bill.deliveryFee !== undefined && bill.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee:</span>
                  <span>₹{bill.deliveryFee.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-dashed border-slate-400 flex justify-between items-baseline">
                <span className="text-sm font-black tracking-tight text-slate-900">
                  GRAND TOTAL:
                </span>
                <span className="text-base font-black text-slate-900">
                  ₹{Math.round(bill.grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Status & Footer */}
            <div className="pt-3 text-center space-y-1.5 text-[11px]">
              <div className="inline-block px-2.5 py-0.5 rounded font-black uppercase text-[10px] tracking-wide border border-slate-300">
                Payment Status: {bill.paymentStatus.toUpperCase()}
                {bill.paymentMethod ? ` (${bill.paymentMethod.toUpperCase()})` : ""}
              </div>

              <p className="text-[11px] font-bold text-slate-800 pt-1">
                Thank you for visiting! Please visit again.
              </p>
              <p className="text-[9px] text-slate-500">
                Printed via CulinaCloud RMS
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions (Screen only) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            Close
          </Button>

          {canPrint && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white shadow-sm space-x-1.5 px-4"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>🖨 Print Bill</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
