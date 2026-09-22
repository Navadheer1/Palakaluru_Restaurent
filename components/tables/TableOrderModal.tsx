"use client";

import * as React from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Clock,
  CheckCircle2,
  ChefHat,
  Receipt,
  Search,
  Sparkles,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Send,
  BellRing,
  AlertCircle,
  FileText,
  Printer,
  RotateCcw,
  CheckCheck,
  PlusCircle,
  Percent,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";
import { MenuItem } from "@/types/database";
import { useDineInStore, DraftItem } from "@/stores/useDineInStore";
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { PaymentMethod } from "@/lib/constants";

interface TableOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableNumber: string;
  capacity?: number;
  sectionName?: string;
  onTableStatusChanged?: () => void;
}

const fallbackMenuItems = [
  { id: "e1", name: "Special Dum Chicken Biryani", base_price: 280, category_id: "biryani", is_available: true, sku: "BIR-01" },
  { id: "e2", name: "Mutton Ghee Roast Biryani", base_price: 420, category_id: "biryani", is_available: true, sku: "BIR-02" },
  { id: "e3", name: "Guntur Chilli Chicken", base_price: 260, category_id: "starters", is_available: true, sku: "STR-01" },
  { id: "e4", name: "Paneer Tikka Angara", base_price: 240, category_id: "starters", is_available: true, sku: "STR-02" },
  { id: "e5", name: "Butter Chicken Delhi Style", base_price: 310, category_id: "curries", is_available: true, sku: "CUR-01" },
  { id: "e6", name: "Garlic Butter Naan", base_price: 60, category_id: "breads", is_available: true, sku: "BRD-01" },
  { id: "e7", name: "Mango Malai Lassi", base_price: 90, category_id: "beverages", is_available: true, sku: "BEV-01" },
];

const fallbackCategories = [
  { id: "all", name: "All Dishes" },
  { id: "biryani", name: "Biryani & Rice" },
  { id: "starters", name: "Starters" },
  { id: "curries", name: "Curries" },
  { id: "breads", name: "Breads & Naan" },
  { id: "beverages", name: "Beverages" },
];

