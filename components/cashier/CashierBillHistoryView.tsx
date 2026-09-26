"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Receipt, 
  Search, 
  Printer, 
  AlertTriangle, 
  X, 
  Check, 
  Clock, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Eye, 
  Sparkles,
  RefreshCw,
  User,
  Phone
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { formatCurrency } from "@/lib/utils";
import { BillReceiptModal, BillData } from "@/components/billing/BillReceiptModal";

interface BillHistoryItem {
  id: string;
  bill_number: string;
  order_id: string;
  order_number: string;
  created_at: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  final_total: number;
  payment_status: string;
  reprint_count: number;
  order_type: "dine_in" | "takeaway" | "delivery";
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method: string;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

export function CashierBillHistoryView() {
  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const cashierName = profile?.full_name || profile?.name || "Cashier";

  const [bills, setBills] = useState<BillHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<BillHistoryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("Wrong payment entered");
  const [voidNotes, setVoidNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Reprint modal state
  const [reprintData, setReprintData] = useState<BillData | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);

  // Fetch bills from Supabase
  const fetchBills = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bills")
      .select(`
        id,
        bill_number,
        order_id,
        subtotal,
        tax_amount,
        discount_amount,
        final_total,
        payment_status,
        reprint_count,
        created_at,
        orders:order_id (
          id,
          order_number,
          order_type,
          customer:customer_id (name, phone),
          tables:table_id (table_number),
          order_items (
            quantity,
            unit_price,
            total_price,
            menu_items:menu_item_id (name)
          ),
          payments (
            payment_method
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("Error fetching bills:", error);
      return;
    }

    if (data) {
      const mapped: BillHistoryItem[] = data.map((b: any) => {
        const order = b.orders;
        const customer = order?.customer;
        const table = order?.tables;
        const payment = order?.payments?.[0];

        const items = (order?.order_items || []).map((oi: any) => ({
          name: oi.menu_items?.name || "Dish Item",
          quantity: oi.quantity || 1,
          unitPrice: oi.unit_price || 0,
          totalPrice: oi.total_price || 0,
        }));

        return {
          id: b.id,
          bill_number: b.bill_number,
          order_id: b.order_id,
          order_number: order?.order_number || `ORD-${b.bill_number.replace(/\D/g, "").slice(-4)}`,
          created_at: b.created_at,
          subtotal: b.subtotal,
          tax_amount: b.tax_amount,
          discount_amount: b.discount_amount || 0,
          final_total: b.final_total,
          payment_status: b.payment_status,
          reprint_count: b.reprint_count || 0,
          order_type: order?.order_type || "takeaway",
          table_number: table?.table_number,
          customer_name: customer?.name,
          customer_phone: customer?.phone,
          payment_method: payment?.payment_method || "cash",
          items,
        };
      });

      setBills(mapped);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Filter bills
  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter(
      (b) =>
        b.bill_number.toLowerCase().includes(q) ||
        b.order_number.toLowerCase().includes(q) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.customer_phone && b.customer_phone.includes(q)) ||
        (b.table_number && b.table_number.toLowerCase().includes(q))
    );
  }, [bills, searchQuery]);

  // Handle Reprint
  const handleReprint = async (bill: BillHistoryItem) => {
    const supabase = createClient();
    // Increment reprint count
    await supabase
      .from("bills")
      .update({
        reprint_count: (bill.reprint_count || 0) + 1,
        last_reprinted_at: new Date().toISOString(),
      })
      .eq("id", bill.id);

    const billData: BillData = {
      billNumber: `${bill.bill_number} (REPRINT #${(bill.reprint_count || 0) + 1})`,
      kotNumber: [],
      orderNumber: bill.order_number,
      date: new Date(bill.created_at).toLocaleDateString("en-IN"),
      time: new Date(bill.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      orderType: bill.order_type,
      tableNumber: bill.table_number,
      waiterName: cashierName,
      customerName: bill.customer_name,
      customerPhone: bill.customer_phone,
      items: bill.items,
      subtotal: bill.subtotal,
      taxAmount: bill.tax_amount,
      discountAmount: bill.discount_amount,
      grandTotal: bill.final_total,
      paymentStatus: "paid",
      paymentMethod: bill.payment_method as any,
    };

    setReprintData(billData);
    setIsReprintModalOpen(true);
    setNotice(`Prepared reprint for ${bill.bill_number}`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Submit Void Request
  const handleSubmitVoidRequest = async () => {
    if (!selectedBill) return;
    const supabase = createClient();

    const { error } = await supabase.from("bill_void_requests").insert({
      restaurant_id: restaurantId,
      bill_id: selectedBill.id,
      bill_number: selectedBill.bill_number,
      order_number: selectedBill.order_number,
      amount: selectedBill.final_total,
      requested_by: profile?.id,
      requested_by_name: cashierName,
      reason: `${voidReason}: ${voidNotes}`.trim(),
      status: "pending",
    });

    if (!error) {
      setNotice(`Void request submitted for ${selectedBill.bill_number}. Awaiting manager review.`);
      setIsVoidModalOpen(false);
      setIsDetailModalOpen(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bill History & Lookup
            </h1>
            <p className="text-xs text-slate-500">
              Search past bills, reprint receipts, and submit correction requests
            </p>
          </div>
        </div>

        <button
          onClick={fetchBills}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{notice}</span>
        </div>
      )}

      {/* Fast Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Bill #, Customer Phone, Name, Order #, or Table..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xs"
        />
      </div>

      {/* Bills Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredBills.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No transactions found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBills.map((b) => (
              <div
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      #{b.bill_number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {b.order_type}
                    </span>
                    {b.table_number && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {b.table_number}
                      </span>
                    )}
                    {b.reprint_count > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-semibold">
                        Reprinted ×{b.reprint_count}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>{new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>•</span>
                    <span>{b.customer_name ? `${b.customer_name} (${b.customer_phone || ""})` : "Walk-in Customer"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(b.final_total)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {b.payment_method}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBill(b);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleReprint(b)}
                      className="py-1.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-500/20 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reprint</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {isDetailModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bill #{selectedBill.bill_number}
                </h3>
                <span className="text-xs text-slate-500">Order #{selectedBill.order_number}</span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {selectedBill.items.map((it, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span>
                    {it.name} <span className="text-slate-400">× {it.quantity}</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(it.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total summary */}
            <div className="space-y-1 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              {selectedBill.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedBill.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(selectedBill.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1">
                <span>Total Paid</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(selectedBill.final_total)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-3">
              <button
                onClick={() => handleReprint(selectedBill)}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint Receipt</span>
              </button>

              <button
                onClick={() => setIsVoidModalOpen(true)}
                className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/30 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Request Void</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Request Reason Modal */}
      {isVoidModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Request Bill Void</span>
            </h3>
            <p className="text-xs text-slate-500">
              Submit audit request for Bill #{selectedBill.bill_number} ({formatCurrency(selectedBill.final_total)}).
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Reason</label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
              >
                <option value="Customer cancellation">Customer cancellation</option>
                <option value="Wrong payment entered">Wrong payment entered</option>
                <option value="Dish unavailable">Dish unavailable</option>
                <option value="Duplicate punch">Duplicate punch</option>
                <option value="Billing correction">Billing correction</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Notes / Details</label>
              <textarea
                value={voidNotes}
                onChange={(e) => setVoidNotes(e.target.value)}
                placeholder="Explain why this void is required..."
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsVoidModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitVoidRequest}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Submit Void Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal for Printing */}
      <BillReceiptModal
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
        bill={reprintData}
      />
    </div>
  );
}
