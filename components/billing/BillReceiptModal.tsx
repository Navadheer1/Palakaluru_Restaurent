"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle2, Clock, AlertCircle } from "lucide-react";
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

  const [printerWidth, setPrinterWidth] = React.useState<"80mm" | "58mm">("80mm");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !bill) return null;

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

  const formattedDateTime = bill.date.includes(":")
    ? bill.date
    : `${bill.date}${bill.time ? ` ${bill.time}` : ""}`;

  const isPaid = bill.paymentStatus === "paid";

  // Reusable Thermal Receipt Inner Markup
  const renderReceiptContent = (isThermalPrint: boolean = false) => (
    <div
      className={cn(
        "font-mono text-slate-900 leading-tight select-none",
        isThermalPrint
          ? cn(
              "thermal-receipt-container",
              printerWidth === "58mm" ? "thermal-width-58mm" : "thermal-width-80mm"
            )
          : "w-full max-w-[340px] mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs"
      )}
    >
      {/* 1. Header: Restaurant Name & Contact */}
      <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
          {restaurantName}
        </h2>
        {restaurantAddress && (
          <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
            {restaurantAddress}
          </p>
        )}
        {restaurantPhone && (
          <p className="text-[10px] text-slate-600">
            Ph: {restaurantPhone}
          </p>
        )}
        {restaurantGstin && (
          <p className="text-[9.5px] text-slate-500 font-semibold mt-0.5">
            GSTIN: {restaurantGstin}
          </p>
        )}
      </div>

      {/* 2. Metadata: Bill No, Date, Time, Order Type, Table */}
      <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-0.5 text-[10.5px]">
        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Bill No:</span>
          <span className="font-bold text-slate-900">{bill.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Date/Time:</span>
          <span className="text-slate-800">{formattedDateTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Order Type:</span>
          <span className="font-bold text-slate-900 uppercase">
            {bill.orderType === "dine_in"
              ? "Dine-In"
              : bill.orderType === "takeaway"
              ? "Takeaway"
              : "Delivery"}
          </span>
        </div>
        {bill.orderType === "dine_in" && (
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Table:</span>
            <span className="font-bold text-slate-900">
              {bill.tableNumber || "Dine-In"}
            </span>
          </div>
        )}
        {bill.waiterName && (
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Staff:</span>
            <span className="text-slate-800">{bill.waiterName}</span>
          </div>
        )}
        {bill.customerName && (
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Customer:</span>
            <span className="font-medium text-slate-800">
              {bill.customerName}
              {bill.customerPhone ? ` (${bill.customerPhone})` : ""}
            </span>
          </div>
        )}
      </div>

      {/* 3. Items Table: Item | Qty | Price */}
      <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
        <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-700">
          <span className="col-span-7">ITEM</span>
          <span className="col-span-2 text-center">QTY</span>
          <span className="col-span-3 text-right">PRICE</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 py-1">
          {bill.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 text-[10.5px] py-0.5 text-slate-800">
              <span className="col-span-7 font-semibold break-words pr-1">
                {item.name}
              </span>
              <span className="col-span-2 text-center font-bold">
                {item.quantity}
              </span>
              <span className="col-span-3 text-right font-bold text-slate-900">
                ₹{item.totalPrice || item.unitPrice * item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Subtotal, Discount, Tax, Grand Total */}
      <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-0.5 text-[10.5px]">
        <div className="flex justify-between">
          <span className="text-slate-600">Subtotal:</span>
          <span className="font-semibold text-slate-900">₹{bill.subtotal.toFixed(2)}</span>
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

        <div className="pt-1.5 mt-1 border-t-2 border-dashed border-slate-400 flex justify-between items-baseline font-black">
          <span className="text-xs uppercase">GRAND TOTAL:</span>
          <span className="text-sm">₹{Math.round(bill.grandTotal)}</span>
        </div>
      </div>

      {/* 5. Payment Method & Status */}
      <div className="py-1.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-center text-[10px]">
        <span className="font-bold uppercase tracking-wider">
          Payment Method: {bill.paymentMethod ? bill.paymentMethod.toUpperCase() : "CASH"}
        </span>
        <span className="mx-1">•</span>
        <span className="font-extrabold uppercase text-slate-700">
          {bill.paymentStatus.toUpperCase()}
        </span>
      </div>

      {/* 6. Footer Thank You */}
      <div className="pt-2 text-center text-[9.5px] text-slate-600 space-y-0.5">
        <p className="font-bold text-slate-800">
          Thank you! Please visit again.
        </p>
        <p className="text-slate-400">
          Palakaluru Restaurant Management System
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ON-SCREEN MODAL PREVIEW (Hidden during print via no-print) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in-0 duration-150 no-print">
        <div className="relative w-full max-w-md my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Modal Action Bar */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Bill Preview
              </span>
              <Badge
                variant={isPaid ? "success" : "warning"}
                className="text-[10px] uppercase font-bold"
              >
                {isPaid ? "PAID" : "UNPAID"}
              </Badge>
            </div>

            {/* Width Toggle Selector: 80mm vs 58mm */}
            <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-700/60 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPrinterWidth("80mm")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all cursor-pointer",
                  printerWidth === "80mm"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="80mm Thermal Printer"
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPrinterWidth("58mm")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all cursor-pointer",
                  printerWidth === "58mm"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="58mm Thermal Printer"
              >
                58mm
              </button>
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
                  <span>Print</span>
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

          {/* Scrollable Receipt Body (Preview) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950/40">
            {renderReceiptContent(false)}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
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
                <span>Print Thermal Receipt ({printerWidth})</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED PRINT PORTAL AT BODY LEVEL (Only displayed during window.print()) */}
      {mounted &&
        createPortal(
          <div id="thermal-print-portal" aria-hidden="true">
            {renderReceiptContent(true)}
          </div>,
          document.body
        )}
    </>
  );
}