export function TableOrderModal({
  isOpen,
  onClose,
  tableId,
  tableNumber,
  capacity = 4,
  sectionName = "AC Hall",
  onTableStatusChanged,
}: TableOrderModalProps) {
  const { profile } = useAuthProfile();
  const { activeRole, canBill, canPay, canRequestBill } = useRolePermissions();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const { data: menuCatalog } = useMenuCatalog(restaurantId);

  const {
    sessions,
    initSession,
    getActiveSession,
    setGuestCount,
    setWaiterName,
    addDraftItem,
    updateDraftQuantity,
    removeDraftItem,
    clearDraftItems,
    sendKot,
    requestBill,
    cancelBillRequest,
    generateBill,
    processPayment,
    markTableServed,
    closeTableOrder,
    getSubtotal,
    getTaxAmount,
    getPayableAmount,
    isSubmittingKot,
    isGeneratingBill,
    isProcessingPayment,
  } = useDineInStore();

  const [modalTab, setModalTab] = React.useState<"order" | "kots" | "bill" | "history">("order");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [menuSearch, setMenuSearch] = React.useState("");
  const [isAddingItems, setIsAddingItems] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showBillDetails, setShowBillDetails] = React.useState(false);
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);
  const [notification, setNotification] = React.useState<string | null>(null);

  // Initialize or resume table session
  React.useEffect(() => {
    if (isOpen && tableId) {
      const defaultWaiter = profile?.full_name || (activeRole === "waiter" ? "Waiter" : "Staff");
      initSession(tableId, tableNumber, null, capacity, defaultWaiter);
    }
  }, [isOpen, tableId, tableNumber, capacity, profile, activeRole, initSession]);

  if (!isOpen) return null;

  const session = sessions[tableId] || getActiveSession();

  const catalogItems: MenuItem[] = (menuCatalog?.items && menuCatalog.items.length > 0)
    ? menuCatalog.items
    : (fallbackMenuItems as unknown as MenuItem[]);

  const categories = (menuCatalog?.categories && menuCatalog.categories.length > 0)
    ? [{ id: "all", name: "All Dishes" }, ...menuCatalog.categories]
    : fallbackCategories;

  const filteredMenuItems = catalogItems.filter((item) => {
    const matchesCat = activeCategory === "all" || item.category_id === activeCategory;
    const matchesQuery = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(menuSearch.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const sentItems = session?.sentItems || [];
  const unsentItems = session?.unsentItems || [];
  const kots = session?.kots || [];
  const subtotal = getSubtotal();
  const taxAmount = getTaxAmount();
  const payableAmount = getPayableAmount(discountPercent);

  const isBillRequested = Boolean(session?.billRequested && !session?.bill);
  const isBillGenerated = Boolean(session?.bill);
  const isPaid = session?.paymentStatus === "paid";
  const kotSent = kots.length > 0;
  const isKitchenPreparing = session?.kotStatus === "preparing" || kots.some((k) => k.status === "preparing");
  const isKitchenReady = session?.kotStatus === "ready" || kots.some((k) => k.status === "ready");

  const isWaiter = activeRole === "waiter";
  const isAdminOrCashier = canBill || canPay || activeRole === "admin" || activeRole === "cashier";

  // Actions
  const handleGuestCountChange = (delta: number) => {
    if (!session) return;
    const newCount = Math.max(1, Math.min(24, (session.guestCount || 2) + delta));
    setGuestCount(tableId, newCount);
  };

  // STEP 2 & 4: SEND KOT (Initial or Additional Dishes)
  const handleSendKot = async () => {
    const waiterName = session?.waiterName || profile?.full_name || (isWaiter ? "Waiter" : "Staff");
    const result = await sendKot(restaurantId, profile?.id, waiterName);
    if (result) {
      setNotification(`🚀 ${result.kot.kot_number} dispatched to Kitchen!`);
      setTimeout(() => setNotification(null), 4000);
      setIsAddingItems(false);
      onTableStatusChanged?.();
    }
  };

  // STEP 5: CUSTOMER REQUESTS BILL (Waiter action)
  const handleRequestBill = async () => {
    const success = await requestBill(tableId, restaurantId);
    if (success) {
      setNotification("🔔 Bill requested! Cashier & Admin notified.");
      setTimeout(() => setNotification(null), 4000);
      onTableStatusChanged?.();
    }
  };

  const handleCancelBillRequest = () => {
    cancelBillRequest(tableId);
    setNotification("Bill request cancelled. Table order resumed.");
    setTimeout(() => setNotification(null), 3000);
    onTableStatusChanged?.();
  };

  // STEP 6: GENERATE FINAL BILL (Admin / Cashier action)
  const handleGenerateFinalBill = async () => {
    const bill = await generateBill(restaurantId, discountPercent);
    if (bill) {
      setNotification(`🧾 ${bill.bill_number} generated for ${formatCurrency(bill.final_total)}!`);
      setTimeout(() => setNotification(null), 4000);
      setShowBillDetails(true);
      onTableStatusChanged?.();
    }
  };

  // STEP 8: RECORD PAYMENT (Admin / Cashier action)
  const handleConfirmPayment = async (method: PaymentMethod, reference?: string) => {
    const success = await processPayment(restaurantId, method, reference);
    if (success) {
      setNotification(`✅ Payment settled via ${method.toUpperCase()}! Table ${tableNumber} is now FREE.`);
      setTimeout(() => {
        setNotification(null);
        onTableStatusChanged?.();
        onClose();
      }, 1200);
    }
  };

  // STEP 9: MANUAL FREE TABLE
  const handleFreeTable = async () => {
    await closeTableOrder(tableId, restaurantId);
    onTableStatusChanged?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white font-extrabold text-base shadow-sm">
                {tableNumber}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Table {tableNumber}
                  </h2>

                  {/* Status Badges */}
                  {isPaid ? (
                    <Badge variant="success" className="font-extrabold text-[10px]">
                      🟢 PAID
                    </Badge>
                  ) : isBillGenerated ? (
                    <Badge variant="primary" className="font-extrabold text-[10px] bg-purple-600 text-white">
                      🟣 BILL READY ({formatCurrency(session?.bill?.final_total || payableAmount)})
                    </Badge>
                  ) : isBillRequested ? (
                    <Badge variant="warning" className="font-extrabold text-[10px] animate-pulse bg-amber-500 text-white">
                      🟡 BILL REQUESTED
                    </Badge>
                  ) : kotSent ? (
                    <Badge variant="info" className="font-extrabold text-[10px]">
                      🔵 OCCUPIED
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-extrabold text-[10px]">
                      ⚪ SEATING
                    </Badge>
                  )}

                  {/* Food Prep Status */}
                  {kotSent && (
                    isKitchenReady ? (
                      <Badge variant="success" className="font-bold text-[10px]">
                        🟢 FOOD READY
                      </Badge>
                    ) : isKitchenPreparing ? (
                      <Badge variant="warning" className="font-bold text-[10px]">
                        🟠 COOKING
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bold text-[10px]">
                        ⏳ KOT SENT
                      </Badge>
                    )
                  )}
                </div>

                {/* Table Details: Section, Guest Stepper, Waiter */}
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-1">
                  <span>{sectionName}</span>
                  <span>•</span>
                  {/* Guest count stepper */}
                  <div className="inline-flex items-center space-x-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    <Users className="h-3 w-3 text-slate-400 mr-0.5" />
                    <span>Guests:</span>
                    <button
                      onClick={() => handleGuestCountChange(-1)}
                      className="h-4 w-4 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold flex items-center justify-center text-[11px]"
                      title="Decrease guest count"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-800 dark:text-slate-200 px-1">
                      {session?.guestCount || capacity}
                    </span>
                    <button
                      onClick={() => handleGuestCountChange(1)}
                      className="h-4 w-4 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold flex items-center justify-center text-[11px]"
                      title="Increase guest count"
                    >
                      +
                    </button>
                  </div>
                  <span>•</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Staff: <strong className="text-slate-800 dark:text-slate-200">{session?.waiterName || "Staff"}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Real-time Notification Banner */}
          {notification && (
            <div className="m-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0 duration-150">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{notification}</span>
            </div>
          )}

          {/* High-priority Workflow Banners */}
          {isBillRequested && !isBillGenerated && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs animate-in fade-in-0">
              <div className="flex items-center space-x-2">
                <BellRing className="h-4 w-4 text-amber-600 animate-bounce shrink-0" />
                <div>
                  <span className="font-bold">Customer Requested Bill!</span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    {isAdminOrCashier
                      ? "Cashier/Admin: Click 'Generate Final Bill' below to prepare invoice."
                      : "Waiting for Cashier to generate final bill. You can cancel if guests wish to order more."}
                  </p>
                </div>
              </div>
              {isWaiter && (
                <button
                  onClick={handleCancelBillRequest}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-[11px] font-bold text-amber-700 border border-amber-300 hover:bg-amber-50"
                >
                  Cancel Request
                </button>
              )}
            </div>
          )}

          {isBillGenerated && !isPaid && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-200 flex items-center justify-between text-xs animate-in fade-in-0">
              <div className="flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    Bill #{session?.bill?.bill_number} Ready ({formatCurrency(session?.bill?.final_total || payableAmount)})
                  </span>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    {isAdminOrCashier
                      ? "Awaiting cashier payment settlement via Cash, UPI, or Card."
                      : "Bill generated by Cashier. Present to guest or direct to payment counter."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBillDetails(!showBillDetails)}
                className="px-2.5 py-1 rounded bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition-colors"
              >
                {showBillDetails ? "Hide Bill" : "View Bill"}
              </button>
            </div>
          )}

          {/* 4 Tabs: ORDER, KOTS, BILL, HISTORY */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 px-4">
            <button
              type="button"
              onClick={() => setModalTab("order")}
              className={cn(
                "px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5",
                modalTab === "order"
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>ORDER</span>
              {unsentItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-bold">
                  {unsentItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setModalTab("kots")}
              className={cn(
                "px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5",
                modalTab === "kots"
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <ChefHat className="h-3.5 w-3.5" />
              <span>KOTS</span>
              {kots.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold">
                  {kots.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setModalTab("bill")}
              className={cn(
                "px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5",
                modalTab === "bill"
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>BILL</span>
              {session?.bill ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 font-bold">
                  READY
                </span>
              ) : isBillRequested ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-bold animate-pulse">
                  REQUESTED
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setModalTab("history")}
              className={cn(
                "px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-1.5",
                modalTab === "history"
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <History className="h-3.5 w-3.5" />
              <span>HISTORY</span>
              {session?.history && session.history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold">
                  {session.history.length}
                </span>
              )}
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: ORDER */}
            {modalTab === "order" && (
              <div className="space-y-4">
                {/* Action Strip: Add Dishes / Dispatched KOT summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={isAddingItems ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setIsAddingItems(!isAddingItems)}
                      className="space-x-1.5 font-bold"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{isAddingItems ? "Close Menu" : "+ Add Dishes"}</span>
                    </Button>

                    {kots.length > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {kots.length} KOT(s) Dispatched
                      </span>
                    )}
                  </div>

                  {/* View Bill receipt toggle */}
                  {session?.bill && (
                    <button
                      onClick={() => setModalTab("bill")}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1 underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>View Final Invoice</span>
                    </button>
                  )}
                </div>

                {/* Menu Drawer */}
                {isAddingItems && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 animate-in fade-in-0 duration-150">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <div className="w-full sm:w-60">
                        <Input
                          placeholder="Search dish..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          icon={<Search className="h-3.5 w-3.5 text-slate-400" />}
                        />
                      </div>
                      <div className="flex items-center space-x-1 overflow-x-auto w-full no-scrollbar">
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setActiveCategory(c.id)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 ${
                              activeCategory === c.id
                                ? "bg-brand-600 text-white"
                                : "bg-white dark:bg-slate-800 border text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {filteredMenuItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => addDraftItem(item)}
                          className="cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 flex justify-between items-center transition-all"
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-brand-600 font-semibold">
                              {formatCurrency(item.base_price)}
                            </p>
                          </div>
                          <button className="h-6 w-6 rounded bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket Section: Draft items (unsent) & Sent items */}
                <div className="space-y-3">
                  {/* 1. DRAFT ITEMS (To be sent in next KOT) */}
                  {unsentItems.length > 0 && (
                    <div className="rounded-xl border-2 border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/20 overflow-hidden shadow-xs">
                      <div className="p-2.5 bg-brand-500/10 border-b border-brand-500/20 flex justify-between items-center text-xs">
                        <span className="font-extrabold text-brand-700 dark:text-brand-300 flex items-center">
                          <Send className="h-3.5 w-3.5 mr-1 text-brand-600" />
                          New Items to Dispatch (KOT #{100 + kots.length + 1})
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={clearDraftItems}
                            className="text-[11px] text-rose-600 hover:underline font-semibold"
                          >
                            Clear All
                          </button>
                          <span className="text-[11px] font-bold text-brand-700 bg-brand-100 dark:bg-brand-900/60 px-2 py-0.5 rounded-full">
                            {unsentItems.length} Draft
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {unsentItems.map((item) => (
                          <div key={item.id} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {item.menuItem.name}
                              </p>
                              <p className="text-[11px] text-brand-600 font-medium">
                                {formatCurrency(item.unitPrice)}
                              </p>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => updateDraftQuantity(item.id, -1)}
                                className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                              <button
                                onClick={() => updateDraftQuantity(item.id, 1)}
                                className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeDraftItem(item.id)}
                                className="h-6 w-6 rounded text-rose-500 hover:bg-rose-50 flex items-center justify-center ml-1"
                                title="Remove draft dish"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="w-16 text-right font-bold text-xs ml-2 text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.totalPrice)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Send KOT Button directly inside draft card */}
                      <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-brand-500/20">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isSubmittingKot}
                          onClick={handleSendKot}
                          className="w-full font-extrabold text-xs space-x-2 bg-brand-600 hover:bg-brand-700 shadow-sm py-2.5"
                        >
                          {isSubmittingKot ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {kots.length > 0 ? "SEND ADDITIONAL KOT" : "SEND KOT"} #{100 + kots.length + 1} TO KITCHEN ({unsentItems.length} ITEMS)
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 2. SENT ITEMS (Dispatched to kitchen & locked) */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                        <ChefHat className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                        Kitchen Dispatched Items ({sentItems.length})
                      </span>
                      {sentItems.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-500">
                          Locked for Kitchen
                        </span>
                      )}
                    </div>

                    {sentItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No dishes sent yet. Tap <strong>+ Add Dishes</strong> above to create the first KOT.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                        {sentItems.map((item) => (
                          <div key={item.id} className="p-2.5 flex items-center justify-between text-xs bg-slate-50/30 dark:bg-slate-800/20">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                {item.quantity}×
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {item.name}
                              </span>
                              {item.kot_number && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold">
                                  {item.kot_number}
                                </span>
                              )}
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">
                                {item.status || "preparing"}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 ml-2">
                              {formatCurrency(item.total_price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KOTS (Incremental KOT Tracking) */}
            {modalTab === "kots" && (
              <div className="space-y-3">
                {kots.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No KOTs dispatched yet</p>
                    <p className="text-[11px] mt-1">Switch to ORDER tab, add items, and click &quot;SEND KOT&quot;.</p>
                  </div>
                ) : (
                  kots.map((k) => (
                    <div
                      key={k.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                    >
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-brand-600">
                            {k.kot_number}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {k.sent_at ? new Date(k.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                          </span>
                        </div>
                        <Badge
                          variant={k.status === "ready" ? "success" : k.status === "preparing" ? "warning" : "info"}
                          className="font-bold text-[10px] uppercase"
                        >
                          {k.status === "ready" ? "🟢 READY TO SERVE" : k.status === "preparing" ? "🟠 PREPARING" : "🔵 QUEUED"}
                        </Badge>
                      </div>

                      <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {(k.items || []).map((item, idx) => (
                          <div key={idx} className="py-1.5 flex justify-between items-center">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.quantity}× {item.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {item.status || k.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: BILL */}
            {modalTab === "bill" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {session?.bill?.bill_number || "Draft Guest Bill"}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Table {tableNumber} • Staff: {session?.waiterName || "Staff"}
                      </p>
                    </div>
                    <Badge
                      variant={isPaid ? "success" : session?.bill ? "primary" : isBillRequested ? "warning" : "secondary"}
                      className="font-bold uppercase text-[10px]"
                    >
                      {isPaid ? "PAID" : session?.bill ? "BILL READY" : isBillRequested ? "WAITING FOR CASHIER" : "UNBILLED"}
                    </Badge>
                  </div>

                  {/* Itemized list */}
                  <div className="space-y-1.5 text-xs divide-y divide-purple-100 dark:divide-purple-900/30">
                    {sentItems.map((item) => (
                      <div key={item.id} className="pt-1.5 flex justify-between text-slate-700 dark:text-slate-300">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="font-medium">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {session?.bill?.discount_amount && session.bill.discount_amount > 0 ? (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount</span>
                        <span>-{formatCurrency(session.bill.discount_amount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-slate-500">
                      <span>GST (5%)</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-purple-200 dark:border-purple-800">
                      <span>Total Amount</span>
                      <span className="text-purple-600 dark:text-purple-400 text-base">
                        {formatCurrency(session?.bill?.final_total || payableAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions inside BILL tab */}
                <div className="pt-2">
                  {isWaiter ? (
                    isBillGenerated ? (
                      <div className="p-3 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-center text-xs text-purple-900 dark:text-purple-200 font-semibold">
                        ✅ Bill generated by Cashier. Present bill to guests or direct to cash counter.
                      </div>
                    ) : isBillRequested ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelBillRequest}
                        className="w-full font-bold text-xs text-amber-700"
                      >
                        Cancel Bill Request & Resume Ordering
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={sentItems.length === 0}
                        onClick={handleRequestBill}
                        className="w-full py-2.5 font-extrabold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm space-x-1"
                      >
                        <BellRing className="h-4 w-4 mr-1" />
                        <span>REQUEST FINAL BILL FROM CASHIER</span>
                      </Button>
                    )
                  ) : (
                    isAdminOrCashier && !session?.bill && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isGeneratingBill || sentItems.length === 0}
                        onClick={handleGenerateFinalBill}
                        className="w-full py-2.5 font-extrabold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      >
                        {isGeneratingBill ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Receipt className="h-4 w-4 mr-1" />}
                        <span>GENERATE FINAL BILL</span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: HISTORY (Session Timeline Audit) */}
            {modalTab === "history" && (
              <div className="space-y-3">
                {(!session?.history || session.history.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No session events recorded yet</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {session.history.map((ev) => (
                      <div key={ev.id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-brand-600 shadow-xs" />
                        <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">
                              {ev.event}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {ev.details && (
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                              {ev.details}
                            </p>
                          )}
                          <div className="mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                            By: {ev.actor}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Calculations & Contextual Role Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-950/70">
            {/* Calculation rows */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({sentItems.length + unsentItems.length} items)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Discount Selector for Admin / Cashier */}
              {isAdminOrCashier && !isPaid && !isBillGenerated && (
                <div className="flex items-center justify-between text-slate-500 py-0.5">
                  <span className="flex items-center">
                    <Percent className="h-3 w-3 mr-1" />
                    Discount:
                  </span>
                  <div className="flex items-center space-x-1">
                    {[0, 5, 10, 15].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiscountPercent(d)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          discountPercent === d
                            ? "bg-brand-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{(subtotal * discountPercent) / 100}</span>
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
                  {formatCurrency(session?.bill?.final_total || payableAmount)}
                </span>
              </div>
            </div>

            {/* ROLE-AWARE ACTION CONTROLS */}
            <div className="pt-1">
              {/* CASE A: DRAFT ITEMS WAITING TO BE SENT */}
              {unsentItems.length > 0 ? (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingKot}
                  onClick={handleSendKot}
                  className="w-full py-3 font-extrabold text-sm space-x-2 bg-brand-600 hover:bg-brand-700 shadow-md"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    SEND KOT #{100 + kots.length + 1} TO KITCHEN ({unsentItems.length} ITEMS)
                  </span>
                </Button>
              ) : isPaid ? (
                /* CASE B: ORDER PAID -> FREE TABLE */
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFreeTable}
                  className="w-full py-3 font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md space-x-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Table Paid • Free Table & Complete Order</span>
                </Button>
              ) : isWaiter ? (
                /* CASE C: WAITER VIEW */
                <div className="space-y-2">
                  {sentItems.length === 0 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddingItems(true)}
                      className="w-full py-2.5 font-bold text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Dishes to Open Table
                    </Button>
                  ) : isBillGenerated ? (
                    <div className="rounded-xl p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-center text-xs space-y-1.5">
                      <p className="font-extrabold">
                        🧾 Bill #{session?.bill?.bill_number} is Ready ({formatCurrency(session?.bill?.final_total || payableAmount)})
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300">
                        Direct guest to cash counter. Waiting for Cashier to settle payment.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBillDetails(true)}
                        className="font-bold text-xs w-full mt-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        View Bill Breakdown for Guest
                      </Button>
                    </div>
                  ) : isBillRequested ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingItems(true)}
                        className="font-bold text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        + Add More Dishes
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelBillRequest}
                        className="font-bold text-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Cancel Bill Request
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingItems(true)}
                        className="font-bold text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        + Add More Dishes
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRequestBill}
                        className="font-extrabold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm space-x-1"
                      >
                        <BellRing className="h-3.5 w-3.5" />
                        <span>REQUEST BILL</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* CASE D: ADMIN / CASHIER VIEW */
                <div className="space-y-2">
                  {sentItems.length === 0 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddingItems(true)}
                      className="w-full py-2.5 font-bold text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Dishes & Send KOT
                    </Button>
                  ) : isBillGenerated ? (
                    /* Bill is generated: Cashier settles payment */
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full py-3 font-extrabold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md space-x-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>
                          RECORD PAYMENT ({formatCurrency(session?.bill?.final_total || payableAmount)})
                        </span>
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingItems(true)}
                          className="flex-1 font-bold text-xs"
                        >
                          <PlusCircle className="h-3.5 w-3.5 mr-1" />
                          Add Extra Items
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBillDetails(!showBillDetails)}
                          className="flex-1 font-bold text-xs"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Bill is NOT yet generated: Admin generates bill */
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingItems(true)}
                        className="font-bold text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        + Add More Dishes
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isGeneratingBill}
                        onClick={handleGenerateFinalBill}
                        className="font-extrabold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md space-x-1"
                      >
                        {isGeneratingBill ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Receipt className="h-3.5 w-3.5" />
                        )}
                        <span>GENERATE FINAL BILL</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Table ${tableNumber} Payment Settlement`}
        orderNumber={session?.orderNumber || "ORD-0000"}
        billNumber={session?.bill?.bill_number}
        tableNumber={tableNumber}
        orderType="dine_in"
        subtotal={session?.bill?.subtotal || subtotal}
        discountAmount={session?.bill?.discount_amount || (subtotal * discountPercent) / 100}
        taxAmount={session?.bill?.tax_amount || taxAmount}
        payableAmount={session?.bill?.final_total || payableAmount}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
      />
    </>
  );
}
