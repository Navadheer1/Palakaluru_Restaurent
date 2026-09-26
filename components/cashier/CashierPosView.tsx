"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  Send, 
  CreditCard, 
  Banknote, 
  QrCode, 
  User, 
  Phone, 
  MapPin, 
  PauseCircle, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  Percent, 
  AlertCircle,
  Clock,
  Layers,
  Check
} from "lucide-react";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog";
import { useTables } from "@/lib/hooks/useTables";
import { useDineInStore } from "@/stores/useDineInStore";
import { usePosStore } from "@/stores/usePosStore";
import { useCashierShiftStore, HeldBill } from "@/stores/useCashierShiftStore";
import { BillReceiptModal, BillData } from "@/components/billing/BillReceiptModal";
import { formatCurrency, cn } from "@/lib/utils";
import { MenuItem, MenuVariant } from "@/types/database";

export function CashierPosView() {
  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const cashierName = profile?.full_name || profile?.name || "Cashier";

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Stores
  const { data: catalog } = useMenuCatalog(restaurantId);
  const categories = catalog?.categories || [];
  const menuItems = catalog?.items || [];

  const {
    data: dbTables,
  } = useTables(restaurantId);

  const {
    sessions,
    processPayment: processDineInPayment,
  } = useDineInStore();

  const {
    orderType,
    setOrderType,
    items: takeawayItems,
    addItem: addTakeawayItem,
    updateQuantity: updateTakeawayQuantity,
    removeItem: removeTakeawayItem,
    clearCart: clearTakeawayCart,
    customerName,
    customerPhone,
    deliveryAddress,
    customerLandmark,
    setCustomerDetails,
    setDiscount: setStoreDiscount,
    discountPercent,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getFinalTotal,
    processInitialPayment,
    manuallySendKot,
    startNewOrder,
  } = usePosStore();

  const {
    activeShift,
    heldBills,
    holdBill,
    resumeBill,
    discardHeldBill,
    recordPaymentToShift,
  } = useCashierShiftStore();

  // Local state
  const [billingMode, setBillingMode] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const [paymentRefNumber, setPaymentRefNumber] = useState("");
  const [discountInput, setDiscountInput] = useState("0");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Completion & Receipt
  const [completedBill, setCompletedBill] = useState<BillData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Active Dine-in tables ready for payment
  const activeDineInTables = useMemo(() => {
    return (dbTables || [])
      .filter((t) => t.is_active !== false)
      .map((t) => {
        const sess = sessions[t.id];
        const isOccupied =
          sess?.status === "bill_requested" ||
          t.status === "occupied" ||
          t.status === "billing";
        const isBilling =
          sess?.status === "bill_requested" ||
          t.status === "billing" ||
          sess?.billRequested;

        return {
          ...t,
          session: sess,
          isOccupied,
          isBilling,
        };
      })
      .filter((t) => t.isOccupied);
  }, [dbTables, sessions]);

  // Selected table session
  const selectedTableSession = useMemo(() => {
    if (!selectedTableId) return null;
    return sessions[selectedTableId] || null;
  }, [selectedTableId, sessions]);

  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    return (dbTables || []).find((t) => t.id === selectedTableId) || null;
  }, [selectedTableId, dbTables]);

  // Dine-in order totals
  const dineInItems = useMemo(() => {
    if (!selectedTableSession) return [];
    return [
      ...(selectedTableSession.sentItems || []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
      })),
      ...(selectedTableSession.unsentItems || []).map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
    ];
  }, [selectedTableSession]);

  const dineInSubtotal = useMemo(() => {
    return dineInItems.reduce((acc, it) => acc + it.totalPrice, 0);
  }, [dineInItems]);

  const dineInTax = useMemo(() => {
    return Math.round(dineInSubtotal * 0.05 * 100) / 100;
  }, [dineInSubtotal]);

  const dineInTotal = useMemo(() => {
    return dineInSubtotal + dineInTax;
  }, [dineInSubtotal, dineInTax]);

  // Active bill totals depending on billingMode
  const currentSubtotal = billingMode === "dine_in" ? dineInSubtotal : getSubtotal();
  const currentTax = billingMode === "dine_in" ? dineInTax : getTaxAmount();
  const currentDiscount = billingMode === "dine_in" ? 0 : getDiscountAmount();
  const currentGrandTotal = billingMode === "dine_in" ? dineInTotal : getFinalTotal();

  // Filter food items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.is_active || !item.is_available) return false;
      if (activeCategory !== "all" && item.category_id !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Keyboard Shortcuts (F2: search, F4: pay, F8: hold, Esc: close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (currentGrandTotal > 0) {
          setCashReceivedInput(currentGrandTotal.toString());
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === "Escape") {
        setIsPaymentModalOpen(false);
        setIsDiscountModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGrandTotal]);

  // Hold current bill
  const handleHoldBill = () => {
    if (billingMode === "dine_in") {
      setNotice("Dine-In tables are already held on their respective tables.");
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    if (takeawayItems.length === 0) return;

    const heldId = holdBill({
      orderType: billingMode,
      customerName,
      customerPhone,
      deliveryAddress,
      items: takeawayItems,
      subtotal: currentSubtotal,
      tax: currentTax,
      discount: currentDiscount,
      total: currentGrandTotal,
    });

    clearTakeawayCart();
    setCustomerDetails({ name: "", phone: "", address: "" });
    setNotice(`Bill held as #${heldId.slice(-4)}. Switch anytime from top held bills bar.`);
    setTimeout(() => setNotice(null), 3500);
  };

  // Resume held bill
  const handleResumeBill = (held: HeldBill) => {
    const resumed = resumeBill(held.id);
    if (!resumed) return;

    setBillingMode(resumed.orderType);
    if (resumed.orderType === "takeaway" || resumed.orderType === "delivery") {
      setOrderType(resumed.orderType);
    }
    setCustomerDetails({
      name: resumed.customerName || "",
      phone: resumed.customerPhone || "",
      address: resumed.deliveryAddress || "",
    });

    // Populate items
    clearTakeawayCart();
    resumed.items.forEach((it: any) => {
      addTakeawayItem(it.menuItem, it.variant, it.addons, it.instructions);
    });
    setNotice(`Resumed bill ${resumed.label}`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Cash change calculation
  const cashReceived = parseFloat(cashReceivedInput) || 0;
  const cashChange = cashReceived - currentGrandTotal;
  const isCashInsufficient = paymentMethod === "cash" && cashReceived < currentGrandTotal;

  // Process Payment Execution
  const handleCompletePayment = async () => {
    if (isCashInsufficient) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("en-IN");

    if (billingMode === "dine_in") {
      if (!selectedTableId || !selectedTable) return;
      await processDineInPayment(restaurantId, paymentMethod, paymentRefNumber || undefined);

      const billData: BillData = {
        billNumber: `BILL-${selectedTable.table_number}-${Date.now().toString().slice(-4)}`,
        kotNumber: [],
        orderNumber: `ORD-TBL-${selectedTable.table_number}`,
        date: dateStr,
        time: timeStr,
        orderType: "dine_in",
        tableNumber: selectedTable.table_number,
        waiterName: cashierName,
        items: dineInItems,
        subtotal: currentSubtotal,
        taxAmount: currentTax,
        discountAmount: 0,
        grandTotal: currentGrandTotal,
        paymentStatus: "paid",
        paymentMethod,
      };

      setCompletedBill(billData);
      recordPaymentToShift(paymentMethod, currentGrandTotal);
      setSelectedTableId(null);
      setIsPaymentModalOpen(false);
    } else {
      // Takeaway or Delivery
      const res = await processInitialPayment(
        restaurantId,
        paymentMethod,
        paymentRefNumber || undefined
      );

      if (res) {
        // Send KOT if takeaway/delivery
        await manuallySendKot(restaurantId, profile?.id);

        const billData: BillData = {
          billNumber: res.billNumber || `BILL-${res.orderNumber.replace("ORD-", "")}`,
          kotNumber: (res.kots || []).map((k) => k.kot_number),
          orderNumber: res.orderNumber,
          date: dateStr,
          time: timeStr,
          orderType: billingMode,
          tableNumber: billingMode === "takeaway" ? "Takeaway" : "Delivery",
          waiterName: cashierName,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          deliveryAddress: deliveryAddress || undefined,
          items: takeawayItems.map((i) => ({
            name: i.menuItem.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
          subtotal: currentSubtotal,
          taxAmount: currentTax,
          discountAmount: currentDiscount,
          grandTotal: currentGrandTotal,
          paymentStatus: "paid",
          paymentMethod,
        };

        setCompletedBill(billData);
        recordPaymentToShift(paymentMethod, currentGrandTotal);
        setIsPaymentModalOpen(false);
      }
    }
  };

  // Start new customer bill
  const handleStartNextBill = () => {
    setCompletedBill(null);
    if (billingMode === "dine_in") {
      setSelectedTableId(null);
    } else {
      startNewOrder();
      clearTakeawayCart();
      setCustomerDetails({ name: "", phone: "", address: "", landmark: "" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Shift Status + Held Bills Floating Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              activeShift ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            )}
          />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {activeShift ? "Register: OPEN" : "Register: CLOSED"}
          </span>
          {activeShift && (
            <span className="text-slate-500 font-mono">
              Cash Float: {formatCurrency(activeShift.opening_cash)}
            </span>
          )}
        </div>

        {/* Held Bills Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {heldBills.length > 0 && (
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">
              Held Bills:
            </span>
          )}
          {heldBills.map((hb) => (
            <div
              key={hb.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold"
            >
              <button
                onClick={() => handleResumeBill(hb)}
                className="hover:underline flex items-center gap-1"
              >
                <span>{hb.label}</span>
                <span className="font-bold">({formatCurrency(hb.total)})</span>
              </button>
              <button
                onClick={() => discardHeldBill(hb.id)}
                className="text-amber-500 hover:text-rose-500"
                title="Discard"
              >
                ×
              </button>
            </div>
          ))}

          {/* Quick Shortcuts hint */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 font-mono pl-3 border-l border-slate-200 dark:border-slate-800">
            <span>[F2] Search</span>
            <span>[F4] Pay</span>
            <span>[F8] Hold</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Categories & Items OR Tables Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Order Type Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setBillingMode("dine_in")}
              className={cn(
                "flex-1 py-2 rounded-lg transition-all",
                billingMode === "dine_in"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              DINE-IN BILLING
            </button>
            <button
              onClick={() => {
                setBillingMode("takeaway");
                setOrderType("takeaway");
                setSelectedTableId(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-lg transition-all",
                billingMode === "takeaway"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              TAKEAWAY
            </button>
            <button
              onClick={() => {
                setBillingMode("delivery");
                setOrderType("delivery");
                setSelectedTableId(null);
              }}
              className={cn(
                "flex-1 py-2 rounded-lg transition-all",
                billingMode === "delivery"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              DELIVERY
            </button>
          </div>

          {/* DINE-IN MODE: Table Selection Grid */}
          {billingMode === "dine_in" ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Occupied Table to Collect Bill
                </span>
                <span className="text-[11px] text-slate-400">
                  {activeDineInTables.length} tables active
                </span>
              </div>

              {activeDineInTables.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No tables currently ready for billing. Check back when waiters request bills.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeDineInTables.map((t) => {
                    const isSelected = selectedTableId === t.id;
                    const count = (t.session?.sentItems?.length || 0) + (t.session?.unsentItems?.length || 0);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTableId(t.id)}
                        className={cn(
                          "p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[90px]",
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 shadow-sm"
                            : t.isBilling
                            ? "border-rose-400/80 bg-rose-50/50 dark:bg-rose-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-slate-300"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {t.table_number}
                          </span>
                          {t.isBilling && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-rose-500 text-white animate-pulse">
                              Bill Req
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-2">
                          {count} items
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* TAKEAWAY & DELIVERY MODE: Category Pills + Search + Food Item Grid */
            <div className="space-y-3">
              {/* Delivery Customer Details Bar */}
              {billingMode === "delivery" && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Delivery Customer Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerDetails({ name: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Phone (WhatsApp / Call)"
                      value={customerPhone}
                      onChange={(e) => setCustomerDetails({ phone: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Drop Address"
                      value={deliveryAddress}
                      onChange={(e) => setCustomerDetails({ address: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Landmark / House No"
                      value={customerLandmark || ""}
                      onChange={(e) => setCustomerDetails({ landmark: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Search & Categories Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu [F2]..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition",
                      activeCategory === "all"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    )}
                  >
                    All Items
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition",
                        activeCategory === c.id
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addTakeawayItem(item)}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 text-left transition flex flex-col justify-between min-h-[96px] shadow-xs group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.name}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.kitchen_station || "Kitchen"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                        {formatCurrency(item.base_price)}
                      </span>
                      <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CURRENT BILL CART & PAYMENT (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cashier POS Cart
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {billingMode === "dine_in"
                  ? selectedTable
                    ? `Table ${selectedTable.table_number}`
                    : "No Table Selected"
                  : billingMode === "takeaway"
                  ? "Takeaway Order"
                  : "Delivery Order"}
              </h3>
            </div>

            {billingMode !== "dine_in" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleHoldBill}
                  disabled={takeawayItems.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
                  title="Hold Bill [F8]"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Hold</span>
                </button>
                <button
                  onClick={clearTakeawayCart}
                  disabled={takeawayItems.length === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition disabled:opacity-50"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {billingMode === "dine_in" ? (
              dineInItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a table from the left to load its bill items.
                </div>
              ) : (
                dineInItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))
              )
            ) : takeawayItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Cart is empty. Click dishes to add items.
              </div>
            ) : (
              takeawayItems.map((cartItem) => (
                <div
                  key={cartItem.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center text-xs"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {cartItem.menuItem.name}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatCurrency(cartItem.unitPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <button
                        onClick={() => updateTakeawayQuantity(cartItem.id, -1)}
                        className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold text-xs">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateTakeawayQuantity(cartItem.id, 1)}
                        className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 dark:text-white w-14 text-right">
                      {formatCurrency(cartItem.totalPrice)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Discounts Breakdown */}
          <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(currentSubtotal)}</span>
            </div>

            {currentDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatCurrency(currentDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>GST / Taxes (5%)</span>
              <span>{formatCurrency(currentTax)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm font-black text-slate-900 dark:text-white">TOTAL</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(currentGrandTotal)}
              </span>
            </div>
          </div>

          {/* Large Action: PAYMENT */}
          <button
            onClick={() => {
              setCashReceivedInput(currentGrandTotal.toString());
              setIsPaymentModalOpen(true);
            }}
            disabled={currentGrandTotal <= 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>COLLECT PAYMENT [F4]</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* DEDICATED PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Total Payable
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(currentGrandTotal)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "py-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition",
                  paymentMethod === "cash"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <Banknote className="w-5 h-5" />
                <span>CASH</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={cn(
                  "py-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition",
                  paymentMethod === "upi"
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <QrCode className="w-5 h-5" />
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "py-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition",
                  paymentMethod === "card"
                    ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <CreditCard className="w-5 h-5" />
                <span>CARD</span>
              </button>
            </div>

            {/* CASH MODE: Change calculation */}
            {paymentMethod === "cash" && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cash Received from Customer (₹)
                  </label>
                  <input
                    type="number"
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                    className="w-full px-3 py-2 text-xl font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>

                {/* Quick Cash Increment Chips */}
                <div className="flex gap-2">
                  {[currentGrandTotal, currentGrandTotal + 50, currentGrandTotal + 100, 1000, 2000].map((amt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashReceivedInput(amt.toString())}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Change Due:</span>
                  <span
                    className={cn(
                      "text-xl font-black",
                      cashChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    )}
                  >
                    {cashChange >= 0 ? formatCurrency(cashChange) : "Insufficient Cash"}
                  </span>
                </div>
              </div>
            )}

            {/* UPI MODE */}
            {paymentMethod === "upi" && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  UPI Payment Confirmation
                </span>
                <input
                  type="text"
                  placeholder="UPI Reference / UTR Number (Optional)"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}

            {/* CARD MODE */}
            {paymentMethod === "card" && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Card Swipe / POS Slip Reference
                </span>
                <input
                  type="text"
                  placeholder="Card Transaction Reference / Approval Code"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={isCashInsufficient}
                className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCashInsufficient ? "Insufficient Cash" : "COMPLETE PAYMENT ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUCCESSFUL MODAL */}
      {completedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
              <Check className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Payment Successful
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Bill #{completedBill.billNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Amount Paid: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(completedBill.grandTotal)}</span> • {(completedBill.paymentMethod || "CASH").toUpperCase()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setIsReceiptOpen(true)}
                className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>

              <button
                onClick={handleStartNextBill}
                className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition"
              >
                New Bill &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Thermal Receipt Modal */}
      <BillReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={completedBill}
      />
    </div>
  );
}
