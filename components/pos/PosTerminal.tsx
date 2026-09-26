"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  Eye,
  ArrowLeft,
  Send,
  CreditCard,
  User,
  Phone,
  MapPin,
  UtensilsCrossed,
  PackageCheck,
  Compass,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog";
import { useTables, RestaurantTableItem } from "@/lib/hooks/useTables";
import { useDineInStore, ActiveTableSession } from "@/stores/useDineInStore";
import { usePosStore } from "@/stores/usePosStore";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { BillReceiptModal, BillData } from "@/components/billing/BillReceiptModal";
import { MenuItem } from "@/types/database";
import { PaymentMethod } from "@/lib/constants";



export function PosTerminal({ role = "cashier" }: { role?: "cashier" | "admin" | "manager" }) {
  // Prevent hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  // Realtime Supabase updates
  useRealtimeSync(restaurantId);

  // 1. TOP ORDER TYPE: ONLY "dine_in" | "takeaway" | "delivery"
  const [orderType, setOrderType] = React.useState<"dine_in" | "takeaway" | "delivery">("dine_in");

  // Menu data
  const { data: menuCatalog } = useMenuCatalog(restaurantId);
  const activeItems: MenuItem[] = menuCatalog?.items || [];
  const activeCategories =
    menuCatalog?.categories && menuCatalog.categories.length > 0
      ? [{ id: "all", name: "All" }, ...menuCatalog.categories]
      : [{ id: "all", name: "All" }];

  const [activeCategory, setActiveCategory] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Tables & Dine-In State
  const { tables: dbTables } = useTables(restaurantId);
  const {
    sessions = {},
    setActiveTable,
    initSession,
    addDraftItem,
    updateDraftQuantity,
    sendKot,
    generateBill,
    processPayment: processDineInPayment,
    isSubmittingKot,
  } = useDineInStore();

  const [selectedTableId, setSelectedTableId] = React.useState<string | null>(null);
  const [isAddingDineInItems, setIsAddingDineInItems] = React.useState(false);

  // Takeaway & Delivery State from usePosStore
  const {
    items: takeawayItems = [],
    addItem: addTakeawayItem,
    updateQuantity: updateTakeawayQuantity,
    clearCart: clearTakeawayCart,
    customerName = "",
    customerPhone = "",
    deliveryAddress = "",
    setCustomerDetails,
    processInitialPayment: processTakeawayPayment,
    manuallySendKot,
    startNewOrder,
  } = usePosStore();

  // Payment & Bill preview modals
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [completedBill, setCompletedBill] = React.useState<BillData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);

  // Delivery geocoding & landmark state
  const [customerLandmark, setCustomerLandmark] = React.useState("");
  const [geocodedCoords, setGeocodedCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  const handleGeocodeAddress = async () => {
    if (!deliveryAddress.trim()) return;
    setIsGeocoding(true);
    try {
      const fullAddress = `${deliveryAddress} ${customerLandmark}`.trim();
      const res = await fetch("/api/maps/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: fullAddress }),
      });
      const data = await res.json();
      if (data.success && data.data?.coordinates) {
        setGeocodedCoords(data.data.coordinates);
        setCustomerDetails({
          address: deliveryAddress,
          landmark: customerLandmark,
          latitude: data.data.coordinates.lat,
          longitude: data.data.coordinates.lng,
        });
        setStatusNotice(`Address geocoded (${data.data.coordinates.lat.toFixed(4)}, ${data.data.coordinates.lng.toFixed(4)})`);
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch {
      // Fallback
    } finally {
      setIsGeocoding(false);
    }
  };

  // Combine tables with live sessions safely
  const tables = React.useMemo(() => {
    const baseTables = (dbTables || []).filter((t) => t.is_active !== false);
    return baseTables.map((t) => {
      const sess = sessions ? sessions[t.id] : undefined;
      let simpleStatus: "available" | "occupied" | "billing" = "available";

      if (
        sess?.bill ||
        sess?.billRequested ||
        sess?.status === "bill_requested" ||
        sess?.status === "bill_generated" ||
        t.status === "billing" ||
        t.status === "bill_requested" ||
        t.status === "bill_ready"
      ) {
        simpleStatus = "billing";
      } else if (
        (sess && ((sess.sentItems && sess.sentItems.length > 0) || (sess.kots && sess.kots.length > 0) || (sess.unsentItems && sess.unsentItems.length > 0))) ||
        t.status === "occupied" ||
        t.status === "waiting_for_food" ||
        t.status === "food_ready"
      ) {
        simpleStatus = "occupied";
      }

      const rawTableNum = t.table_number ? String(t.table_number) : "T01";
      const cleanTableNum = rawTableNum.startsWith("T") ? rawTableNum : `T${rawTableNum.padStart(2, "0")}`;

      return {
        id: t.id,
        table_number: cleanTableNum,
        capacity: t.capacity || 4,
        simpleStatus,
        session: sess,
      };
    });
  }, [dbTables, sessions]);

  // Selected table helper
  const selectedTable = React.useMemo(() => {
    if (!selectedTableId) return tables[0] || null;
    return tables.find((t) => t.id === selectedTableId) || tables[0] || null;
  }, [tables, selectedTableId]);

  // Active Dine-in session for selected table
  const currentTableSession: ActiveTableSession | null = selectedTable
    ? (sessions && sessions[selectedTable.id]) || null
    : null;

  // Filtered menu dishes
  const filteredItems = React.useMemo(() => {
    return activeItems.filter((item) => {
      const matchesCat = activeCategory === "all" || item.category_id === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [activeItems, activeCategory, searchQuery]);

  // Handle table click: Load existing KOT/order created by waiter, DO NOT create a new order
  const handleSelectTable = (table: (typeof tables)[0]) => {
    setSelectedTableId(table.id);
    setActiveTable(table.id);
    setCompletedBill(null);
    setIsAddingDineInItems(false);

    // If session doesn't exist yet, initialize it cleanly without duplicating orders
    if (sessions && !sessions[table.id]) {
      initSession(table.id, table.table_number, null, table.capacity, profile?.full_name || "Staff");
    }
  };

  // Add dish to order based on mode
  const handleAddItemToOrder = (item: MenuItem) => {
    if (orderType === "dine_in") {
      if (!selectedTable) return;
      if (!currentTableSession) {
        initSession(selectedTable.id, selectedTable.table_number, null, selectedTable.capacity, profile?.full_name || "Staff");
      }
      addDraftItem(item);
    } else {
      addTakeawayItem(item);
    }
  };

  // Send KOT for Dine-In added items
  const handleSendDineInKot = async () => {
    if (!selectedTable || !currentTableSession) return;
    const res = await sendKot(restaurantId, profile?.id, profile?.full_name || "Staff");
    if (res) {
      setIsAddingDineInItems(false);
      setStatusNotice(`${res.kot.kot_number} dispatched to Kitchen for ${selectedTable.table_number}!`);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Dine-In safe calculations
  const dineInSentItems = currentTableSession?.sentItems || [];
  const dineInDraftItems = currentTableSession?.unsentItems || [];
  const dineInKots = currentTableSession?.kots || [];
  const latestKotNumber =
    dineInKots.length > 0 && dineInKots[dineInKots.length - 1]?.kot_number
      ? dineInKots[dineInKots.length - 1].kot_number
      : "KOT #105";

  const dineInSubtotal =
    currentTableSession?.bill?.subtotal ||
    dineInSentItems.reduce((acc, i) => acc + (Number(i.total_price) || 0), 0) +
      dineInDraftItems.reduce((acc, i) => acc + (Number(i.totalPrice) || 0), 0);

  const dineInTax =
    currentTableSession?.bill?.tax_amount || Math.round(dineInSubtotal * 0.05);

  const dineInTotal =
    currentTableSession?.bill?.final_total || dineInSubtotal + dineInTax;

  // Takeaway / Delivery safe calculations
  const takeawaySubtotal = (takeawayItems || []).reduce(
    (sum, item) => sum + (Number(item.totalPrice) || 0),
    0
  );
  const takeawayTax = Math.round(takeawaySubtotal * 0.05);
  const takeawayTotal = takeawaySubtotal + takeawayTax;

  // Open Payment modal
  const handleOpenPayment = () => {
    if (orderType === "dine_in") {
      if (dineInSentItems.length === 0 && dineInDraftItems.length === 0) return;
    } else {
      if (takeawayItems.length === 0) return;
    }
    setIsPaymentOpen(true);
  };

  // Payment Confirmation
  const handleConfirmPayment = async (method: PaymentMethod, reference?: string) => {
    if (orderType === "dine_in" && selectedTable && currentTableSession) {
      // 1. Generate bill if not already generated
      let finalBill = currentTableSession.bill;
      if (!finalBill) {
        finalBill = await generateBill(restaurantId, 0);
      }

      // 2. Prepare receipt bill data snapshot
      const billData: BillData = {
        billNumber: finalBill?.bill_number || `BILL-${currentTableSession.orderNumber.replace("ORD-", "")}`,
        kotNumber: (currentTableSession.kots || []).map((k) => k.kot_number),
        orderNumber: currentTableSession.orderNumber,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        orderType: "dine_in",
        tableNumber: selectedTable.table_number,
        waiterName: currentTableSession.waiterName || "Staff",
        items: [
          ...dineInSentItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            totalPrice: i.total_price,
          })),
          ...dineInDraftItems.map((i) => ({
            name: i.menuItem.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
        ],
        subtotal: dineInSubtotal,
        taxAmount: dineInTax,
        discountAmount: finalBill?.discount_amount || 0,
        grandTotal: dineInTotal,
        paymentStatus: "paid",
        paymentMethod: method,
      };

      // 3. Process payment & free table
      await processDineInPayment(restaurantId, method, reference);
      setCompletedBill(billData);
      setIsAddingDineInItems(false);
    } else {
      // Takeaway / Delivery
      const res = await processTakeawayPayment(restaurantId, method, reference);
      if (res) {
        if (res.kotStatus === "not_sent") {
          await manuallySendKot(restaurantId, profile?.id);
        }

        const billData: BillData = {
          billNumber: res.billNumber || `BILL-${res.orderNumber.replace("ORD-", "")}`,
          kotNumber: (res.kots || []).map((k) => k.kot_number),
          orderNumber: res.orderNumber,
          date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          orderType: orderType,
          tableNumber: orderType === "takeaway" ? "Takeaway" : "Delivery",
          waiterName: "Counter POS",
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          deliveryAddress: deliveryAddress || undefined,
          items: takeawayItems.map((i) => ({
            name: i.menuItem.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
          subtotal: takeawaySubtotal,
          taxAmount: takeawayTax,
          discountAmount: 0,
          grandTotal: takeawayTotal,
          paymentStatus: "paid",
          paymentMethod: method,
        };

        setCompletedBill(billData);
      }
    }
  };

  // Start new takeaway / delivery order
  const handleStartNextOrder = () => {
    setCompletedBill(null);
    if (orderType === "dine_in") {
      setIsAddingDineInItems(false);
    } else {
      startNewOrder();
      clearTakeawayCart();
      setCustomerDetails({ name: "", phone: "", address: "" });
    }
  };



  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] gap-3">
      {/* ─────────────────────────────────────────────────────────────
          TOP BAR: ONLY DINE-IN | TAKEAWAY | DELIVERY
          ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-xs shrink-0">
        <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {/* DINE-IN */}
          <button
            type="button"
            onClick={() => {
              setOrderType("dine_in");
              setCompletedBill(null);
              setIsAddingDineInItems(false);
            }}
            className={cn(
              "px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-2",
              orderType === "dine_in"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>DINE-IN</span>
          </button>

          {/* TAKEAWAY */}
          <button
            type="button"
            onClick={() => {
              setOrderType("takeaway");
              setCompletedBill(null);
            }}
            className={cn(
              "px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-2",
              orderType === "takeaway"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <PackageCheck className="h-4 w-4" />
            <span>TAKEAWAY</span>
          </button>

          {/* DELIVERY */}
          <button
            type="button"
            onClick={() => {
              setOrderType("delivery");
              setCompletedBill(null);
            }}
            className={cn(
              "px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-2",
              orderType === "delivery"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <MapPin className="h-4 w-4" />
            <span>DELIVERY</span>
          </button>
        </div>

        {/* Legend */}
        {orderType === "dine_in" && (
          <div className="hidden sm:flex items-center space-x-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Available</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Occupied</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Billing</span>
            </span>
          </div>
        )}

        {statusNotice && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-semibold animate-in fade-in-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{statusNotice}</span>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN 2-PANEL VIEW: LEFT WORKFLOW | RIGHT CURRENT ORDER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* ────────────────── LEFT CONTENT AREA ────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-hidden">
          {/* WORKFLOW A: DINE-IN TABLES GRID (when not in 'Add Items' mode) */}
          {orderType === "dine_in" && !isAddingDineInItems ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Dine-In Tables
                </h2>
                <div className="flex sm:hidden items-center space-x-2 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Free</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Busy</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Bill</span>
                  </span>
                </div>
              </div>

              {/* Grid of Tables or Empty State */}
              {tables.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                  <UtensilsCrossed className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No tables configured</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure tables in Settings → Tables & Floor.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-3 pr-1">
                  {tables.map((table) => {
                  const isSelected = selectedTable?.id === table.id;
                  const isOccupied = table.simpleStatus === "occupied";
                  const isBilling = table.simpleStatus === "billing";
                  const isAvailable = table.simpleStatus === "available";

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleSelectTable(table)}
                      className={cn(
                        "h-24 sm:h-28 rounded-xl border-2 p-3 flex flex-col justify-between text-left transition-all relative overflow-hidden group",
                        isSelected
                          ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 shadow-md ring-2 ring-brand-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                          {table.table_number}
                        </span>
                        {/* Simple Status */}
                        <div className="flex items-center space-x-1">
                          {isAvailable && (
                            <span className="flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1" />
                              Available
                            </span>
                          )}
                          {isOccupied && (
                            <span className="flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <span className="h-2 w-2 rounded-full bg-amber-500 mr-1" />
                              Occupied
                            </span>
                          )}
                          {isBilling && (
                            <span className="flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              <span className="h-2 w-2 rounded-full bg-blue-500 mr-1 animate-pulse" />
                              Billing
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>{table.capacity} Seats</span>
                        {table.session && (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatCurrency(
                              table.session.bill?.final_total ||
                                (table.session.sentItems || []).reduce(
                                  (acc, i) => acc + (Number(i.total_price) || 0),
                                  0
                                )
                            )}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              )}
            </div>
          ) : (
            /* WORKFLOW B: COMPACT MENU (Takeaway, Delivery, or Dine-In Add Items) */
            <div className="flex flex-col h-full space-y-3">
              {/* Back to Tables header when in Dine-In Add-Items mode */}
              {orderType === "dine_in" && isAddingDineInItems && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingDineInItems(false)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Tables</span>
                  </button>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Adding Items to {selectedTable?.table_number}
                  </span>
                </div>
              )}

              {/* Delivery Compact Customer & Location Section */}
              {orderType === "delivery" && (
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Input
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerDetails({ name: e.target.value })}
                      icon={<User className="h-3.5 w-3.5 text-slate-400" />}
                    />
                    <Input
                      placeholder="Phone (WhatsApp / Call)"
                      value={customerPhone}
                      onChange={(e) => setCustomerDetails({ phone: e.target.value })}
                      icon={<Phone className="h-3.5 w-3.5 text-slate-400" />}
                    />
                    <Input
                      placeholder="Delivery Address"
                      value={deliveryAddress}
                      onChange={(e) => setCustomerDetails({ address: e.target.value })}
                      icon={<MapPin className="h-3.5 w-3.5 text-slate-400" />}
                    />
                    <Input
                      placeholder="Landmark / Flat / Floor"
                      value={customerLandmark}
                      onChange={(e) => {
                        setCustomerLandmark(e.target.value);
                        setCustomerDetails({ landmark: e.target.value });
                      }}
                      icon={<Compass className="h-3.5 w-3.5 text-slate-400" />}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isGeocoding || !deliveryAddress.trim()}
                        onClick={handleGeocodeAddress}
                        className="text-[11px] h-7 px-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30"
                      >
                        <MapPin className="w-3 h-3 mr-1 text-cyan-600 dark:text-cyan-400" />
                        <span>{isGeocoding ? "Locating..." : "Geocode Address"}</span>
                      </Button>

                      {geocodedCoords ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pin confirmed: {geocodedCoords.lat.toFixed(4)}, {geocodedCoords.lng.toFixed(4)}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Click Geocode to verify delivery GPS coordinates
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Menu Input */}
              <div className="w-full">
                <Input
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4 text-slate-400" />}
                />
              </div>

              {/* Categories horizontal list */}
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
                {activeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0",
                      activeCategory === cat.id
                        ? "bg-brand-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Dishes Compact Grid or Empty State */}
              {filteredItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                  <UtensilsCrossed className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No menu items found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dishes created in the Menu Catalog will appear here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 pr-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItemToOrder(item)}
                      className="cursor-pointer flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 hover:shadow-xs transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs font-extrabold text-brand-600 mt-0.5">
                          {formatCurrency(item.base_price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Add ${item.name}`}
                        className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center font-bold transition-all shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────────────────── RIGHT CONTENT AREA: CURRENT ORDER PANEL ────────────────── */}
        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col shrink-0 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                CURRENT ORDER
              </h3>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {orderType === "dine_in"
                  ? selectedTable
                    ? `TABLE ${selectedTable.table_number.replace("T", "")}`
                    : "TABLE 05"
                  : orderType === "takeaway"
                  ? "TAKEAWAY"
                  : "DELIVERY"}
              </p>
            </div>

            {/* KOT Number */}
            {orderType === "dine_in" && selectedTable && (
              <Badge variant="primary" className="font-mono text-xs font-extrabold">
                {latestKotNumber}
              </Badge>
            )}
          </div>

          {/* Body: Items or Payment Success state */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            {/* POST-PAYMENT STATE: ONLY after payment completed */}
            {completedBill ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Payment Successful
                  </h4>
                  <p className="text-xs font-mono font-bold text-emerald-600 mt-1">
                    Bill #{completedBill.billNumber}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Amount Settled: {formatCurrency(completedBill.grandTotal)}
                  </p>
                </div>

                {/* Print Bill & View Bill ONLY appear after payment stage */}
                <div className="w-full space-y-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsReceiptModalOpen(true);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="w-full py-2.5 font-bold text-xs space-x-1.5 shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Bill</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="w-full py-2 font-semibold text-xs space-x-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Bill</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartNextOrder}
                    className="w-full text-xs text-slate-500 hover:text-slate-900"
                  >
                    {orderType === "dine_in" ? "Back to Tables" : "Start Next Order"}
                  </Button>
                </div>
              </div>
            ) : orderType === "dine_in" ? (
              /* DINE-IN ACTIVE TABLE ORDER ITEMS */
              dineInSentItems.length === 0 && dineInDraftItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Table {selectedTable?.table_number} is empty
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddingDineInItems(true)}
                    className="text-xs font-bold space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Items</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Sent items (Existing KOT created by waiter) */}
                  {dineInSentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  ))}

                  {/* Unsent draft items (Newly added dishes) */}
                  {dineInDraftItems.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1">
                          <p className="font-bold text-sky-900 dark:text-sky-200 truncate">
                            {draft.menuItem.name}
                          </p>
                          <span className="text-[9px] font-bold bg-sky-200 text-sky-800 dark:bg-sky-900 px-1 rounded">
                            New
                          </span>
                        </div>
                        <p className="text-[11px] text-sky-600">
                          {draft.quantity} × {formatCurrency(draft.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => updateDraftQuantity(draft.id, -1)}
                          className="h-5 w-5 rounded bg-white dark:bg-slate-700 border flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-1">{draft.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateDraftQuantity(draft.id, 1)}
                          className="h-5 w-5 rounded bg-white dark:bg-slate-700 border flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 dark:text-slate-100 ml-2">
                        {formatCurrency(draft.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* TAKEAWAY & DELIVERY ITEMS */
              takeawayItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <PackageCheck className="h-10 w-10 text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Order is empty
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Click items in menu to add to current order
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {takeawayItems.map((cartItem) => (
                    <div
                      key={cartItem.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cartItem.menuItem.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {cartItem.quantity} × {formatCurrency(cartItem.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => updateTakeawayQuantity(cartItem.id, -1)}
                          className="h-5 w-5 rounded bg-white dark:bg-slate-700 border flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-1">{cartItem.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateTakeawayQuantity(cartItem.id, 1)}
                          className="h-5 w-5 rounded bg-white dark:bg-slate-700 border flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 dark:text-slate-100 ml-2">
                        {formatCurrency(cartItem.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer: Totals & Primary Action Buttons (Hidden when payment completed) */}
          {!completedBill && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              {/* Totals Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(
                      orderType === "dine_in" ? dineInSubtotal : takeawaySubtotal
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(
                      orderType === "dine_in" ? dineInTax : takeawayTax
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                  <span>TOTAL</span>
                  <span className="text-brand-600 text-base">
                    {formatCurrency(
                      orderType === "dine_in" ? dineInTotal : takeawayTotal
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {orderType === "dine_in" ? (
                <div className="space-y-2">
                  {/* If draft items exist, staff can send incremental KOT */}
                  {dineInDraftItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmittingKot}
                      onClick={handleSendDineInKot}
                      className="w-full py-2 text-xs font-bold border-sky-300 text-sky-700 hover:bg-sky-50 space-x-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send KOT to Kitchen ({dineInDraftItems.length} dishes)</span>
                    </Button>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingDineInItems(!isAddingDineInItems)}
                      className="flex-1 py-2.5 text-xs font-bold"
                    >
                      {isAddingDineInItems ? "View Tables" : "Add Items"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={dineInSentItems.length === 0 && dineInDraftItems.length === 0}
                      onClick={handleOpenPayment}
                      className="flex-2 py-2.5 text-xs font-extrabold shadow-sm space-x-1"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Proceed to Payment</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={takeawayItems.length === 0}
                  onClick={handleOpenPayment}
                  className="w-full py-2.5 text-xs font-extrabold shadow-sm space-x-1.5"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Proceed to Payment</span>
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PAYMENT MODAL
          ───────────────────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={
          orderType === "dine_in"
            ? `Table ${selectedTable?.table_number || ""} Payment`
            : orderType === "takeaway"
            ? "Takeaway Settlement"
            : "Delivery Settlement"
        }
        orderNumber={
          orderType === "dine_in"
            ? currentTableSession?.orderNumber || "ORD-1050"
            : `ORD-${Date.now().toString().slice(-4)}`
        }
        orderType={orderType}
        tableNumber={orderType === "dine_in" ? selectedTable?.table_number : undefined}
        subtotal={orderType === "dine_in" ? dineInSubtotal : takeawaySubtotal}
        taxAmount={orderType === "dine_in" ? dineInTax : takeawayTax}
        payableAmount={orderType === "dine_in" ? dineInTotal : takeawayTotal}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL BILL RECEIPT MODAL (Appears after payment stage)
          ───────────────────────────────────────────────────────────── */}
      <BillReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        bill={completedBill}
        showPrintButton={true}
      />
    </div>
  );
}
