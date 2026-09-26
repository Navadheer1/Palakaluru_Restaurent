"use client";

import * as React from "react";
import {
  Grid,
  Users,
  Utensils,
  CheckCircle2,
  Clock,
  ChefHat,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Send,
  BellRing,
  RotateCcw,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
  X,
  CreditCard,
  CheckCheck,
  PlusCircle,
  UtensilsCrossed,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableStatus, KotStatus } from "@/lib/constants";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useTables, RestaurantTableItem } from "@/lib/hooks/useTables";
import { useOptionalRestaurantContext } from "@/lib/context/RestaurantContext";
import { useDineInStore, ActiveTableSession, DraftItem } from "@/stores/useDineInStore";
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { MenuItem, MenuCategory } from "@/types/database";
import { formatCurrency, cn } from "@/lib/utils";
import { BillReceiptModal } from "@/components/billing/BillReceiptModal";
import { PaymentModal } from "@/components/billing/PaymentModal";
import { createClient } from "@/lib/supabase/client";

export interface OperationalTableItem extends RestaurantTableItem {
  isPaid?: boolean;
}

// Operational Table interface


interface VisualMenuItemCardProps {
  item: MenuItem;
  draftItem?: DraftItem;
  onAdd: (item: MenuItem) => void;
  onUpdateQty: (delta: number) => void;
}

function VisualMenuItemCard({ item, draftItem, onAdd, onUpdateQty }: VisualMenuItemCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const qtyInDraft = draftItem ? draftItem.quantity : 0;
  const hasImage = Boolean(item.image_url && !imgError);

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-slate-900 transition-all overflow-hidden shadow-2xs hover:shadow-md",
        qtyInDraft > 0
          ? "border-emerald-500/80 ring-2 ring-emerald-500/20 dark:border-emerald-600 bg-emerald-50/10 dark:bg-emerald-950/10"
          : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* 1. Food Image with Quantity Badge */}
      <div className="relative w-full h-28 sm:h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {hasImage ? (
          <img
            src={item.image_url!}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 p-2 text-slate-400">
            <UtensilsCrossed className="h-7 w-7 mb-1 text-slate-400/80" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
              {item.category_id || "Kitchen"}
            </span>
          </div>
        )}

        {/* Floating Quantity Badge on Image Top-Right */}
        {qtyInDraft > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md flex items-center space-x-0.5 animate-in zoom-in-75">
            <span>×{qtyInDraft}</span>
          </div>
        )}
      </div>

      {/* 2. Item Name & Price */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h4
            className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight tracking-tight min-h-[2rem]"
            title={item.name}
          >
            {item.name}
          </h4>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(Number(item.base_price))}
            </span>
            {item.preparation_time_mins ? (
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {item.preparation_time_mins}m
              </span>
            ) : null}
          </div>
        </div>

        {/* 3. Action: [ + Add ] or [-] Qty [+] Stepper */}
        <div>
          {qtyInDraft === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-full h-8 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600 font-bold text-xs transition-colors active:scale-95 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center justify-between w-full h-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl px-1 shadow-2xs">
              <button
                type="button"
                onClick={() => onUpdateQty(-1)}
                className="h-6 w-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 shadow-2xs transition-all active:scale-90 cursor-pointer"
                title="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 px-2 select-none">
                {qtyInDraft}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(1)}
                className="h-6 w-6 flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-all active:scale-90 cursor-pointer"
                title="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WaiterTablesWorkspace() {
  const { profile } = useAuthProfile();
  const restContext = useOptionalRestaurantContext();
  const restaurantId = restContext?.restaurantId || profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const branchId = restContext?.branchId || profile?.branch_id || "b0000000-0000-0000-0000-000000000001";
  const waiterName = profile?.full_name || profile?.name || (profile?.email ? profile.email.split("@")[0] : "Waiter");

  // Realtime subscription
  useRealtimeSync(restaurantId);

  // Hydration safety
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Tables and Catalog data
  const { tables: dbTables, isLoading: tablesLoading, refetch: refetchTables, updateStatus } = useTables(restaurantId, branchId);
  const { data: menuCatalog } = useMenuCatalog(restaurantId);

  // Dine-In Store
  const {
    sessions,
    activeTableId,
    setActiveTable,
    initSession,
    setGuestCount,
    addDraftItem,
    updateDraftQuantity,
    updateDraftInstructions,
    removeDraftItem,
    clearDraftItems,
    sendKot,
    requestBill,
    cancelBillRequest,
    updateKotStatusInSession,
    markKotServed,
    markOrderItemServed,
    markBillPrinted,
    markBillDelivered,
    processPayment,
    closeTableOrder,
    isSubmittingKot,
    syncTableDatabaseSession,
  } = useDineInStore();

  // Floor navigation & filter state
  const [selectedSection, setSelectedSection] = React.useState<string>("all");
  const [searchTableQuery, setSearchTableQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Active workspace table (when a table is opened)
  const [openedTableId, setOpenedTableId] = React.useState<string | null>(null);

  // Seating Modal State
  const [seatingTable, setSeatingTable] = React.useState<OperationalTableItem | null>(null);
  const [seatingGuestCount, setSeatingGuestCount] = React.useState<number>(4);
  const [seatingCustomerName, setSeatingCustomerName] = React.useState<string>("");
  const [seatingNotes, setSeatingNotes] = React.useState<string>("");

  // Menu Drawer / Picker State (inside opened table)
  const [menuSearch, setMenuSearch] = React.useState<string>("");
  const [selectedMenuCategory, setSelectedMenuCategory] = React.useState<string>("all");
  const [confirmKotModalOpen, setConfirmKotModalOpen] = React.useState<boolean>(false);
  const [billRequestConfirmOpen, setBillRequestConfirmOpen] = React.useState<boolean>(false);
  const [settlePaymentModalOpen, setSettlePaymentModalOpen] = React.useState<boolean>(false);
  const [billReceiptModalOpen, setBillReceiptModalOpen] = React.useState<boolean>(false);
  const [mobileOrderDrawerOpen, setMobileOrderDrawerOpen] = React.useState<boolean>(false);

  // Feedback banner state
  const [actionNotice, setActionNotice] = React.useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  const showNotification = (message: string, type: "success" | "info" | "warning" = "success") => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 3500);
  };

  // Compile Unified Tables List
  const tables: OperationalTableItem[] = React.useMemo(() => {
    const base: OperationalTableItem[] = (dbTables || []).filter((t) => t.is_active !== false);
    if (!mounted) return base;

    return base.map((tbl) => {
      const session = sessions[tbl.id];
      if (session) {
        let derivedStatus: TableStatus = "occupied";
        const isPaid = session.paymentStatus === "paid" || session.status === "paid";

        if (isPaid) {
          derivedStatus = "payment_completed";
        } else if (session.billStatus === "delivered" || session.status === "bill_delivered") {
          derivedStatus = "bill_delivered";
        } else if (session.billStatus === "printed" || session.billStatus === "generated" || session.bill || session.status === "bill_generated") {
          derivedStatus = "bill_ready";
        } else if (session.billStatus === "requested" || session.billRequested || session.status === "bill_requested") {
          derivedStatus = "bill_requested";
        } else if (session.kots.some((k) => k.status === "ready")) {
          derivedStatus = "food_ready";
        } else if (session.kots.some((k) => k.status === "preparing")) {
          derivedStatus = "waiting_for_food";
        } else if (session.kots.length > 0 && session.kots.every((k) => k.status === "served")) {
          derivedStatus = "occupied";
        } else if (session.sentItems.length > 0) {
          derivedStatus = "occupied";
        }

        const sentTotal = session.sentItems.reduce((acc, i) => acc + (i.total_price || 0), 0);
        const draftTotal = session.unsentItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
        const total = session.bill?.final_total || Math.round((sentTotal + draftTotal) * 1.05);

        // Elapsed time
        const elapsedMins = Math.max(
          1,
          Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 60000)
        );

        return {
          ...tbl,
          status: derivedStatus,
          isPaid,
          amount: total > 0 ? total : undefined,
          timeSpent: `${elapsedMins} min`,
        };
      }
      return tbl;
    });
  }, [dbTables, sessions, mounted]);

  // Unique Sections list for filter
  const sections = React.useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.section_name) set.add(t.section_name);
    });
    return ["all", ...Array.from(set)];
  }, [tables]);

  // Filtered Tables
  const filteredTables = React.useMemo(() => {
    return tables.filter((t) => {
      if (selectedSection !== "all" && t.section_name !== selectedSection) {
        return false;
      }
      if (searchTableQuery.trim() !== "") {
        const query = searchTableQuery.toLowerCase();
        const matchesNum = t.table_number.toLowerCase().includes(query);
        const matchesSec = (t.section_name || "").toLowerCase().includes(query);
        if (!matchesNum && !matchesSec) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "available" && t.status !== "available") return false;
        if (statusFilter === "occupied" && (t.status === "available" || t.isPaid)) return false;
        if (statusFilter === "ordering" && t.status !== "occupied") return false;
        if (statusFilter === "preparing" && t.status !== "waiting_for_food") return false;
        if (statusFilter === "ready" && t.status !== "food_ready") return false;
        if (statusFilter === "bill_requested" && t.status !== "bill_requested") return false;
        if (statusFilter === "bill_ready" && t.status !== "bill_ready" && t.status !== "bill_delivered") return false;
        if (statusFilter === "payment" && !t.isPaid && t.status !== "payment_completed") return false;
      }
      return true;
    });
  }, [tables, selectedSection, searchTableQuery, statusFilter]);

  // Menu categories and items
  const menuCategories = (menuCatalog?.categories && menuCatalog.categories.length > 0)
    ? [{ id: "all", name: "All Items" }, ...menuCatalog.categories]
    : [{ id: "all", name: "All Items" }];

  const menuItems = menuCatalog?.items || [];

  const filteredMenuItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedMenuCategory !== "all" && item.category_id !== selectedMenuCategory) {
        return false;
      }
      if (menuSearch.trim() !== "") {
        const q = menuSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, selectedMenuCategory, menuSearch]);

  // Active Session for the currently opened table
  const activeSession: ActiveTableSession | null = React.useMemo(() => {
    if (!openedTableId || !mounted) return null;
    return sessions[openedTableId] || null;
  }, [openedTableId, sessions, mounted]);

  const openedTableObj = React.useMemo(() => {
    if (!openedTableId) return null;
    return tables.find((t) => t.id === openedTableId) || null;
  }, [openedTableId, tables]);

  // Handler: Seat Guests
  const handleStartSeating = (tbl: OperationalTableItem) => {
    setSeatingTable(tbl);
    setSeatingGuestCount(tbl.capacity || 4);
    setSeatingCustomerName("");
    setSeatingNotes("");
  };

  const handleConfirmSeating = async () => {
    if (!seatingTable) return;
    setActiveTable(seatingTable.id);
    initSession(
      seatingTable.id,
      seatingTable.table_number,
      undefined,
      seatingGuestCount,
      waiterName,
      true // forceNew = true ensures previous/completed session items do NOT contaminate new dining session
    );

    // Optimistically update table status
    updateStatus({ tableId: seatingTable.id, newStatus: "occupied" });

    showNotification(`Table ${seatingTable.table_number} seated with ${seatingGuestCount} guests.`);
    const seatedId = seatingTable.id;
    setSeatingTable(null);

    // Immediately open the table workspace and reset local view states
    setMenuSearch("");
    setSelectedMenuCategory("all");
    setConfirmKotModalOpen(false);
    setBillRequestConfirmOpen(false);
    setSettlePaymentModalOpen(false);
    setBillReceiptModalOpen(false);
    setMobileOrderDrawerOpen(false);
    setOpenedTableId(seatedId);
  };

  // Handler: Open Table Workspace
  const handleOpenTableWorkspace = (tableId: string) => {
    const tbl = tables.find((t) => t.id === tableId);
    if (!tbl) return;

    setActiveTable(tableId);

    if (!sessions[tableId]) {
      // If table is occupied in DB but session not initialized in memory, init it
      initSession(tbl.id, tbl.table_number, tbl.current_order_id || undefined, tbl.capacity || 4, waiterName);
    }

    // Reset table-level UI states so previous filters or modals never bleed
    setMenuSearch("");
    setSelectedMenuCategory("all");
    setConfirmKotModalOpen(false);
    setBillRequestConfirmOpen(false);
    setSettlePaymentModalOpen(false);
    setBillReceiptModalOpen(false);
    setMobileOrderDrawerOpen(false);

    setOpenedTableId(tableId);
  };

  // Keep activeTableId in store synchronized whenever openedTableId changes
  React.useEffect(() => {
    if (openedTableId) {
      setActiveTable(openedTableId);
      setMenuSearch("");
      setSelectedMenuCategory("all");
      setConfirmKotModalOpen(false);
      setBillRequestConfirmOpen(false);
      setSettlePaymentModalOpen(false);
      setBillReceiptModalOpen(false);
      setMobileOrderDrawerOpen(false);
    }
  }, [openedTableId, setActiveTable]);

  // Hydrate opened table session from Supabase if needed
  React.useEffect(() => {
    if (!openedTableId) return;
    const tbl = tables.find((t) => t.id === openedTableId);
    if (!tbl) return;

    let isCancelled = false;
    const fetchTableOrder = async () => {
      try {
        const supabase = createClient();
        const { data: orders, error: orderErr } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("table_id", openedTableId)
          .in("status", ["pending", "confirmed", "preparing", "ready", "served", "bill_requested", "bill_printed"])
          .order("created_at", { ascending: false })
          .limit(1);

        if (orderErr || !orders || orders.length === 0 || isCancelled) return;
        const activeOrder = orders[0];

        const { data: kots } = await supabase
          .from("kot")
          .select("*, kot_items(*)")
          .eq("order_id", activeOrder.id);

        if (!isCancelled) {
          syncTableDatabaseSession(
            openedTableId,
            tbl.table_number,
            activeOrder,
            kots || []
          );
        }
      } catch {
        // Safe fallback
      }
    };

    fetchTableOrder();
    return () => {
      isCancelled = true;
    };
  }, [openedTableId, tables, syncTableDatabaseSession]);

  // Scoped Table Realtime Channel: ONLY apply KOT/Order events matching openedTableId
  React.useEffect(() => {
    if (!openedTableId || !restaurantId) return;

    const supabase = createClient();
    const channelName = `scoped-table-${openedTableId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kot",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const rec = (payload.new || payload.old) as any;
          // STRICT FILTER: Ignore any event that does NOT belong to this opened table
          if (rec?.table_id !== openedTableId) return;

          if (payload.eventType === "UPDATE") {
            updateKotStatusInSession(rec.id, rec.status as KotStatus, openedTableId);
            if (rec.status === "ready") {
              showNotification(`Dishes for ${rec.kot_number} are ready to serve!`, "success");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [openedTableId, restaurantId, updateKotStatusInSession]);

  // Handler: Add Item to Draft
  const handleAddItemToDraft = (item: MenuItem) => {
    if (!openedTableId) return;
    if (!sessions[openedTableId]) {
      const tbl = tables.find((t) => t.id === openedTableId);
      initSession(
        openedTableId,
        tbl?.table_number || "T",
        tbl?.current_order_id || undefined,
        tbl?.capacity || 4,
        waiterName
      );
    }
    setActiveTable(openedTableId);
    addDraftItem(item, undefined, [], "", openedTableId);
    showNotification(`Added ${item.name} to draft.`);
  };

  // Handler: Update Draft Quantity directly from Visual Card (+ / -)
  const handleUpdateDraftQuantityForItem = (item: MenuItem, delta: number) => {
    if (!openedTableId) return;
    const session = sessions[openedTableId] || activeSession;
    if (!session) {
      if (delta > 0) {
        handleAddItemToDraft(item);
      }
      return;
    }
    const existing = session.unsentItems.find((d) => d.menuItem.id === item.id);
    if (existing) {
      updateDraftQuantity(existing.id, delta, openedTableId);
    } else if (delta > 0) {
      addDraftItem(item, undefined, [], "", openedTableId);
    }
  };

  // Handler: Open Confirmation Modal to Dispatch KOT
  const handleOpenConfirmKot = () => {
    if (!openedTableId || !activeSession) return;
    if (activeSession.unsentItems.length === 0) {
      showNotification("No new items in draft to send.", "warning");
      return;
    }
    setConfirmKotModalOpen(true);
  };

  // Handler: Confirmed Dispatch KOT
  const handleConfirmSendKot = async () => {
    if (!openedTableId || !activeSession) return;
    if (activeSession.unsentItems.length === 0) {
      showNotification("No new items in draft to send.", "warning");
      setConfirmKotModalOpen(false);
      return;
    }

    const result = await sendKot(restaurantId, profile?.id, waiterName, openedTableId);
    setConfirmKotModalOpen(false);
    setMobileOrderDrawerOpen(false);
    if (result) {
      updateStatus({ tableId: openedTableId, newStatus: "waiting_for_food" });
      showNotification(`${result.kot.kot_number} sent to kitchen.`, "success");
    }
  };

  // Handler: Mark Food Served
  const handleMarkKotServed = (kotId: string, kotNumber: string) => {
    if (!openedTableId) return;
    markKotServed(openedTableId, kotId);
    showNotification(`${kotNumber} marked as SERVED to Table ${activeSession?.tableNumber || ""}.`, "success");
  };

  // Handler: Mark Individual Order Item Served
  const handleMarkOrderItemServed = (orderItemId: string, itemName: string) => {
    if (!openedTableId) return;
    markOrderItemServed(openedTableId, orderItemId);
    showNotification(`${itemName} marked as SERVED.`, "success");
  };

  // Handler: Open Bill Request Dialog
  const handleOpenBillRequest = () => {
    if (!openedTableId || !activeSession) return;
    if (activeSession.unsentItems.length > 0) {
      showNotification("You have unsent items in Current Order. Send to kitchen or clear them before requesting bill.", "warning");
      return;
    }
    if (activeSession.sentItems.length === 0) {
      showNotification("Cannot request bill: No items ordered for this table.", "warning");
      return;
    }
    setBillRequestConfirmOpen(true);
  };

  // Handler: Confirm Bill Request
  const handleConfirmBillRequest = async () => {
    setBillRequestConfirmOpen(false);
    if (!openedTableId || !activeSession) return;
    const success = await requestBill(openedTableId, restaurantId);
    if (success) {
      updateStatus({ tableId: openedTableId, newStatus: "bill_requested" });
      showNotification(`Bill requested for Table ${activeSession.tableNumber}. Cashier notified.`, "info");
    }
  };

  // Handler: Cancel Bill Request
  const handleCancelBillRequest = () => {
    if (!openedTableId) return;
    cancelBillRequest(openedTableId);
    updateStatus({ tableId: openedTableId, newStatus: "occupied" });
    showNotification("Bill request cancelled.", "info");
  };

  // Handler: Mark Bill Delivered to Customer
  const handleMarkBillDelivered = () => {
    if (!openedTableId) return;
    markBillDelivered(openedTableId);
    updateStatus({ tableId: openedTableId, newStatus: "bill_delivered" });
    showNotification(`Bill marked as delivered to Table ${activeSession?.tableNumber}. Payment pending.`, "success");
  };

  // Handler: Confirm Payment
  const handleConfirmPayment = async (method: any, reference?: string) => {
    if (!openedTableId || !activeSession) return;
    await processPayment(restaurantId, method, reference, openedTableId);
    updateStatus({ tableId: openedTableId, newStatus: "payment_completed" });
    setSettlePaymentModalOpen(false);
    showNotification(`Payment recorded via ${String(method).toUpperCase()}! Table is now ready to close.`, "success");
  };

  // Handler: Close Table (when payment completed)
  const handleCloseTable = async () => {
    if (!openedTableId || !activeSession) return;
    await closeTableOrder(openedTableId, restaurantId);
    updateStatus({ tableId: openedTableId, newStatus: "available" });
    showNotification(`Table ${activeSession.tableNumber} completed & freed for new diners!`, "success");
    setOpenedTableId(null);
  };

  // =========================================================================
  // VIEW MODE B: DEDICATED TABLE SERVICE WORKSPACE (When a table is opened)
  // =========================================================================
  if (openedTableId && activeSession && openedTableObj) {
    const currentTableId = openedTableId;
    const currentDiningSessionId = activeSession.orderId;

    // Strict table-scoped and session-scoped KOTs
    const tableKots = (activeSession.kots || []).filter(
      (k) => (k.table_id === currentTableId || (!k.table_id && k.order_id === currentDiningSessionId))
    );

    // Strict table-scoped and session-scoped sent items
    const tableSentItems = (activeSession.sentItems || []).filter(
      (i) => (!i.order_id || i.order_id === currentDiningSessionId)
    );

    // Strict table-scoped draft items
    const tableDraftItems = activeSession.unsentItems || [];

    const sentTotal = tableSentItems.reduce((acc, i) => acc + (i.total_price || (i.unit_price * i.quantity) || 0), 0);
    const draftTotal = tableDraftItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
    const draftTax = Math.round(draftTotal * 0.05);
    const draftGrandTotal = draftTotal + draftTax;
    const totalDraftQty = tableDraftItems.reduce((acc, i) => acc + i.quantity, 0);

    const subtotal = sentTotal;
    const taxAmount = Math.round(subtotal * 0.05); // 5% GST on kitchen orders
    const grandTotal = activeSession.bill?.final_total || (subtotal + taxAmount);

    const totalSentQty = tableSentItems.reduce((acc, i) => acc + i.quantity, 0);
    const servedCount = tableSentItems.filter((i) => i.status === "served").reduce((acc, i) => acc + i.quantity, 0);
    const readyCount = tableSentItems.filter((i) => i.status === "ready").reduce((acc, i) => acc + i.quantity, 0);
    const preparingCount = tableSentItems.filter((i) => i.status === "preparing" || i.status === "pending" || !i.status).reduce((acc, i) => acc + i.quantity, 0);
    const totalKots = tableKots.length;

    const elapsedMins = Math.max(
      1,
      Math.floor((Date.now() - new Date(activeSession.createdAt).getTime()) / 60000)
    );

    const isPaid = activeSession.paymentStatus === "paid" || activeSession.status === "paid" || openedTableObj.isPaid;
    const isBillDelivered = activeSession.billStatus === "delivered" || activeSession.status === "bill_delivered";
    const isBillReady = activeSession.billStatus === "printed" || activeSession.billStatus === "generated" || !!activeSession.bill || activeSession.status === "bill_generated";
    const isBillRequested = activeSession.billStatus === "requested" || activeSession.billRequested || activeSession.status === "bill_requested";
    const hasReadyFood = readyCount > 0 || tableKots.some((k) => k.status === "ready");
    const hasDraftItems = tableDraftItems.length > 0;

    let diningStatusLabel = "Occupied • Dining";
    let diningStatusVariant: "default" | "primary" | "secondary" | "success" | "warning" | "destructive" = "secondary";
    if (isPaid) {
      diningStatusLabel = "Payment Settled";
      diningStatusVariant = "success";
    } else if (isBillDelivered) {
      diningStatusLabel = "Bill Delivered (Payment Pending)";
      diningStatusVariant = "warning";
    } else if (isBillReady) {
      diningStatusLabel = "Bill Ready / Printed";
      diningStatusVariant = "primary";
    } else if (isBillRequested) {
      diningStatusLabel = "Bill Requested";
      diningStatusVariant = "warning";
    } else if (hasReadyFood) {
      diningStatusLabel = "Food Ready to Serve";
      diningStatusVariant = "success";
    } else if (preparingCount > 0) {
      diningStatusLabel = "Waiting for Food";
      diningStatusVariant = "warning";
    } else if (tableSentItems.length > 0 && servedCount === totalSentQty) {
      diningStatusLabel = "All Items Served";
      diningStatusVariant = "success";
    }

    const receiptBillData = {
      billNumber: activeSession.bill?.bill_number || `INV-${openedTableObj.table_number}`,
      kotNumber: tableKots.map((k) => k.kot_number),
      orderNumber: activeSession.orderId,
      date: new Date(activeSession.createdAt).toLocaleDateString(),
      time: new Date(activeSession.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      orderType: "dine_in" as const,
      tableNumber: openedTableObj.table_number,
      waiterName: activeSession.waiterName || waiterName,
      customerName: activeSession.customerName || undefined,
      items: tableSentItems.map((i) => ({
        name: i.name || "Item",
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price || (i.unit_price * i.quantity),
      })),
      subtotal,
      taxAmount,
      grandTotal,
      paymentStatus: (activeSession.paymentStatus || (isPaid ? "paid" : "pending")) as any,
      paymentMethod: activeSession.paymentMethod,
    };

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Floating feedback alert */}
        {actionNotice && (
          <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
            <span className={cn(
              "h-2 w-2 rounded-full",
              actionNotice.type === "success" ? "bg-emerald-400" : actionNotice.type === "warning" ? "bg-amber-400" : "bg-blue-400"
            )} />
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* 1. Section 8: Table Detail Top Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setOpenedTableId(null)}
                className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                title="Return to My Tables Floor"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    Table {openedTableObj.table_number}
                  </h1>
                  <Badge variant={diningStatusVariant} className="font-extrabold uppercase text-[10px]">
                    {diningStatusLabel}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {openedTableObj.section_name || "AC Hall"} • Seated {activeSession.guestCount} Guests • {elapsedMins} min elapsed • Waiter: {activeSession.waiterName || waiterName}
                </p>
              </div>
            </div>

            {/* Contextual Primary Action Button */}
            <div className="flex items-center gap-2">
              {isPaid ? (
                <Button
                  variant="primary"
                  onClick={handleCloseTable}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Close Table &amp; Free Table
                </Button>
              ) : isBillDelivered ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setSettlePaymentModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  >
                    <CreditCard className="h-4 w-4 mr-1.5" />
                    Record Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBillReceiptModalOpen(true)}
                    className="border-slate-300 text-slate-700 text-xs"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    View Bill
                  </Button>
                </div>
              ) : isBillReady ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handleMarkBillDelivered}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1.5" />
                    Bill Given to Customer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBillReceiptModalOpen(true)}
                    className="border-slate-300 text-slate-700 text-xs"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    View Bill
                  </Button>
                </div>
              ) : isBillRequested ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    Waiting for Cashier Bill...
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelBillRequest}
                    className="text-xs text-slate-600"
                  >
                    Cancel Request
                  </Button>
                </div>
              ) : hasReadyFood ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    const readyKot = tableKots.find((k) => k.status === "ready");
                    if (readyKot) {
                      handleMarkKotServed(readyKot.id, readyKot.kot_number);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs animate-pulse"
                >
                  <Utensils className="h-4 w-4 mr-1.5" />
                  Serve Ready Food
                </Button>
              ) : hasDraftItems ? (
                <Button
                  variant="primary"
                  onClick={handleOpenConfirmKot}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Send to Kitchen ({totalDraftQty})
                </Button>
              ) : tableSentItems.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleOpenBillRequest}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 font-bold text-xs"
                >
                  <Receipt className="h-4 w-4 mr-1.5" />
                  Request Final Bill
                </Button>
              ) : null}
            </div>
          </div>

          {/* Section 8 Summary Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Total KOTs</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{totalKots} Ticket{totalKots !== 1 ? "s" : ""}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Ordered Items</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{totalSentQty} Qty ({tableSentItems.length} dishes)</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Served Items</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{servedCount} Qty</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Preparing</span>
              <span className={cn("text-sm font-black", preparingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100")}>
                {preparingCount} Qty
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Current Total (incl. GST)</span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* 2. Main Two-Column Restaurant POS Ordering Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT / MAIN AREA (lg:col-span-8): Running Order + Menu + KOTs */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Visual Menu Card Picker */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <ChefHat className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Visual Food Menu
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tap dish to add • Selected dishes instantly appear in Current Draft on the right
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-72">
                  <Input
                    placeholder="Search menu dish or ingredients..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    icon={<Search className="h-3.5 w-3.5" />}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {menuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedMenuCategory(cat.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                      selectedMenuCategory === cat.id
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Visual Food Cards Grid */}
              {filteredMenuItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No menu items found matching &quot;{menuSearch}&quot; in this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 max-h-[580px] overflow-y-auto pr-1">
                  {filteredMenuItems.map((item) => {
                    const draftItem = tableDraftItems.find((d) => d.menuItem.id === item.id);
                    return (
                      <VisualMenuItemCard
                        key={item.id}
                        item={item}
                        draftItem={draftItem}
                        onAdd={handleAddItemToDraft}
                        onUpdateQty={(delta) => handleUpdateDraftQuantityForItem(item, delta)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. KOT Activity Stream & Kitchen Progress */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      KOT Activity &amp; Kitchen Progress ({totalKots})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Orders already sent to kitchen • Dispatched tickets &amp; ready alerts
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Live Floor Stream</span>
              </div>

              {tableKots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No KOTs sent to kitchen yet. Add items above and click &quot;Send to Kitchen&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tableKots.map((kot) => {
                    const isReady = kot.status === "ready";
                    const isServed = kot.status === "served";
                    const isPreparing = kot.status === "preparing" || kot.status === "sent";

                    return (
                      <div
                        key={kot.id}
                        className={cn(
                          "rounded-2xl border p-4 transition-all flex flex-col justify-between shadow-2xs",
                          isReady
                            ? "bg-emerald-50/70 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                            : isServed
                            ? "bg-slate-50/60 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 opacity-80"
                            : "bg-amber-50/30 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {kot.kot_number}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {kot.items?.length || 0} Items • {kot.sent_at ? new Date(kot.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  isReady
                                    ? "success"
                                    : isServed
                                    ? "secondary"
                                    : isPreparing
                                    ? "warning"
                                    : "default"
                                }
                                className="font-extrabold uppercase text-[10px]"
                              >
                                {isReady
                                  ? "🟢 Food Ready"
                                  : isServed
                                  ? "Served"
                                  : isPreparing
                                  ? "🟠 Preparing"
                                  : "NEW"}
                              </Badge>

                              {isReady && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkKotServed(kot.id, kot.kot_number)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-7 px-3 shadow-xs cursor-pointer"
                                >
                                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                  Mark Served
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* KOT Items List */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
                            {kot.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-slate-800 dark:text-slate-200 font-medium">
                                  {item.name} <span className="font-bold text-emerald-600 dark:text-emerald-400">×{item.quantity}</span>
                                </span>
                                {item.instructions && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                    {item.instructions}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Section 3: RUNNING TABLE ORDER (Persistent dining record across all KOTs - Moved to bottom) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        Running Table Order
                      </h3>
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {tableSentItems.length} dishes • {totalSentQty} items
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Persistent session order • Every item sent to kitchen remains visible here until table closure
                    </p>
                  </div>
                </div>

                {/* Status indicator badge */}
                <div>
                  {tableSentItems.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium">No kitchen orders yet</span>
                  ) : readyCount > 0 ? (
                    <Badge variant="success" className="font-extrabold text-[10px] animate-pulse">
                      🟢 {readyCount} Item{readyCount !== 1 ? "s" : ""} Ready to Serve
                    </Badge>
                  ) : preparingCount > 0 ? (
                    <Badge variant="warning" className="font-extrabold text-[10px]">
                      ⏳ {preparingCount} Item{preparingCount !== 1 ? "s" : ""} Preparing
                    </Badge>
                  ) : (
                    <Badge variant="success" className="font-extrabold text-[10px]">
                      ✓ All Items Served
                    </Badge>
                  )}
                </div>
              </div>

              {/* Items grouped by KOT */}
              {tableSentItems.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <ChefHat className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No orders dispatched to kitchen yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select dishes from the Food Menu above, then tap &quot;Send to Kitchen&quot; to create KOT #1.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tableKots.map((kot) => {
                    const kotItems = tableSentItems.filter((i) => i.kot_id === kot.id);
                    if (kotItems.length === 0 && (!kot.items || kot.items.length === 0)) return null;

                    const isKotReady = kot.status === "ready";
                    const isKotServed = kot.status === "served";
                    const isKotPreparing = kot.status === "preparing" || kot.status === "sent";

                    return (
                      <div
                        key={kot.id}
                        className={cn(
                          "rounded-2xl border p-4 transition-all shadow-2xs space-y-3",
                          isKotReady
                            ? "bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800"
                            : isKotServed
                            ? "bg-slate-50/60 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800"
                            : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
                        )}
                      >
                        {/* KOT Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                              {kot.kot_number}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {kot.sent_at ? new Date(kot.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Dispatched"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                isKotReady
                                  ? "success"
                                  : isKotServed
                                  ? "secondary"
                                  : isKotPreparing
                                  ? "warning"
                                  : "default"
                              }
                              className="font-extrabold uppercase text-[10px]"
                            >
                              {isKotReady
                                ? "🟢 Ready to Serve"
                                : isKotServed
                                ? "✓ Served"
                                : isKotPreparing
                                ? "🟠 Preparing"
                                : "Sent"}
                            </Badge>

                            {isKotReady && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkKotServed(kot.id, kot.kot_number)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-7 px-3 shadow-xs cursor-pointer"
                              >
                                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                Serve KOT
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Items in this KOT */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {kotItems.map((item) => {
                            const isItemReady = item.status === "ready";
                            const isItemServed = item.status === "served";

                            return (
                              <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-black text-slate-900 dark:text-slate-100">
                                      {item.quantity}×
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {item.name}
                                    </span>
                                  </div>
                                  {item.special_instructions && (
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 italic pl-5">
                                      Note: {item.special_instructions}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center space-x-3 shrink-0">
                                  <div className="text-right">
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                      {formatCurrency(item.total_price || (item.unit_price * item.quantity))}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {formatCurrency(item.unit_price)} each
                                    </span>
                                  </div>

                                  <div>
                                    {isItemServed ? (
                                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                        ✓ Served
                                      </span>
                                    ) : isItemReady ? (
                                      <Button
                                        size="sm"
                                        onClick={() => handleMarkOrderItemServed(item.id, item.name)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-6 px-2"
                                      >
                                        Serve
                                      </Button>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50">
                                        Preparing
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Fallback for any unassigned sent items in this active dining session */}
                  {(() => {
                    const unassignedItems = tableSentItems.filter(
                      (i) => !i.kot_id || !tableKots.some((k) => k.id === i.kot_id)
                    );
                    if (unassignedItems.length === 0) return null;
                    return (
                      <div className="rounded-2xl border p-4 transition-all shadow-2xs space-y-3 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            Dispatched Dishes
                          </span>
                          <Badge variant="secondary" className="font-extrabold uppercase text-[10px]">
                            Sent
                          </Badge>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {unassignedItems.map((item) => (
                            <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-black text-slate-900 dark:text-slate-100">{item.quantity}×</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                              </div>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {formatCurrency(item.total_price || (item.unit_price * item.quantity))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Running Subtotal & GST Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="text-slate-400 text-[11px]">
                      Running Subtotal: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(subtotal)}</strong> • GST (5%): <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(taxAmount)}</strong>
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Running Total: <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN (lg:col-span-4): Sticky Current Order & Billing    */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* 1. CURRENT DRAFT (Only NEW / UNSENT items) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {activeSession.unsentItems.length > 0 ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300 dark:bg-slate-600"></span>
                      )}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Current Draft
                    </h3>
                    <Badge variant={activeSession.unsentItems.length > 0 ? "primary" : "secondary"} className="text-[9px] uppercase font-black">
                      {activeSession.unsentItems.length > 0 ? "Unsent" : "Draft (0)"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Table {openedTableObj.table_number} • Unsent dishes
                  </p>
                </div>

                {activeSession.unsentItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearDraftItems(openedTableId || undefined)}
                    className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Items List or Empty State */}
              {activeSession.unsentItems.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-1">
                  <UtensilsCrossed className="h-7 w-7 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No unsent items in draft
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tap dishes in the Food Menu on the left to add items to your draft.
                  </p>
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activeSession.unsentItems.map((item) => (
                    <div key={item.id} className="pt-2.5 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {item.menuItem.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeDraftItem(item.id, openedTableId || undefined)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Stepper + Item Total Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => updateDraftQuantity(item.id, -1, openedTableId || undefined)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                            title="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-black text-slate-900 dark:text-slate-100 min-w-[1.25rem] text-center select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDraftQuantity(item.id, 1, openedTableId || undefined)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                            title="Increase"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>

                      {/* Special instructions */}
                      <div>
                        <input
                          type="text"
                          placeholder="Special instruction: e.g. Less spicy..."
                          value={item.instructions || ""}
                          onChange={(e) => updateDraftInstructions(item.id, e.target.value, openedTableId || undefined)}
                          className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Billing Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Draft Items ({totalDraftQty})</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(draftTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Draft GST (5%)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(draftTax)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-baseline font-black text-slate-900 dark:text-slate-100">
                  <span className="text-sm">DRAFT TOTAL</span>
                  <span className="text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(draftGrandTotal)}</span>
                </div>
              </div>

              {/* Primary Action Button: SEND TO KITCHEN */}
              <Button
                onClick={handleOpenConfirmKot}
                disabled={activeSession.unsentItems.length === 0 || isSubmittingKot}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>
                  {isSubmittingKot
                    ? "Sending..."
                    : activeSession.unsentItems.length > 0
                    ? `SEND TO KITCHEN (${totalDraftQty} ITEMS)`
                    : "SEND TO KITCHEN"}
                </span>
              </Button>
            </div>

            {/* 2. Section 9: BILL / SESSION SUMMARY & WORKFLOW */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Table Billing &amp; Workflow
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Stage-by-stage session lifecycle
                  </p>
                </div>
                <Badge variant={isPaid ? "success" : isBillDelivered ? "warning" : isBillReady ? "primary" : isBillRequested ? "warning" : "secondary"}>
                  {isPaid
                    ? "PAID"
                    : isBillDelivered
                    ? "BILL DELIVERED"
                    : isBillReady
                    ? "BILL READY"
                    : isBillRequested
                    ? "BILL REQUESTED"
                    : "DINING"}
                </Badge>
              </div>

              {/* Financial summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Confirmed Dishes</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {activeSession.sentItems.length} dishes ({totalSentQty} items)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Confirmed Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">GST (5%)</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 items-baseline">
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">Cumulative Total</span>
                  <span className="font-black text-base text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Stage-aware Action Panel */}
              <div className="pt-2 space-y-2">
                {isPaid ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Payment Settled
                      </span>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        {activeSession.paymentMethod ? `Paid via ${String(activeSession.paymentMethod).toUpperCase()} • ` : ""}Ready to free table for new guests.
                      </p>
                    </div>

                    <Button
                      onClick={handleCloseTable}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Close Table &amp; Free Table
                    </Button>
                  </div>
                ) : isBillDelivered ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1 text-center">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                        <CheckCheck className="h-4 w-4 text-amber-600" />
                        Bill Given to Customer
                      </span>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Physical bill presented to table. Awaiting payment settlement.
                      </p>
                    </div>

                    <Button
                      onClick={() => setSettlePaymentModalOpen(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-10 shadow-sm"
                    >
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Record Payment
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setBillReceiptModalOpen(true)}
                      className="w-full text-xs text-slate-700 dark:text-slate-300"
                    >
                      <Printer className="h-4 w-4 mr-1.5" />
                      View / Print Receipt
                    </Button>
                  </div>
                ) : isBillReady ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1 text-center">
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1.5">
                        <Receipt className="h-4 w-4 text-purple-600" />
                        Bill Ready ({receiptBillData.billNumber})
                      </span>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400">
                        Invoice prepared by Cashier. Take physical bill to customer table.
                      </p>
                    </div>

                    <Button
                      onClick={handleMarkBillDelivered}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-10 shadow-sm"
                    >
                      <CheckCheck className="h-4 w-4 mr-1.5" />
                      Bill Given to Customer
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setBillReceiptModalOpen(true)}
                      className="w-full text-xs text-slate-700 dark:text-slate-300"
                    >
                      <Printer className="h-4 w-4 mr-1.5" />
                      View / Print Receipt
                    </Button>
                  </div>
                ) : isBillRequested ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1 text-center">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600 animate-spin" />
                        Bill Requested
                      </span>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Cashier station has been notified to prepare the bill invoice.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleCancelBillRequest}
                      className="w-full text-xs text-slate-600 border-slate-300"
                    >
                      Cancel Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={handleOpenBillRequest}
                      disabled={activeSession.unsentItems.length > 0 || activeSession.sentItems.length === 0}
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 font-bold text-xs h-10"
                    >
                      <Receipt className="h-4 w-4 mr-1.5" />
                      Request Final Bill
                    </Button>

                    {activeSession.unsentItems.length > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                        Send current draft to kitchen before requesting final bill.
                      </p>
                    )}
                    {activeSession.sentItems.length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center">
                        Add items and send KOT before requesting bill.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Mobile Floating Bottom Bar */}
        {activeSession.unsentItems.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white p-3 border-t border-slate-800 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Current Order</span>
              </div>
              <p className="text-xs font-black text-slate-100">
                {totalDraftQty} items • {formatCurrency(draftGrandTotal)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMobileOrderDrawerOpen(true)}
                className="text-xs bg-slate-800 text-slate-200 border-slate-700"
              >
                View ({activeSession.unsentItems.length})
              </Button>
              <Button
                size="sm"
                onClick={handleOpenConfirmKot}
                disabled={isSubmittingKot}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Send to Kitchen
              </Button>
            </div>
          </div>
        )}

        {/* 4. Mobile Order Drawer Modal */}
        {mobileOrderDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100">
                    Current Order • Table {openedTableObj.table_number}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {totalDraftQty} items • Total: {formatCurrency(draftGrandTotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOrderDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[50vh]">
                {activeSession.unsentItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.menuItem.name}</span>
                        <div className="text-[11px] text-slate-400">{formatCurrency(item.unitPrice)} each</div>
                      </div>
                      <button
                        onClick={() => removeDraftItem(item.id, openedTableId || undefined)}
                        className="p-1 text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                        <button onClick={() => updateDraftQuantity(item.id, -1, openedTableId || undefined)} className="p-1 text-slate-500">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateDraftQuantity(item.id, 1, openedTableId || undefined)} className="p-1 text-slate-500">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs font-black">{formatCurrency(item.totalPrice)}</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Special instruction (e.g. Less spicy)..."
                      value={item.instructions || ""}
                      onChange={(e) => updateDraftInstructions(item.id, e.target.value, openedTableId || undefined)}
                      className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Subtotal + 5% GST</span>
                  <span className="font-black text-emerald-600 text-sm">{formatCurrency(draftGrandTotal)}</span>
                </div>
                <Button
                  onClick={() => {
                    setMobileOrderDrawerOpen(false);
                    setConfirmKotModalOpen(true);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-11 rounded-2xl"
                >
                  Confirm &amp; Send to Kitchen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Send to Kitchen Confirmation Modal */}
        {confirmKotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Send this order to kitchen?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Table {openedTableObj.table_number} • {activeSession.guestCount} Guests
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Unique Items</span>
                  <span>{activeSession.unsentItems.length} Dishes</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Total Quantity</span>
                  <span>{totalDraftQty} Qty</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-900 dark:text-slate-100 text-sm">
                  <span>Estimated Total</span>
                  <span className="text-emerald-600">{formatCurrency(draftGrandTotal)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                A new KOT will be generated for kitchen stations. Unsent draft items will clear and move to KOT Activity.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmKotModalOpen(false)}
                  disabled={isSubmittingKot}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSendKot}
                  disabled={isSubmittingKot}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 cursor-pointer"
                >
                  {isSubmittingKot ? "Sending KOT..." : "Send to Kitchen"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Section 10: Request Final Bill Confirmation Modal */}
        {billRequestConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Request Final Bill for Table {openedTableObj.table_number}?
                  </h3>
                  <p className="text-xs text-slate-500">
                    {openedTableObj.section_name || "AC Hall"} • {activeSession.guestCount} Guests
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Total Ordered Items</span>
                  <span>{totalSentQty} Qty ({activeSession.sentItems.length} dishes)</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>KOT Tickets Dispatched</span>
                  <span>{totalKots} Ticket{totalKots !== 1 ? "s" : ""}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-900 dark:text-slate-100 text-sm">
                  <span>Current Bill Total</span>
                  <span className="text-emerald-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {preparingCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Note: {preparingCount} item{preparingCount !== 1 ? "s are" : " is"} still preparing in the kitchen. Request bill anyway?</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                The cashier station will receive a high-priority request to print the official invoice.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setBillRequestConfirmOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBillRequest}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 cursor-pointer"
                >
                  Confirm Request Bill
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Settle Payment Modal */}
        <PaymentModal
          isOpen={settlePaymentModalOpen}
          onClose={() => setSettlePaymentModalOpen(false)}
          title={`Settle Payment • Table ${openedTableObj.table_number}`}
          orderNumber={activeSession.orderId}
          billNumber={activeSession.bill?.bill_number}
          tableNumber={openedTableObj.table_number}
          orderType="dine_in"
          subtotal={subtotal}
          taxAmount={taxAmount}
          payableAmount={grandTotal}
          onConfirmPayment={(method, ref) => handleConfirmPayment(method, ref)}
        />

        {/* 8. Bill Receipt Modal */}
        <BillReceiptModal
          isOpen={billReceiptModalOpen}
          onClose={() => setBillReceiptModalOpen(false)}
          bill={receiptBillData}
          showPrintButton={true}
          allowPrintOverride={true}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE A: PRIMARY MY TABLES FLOOR GRID
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Floating feedback alert */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <span className={cn(
            "h-2 w-2 rounded-full",
            actionNotice.type === "success" ? "bg-emerald-400" : actionNotice.type === "warning" ? "bg-amber-400" : "bg-blue-400"
          )} />
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* 1. Header & Operational Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <UtensilsCrossed className="h-6 w-6 mr-2 text-emerald-600" />
              My Tables
            </h1>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
              Waiter Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Seat dining guests, take menu orders, send KOTs to kitchen, and request bills.
          </p>
        </div>

        {/* Section Picker, Search & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Section dropdown */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec === "all" ? "All Floor Sections" : sec}
              </option>
            ))}
          </select>

          {/* Search Table */}
          <div className="w-40 sm:w-48">
            <Input
              placeholder="Search table..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              icon={<Search className="h-3.5 w-3.5" />}
              className="text-xs h-9"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetchTables()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Refresh Table States"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Operational Filter Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: "all", label: "All Tables" },
          { key: "available", label: "Available" },
          { key: "occupied", label: "Occupied" },
          { key: "ordering", label: "Ordering" },
          { key: "preparing", label: "Cooking / KOT" },
          { key: "ready", label: "🟢 Food Ready" },
          { key: "bill_requested", label: "🟠 Bill Requested" },
          { key: "payment", label: "🟣 Payment Settled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all",
              statusFilter === tab.key
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Operational Table Cards Grid */}
      {filteredTables.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <UtensilsCrossed className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No tables found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {tables.length === 0
              ? "No tables have been created yet. Tables configured by the Admin or Manager in Table Management will appear here."
              : "No tables match the selected filters or search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTables.map((tbl) => {
          const session = mounted ? sessions[tbl.id] : undefined;
          const isAvailable = tbl.status === "available";
          const isFoodReady = tbl.status === "food_ready";
          const isBillDelivered = tbl.status === "bill_delivered";
          const isBillReady = tbl.status === "bill_ready";
          const isBillReq = tbl.status === "bill_requested";
          const isPaid = tbl.isPaid || tbl.status === "payment_completed";

          return (
            <div
              key={tbl.id}
              className={cn(
                "rounded-3xl border p-5 transition-all flex flex-col justify-between shadow-xs",
                isAvailable
                  ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                  : isFoodReady
                  ? "bg-emerald-50/80 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                  : isBillDelivered
                  ? "bg-purple-50/80 border-purple-400 dark:bg-purple-950/30 dark:border-purple-700 ring-2 ring-purple-500/20"
                  : isBillReady
                  ? "bg-blue-50/80 border-blue-400 dark:bg-blue-950/30 dark:border-blue-700 ring-2 ring-blue-500/20"
                  : isBillReq
                  ? "bg-amber-50/80 border-amber-400 dark:bg-amber-950/30 dark:border-amber-700 ring-2 ring-amber-500/20"
                  : isPaid
                  ? "bg-emerald-50/80 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                  : "bg-blue-50/40 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60"
              )}
            >
              {/* Card Top: Table Number & Status Badge */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {tbl.table_number}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {tbl.section_name || "AC Hall"}
                    </span>
                  </div>

                  <Badge
                    variant={
                      isAvailable
                        ? "secondary"
                        : isFoodReady
                        ? "success"
                        : isBillDelivered
                        ? "warning"
                        : isBillReady
                        ? "primary"
                        : isBillReq
                        ? "warning"
                        : isPaid
                        ? "success"
                        : "primary"
                    }
                    className="font-extrabold uppercase text-[10px]"
                  >
                    {isAvailable
                      ? "Available"
                      : isFoodReady
                      ? "🟢 Ready"
                      : isBillDelivered
                      ? "📬 Bill Given"
                      : isBillReady
                      ? "📄 Bill Ready"
                      : isBillReq
                      ? "🟠 Bill Req"
                      : isPaid
                      ? "🟣 Paid"
                      : "Occupied"}
                  </Badge>
                </div>

                {/* Card Center Info: Depends on Available vs Seated */}
                {isAvailable ? (
                  <div className="py-6 space-y-1 text-center">
                    <span className="inline-flex items-center text-xs font-semibold text-slate-500">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      Capacity: {tbl.capacity || 4} Guests
                    </span>
                    <p className="text-[11px] text-slate-400">Ready for next dining party</p>
                  </div>
                ) : (
                  <div className="py-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        {session?.guestCount || tbl.capacity || 4} Guests
                      </span>
                      <span className="font-semibold text-slate-400">
                        {tbl.timeSpent || "Just seated"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">
                        {session ? `${session.sentItems.length} items ordered` : "Taking orders"}
                      </span>
                      <span className="font-black text-slate-900 dark:text-slate-100">
                        {tbl.amount ? formatCurrency(tbl.amount) : "₹0"}
                      </span>
                    </div>

                    {session && session.kots.length > 0 && (
                      <div className="text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        KOTs: {session.kots.filter((k) => k.status === "ready").length} Ready • {session.kots.filter((k) => k.status === "preparing").length} Cooking
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Bottom Primary Action: 1 Focused Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {isAvailable ? (
                  <Button
                    onClick={() => handleStartSeating(tbl)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                    Seat Guests
                  </Button>
                ) : isPaid ? (
                  <Button
                    onClick={() => handleOpenTableWorkspace(tbl.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Close Table
                  </Button>
                ) : isBillDelivered ? (
                  <Button
                    onClick={() => handleOpenTableWorkspace(tbl.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    Record Payment
                  </Button>
                ) : isBillReady ? (
                  <Button
                    onClick={() => handleOpenTableWorkspace(tbl.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                    Deliver Bill
                  </Button>
                ) : isFoodReady ? (
                  <Button
                    onClick={() => handleOpenTableWorkspace(tbl.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs animate-pulse"
                  >
                    <Utensils className="h-3.5 w-3.5 mr-1.5" />
                    Serve Ready Food
                  </Button>
                ) : isBillReq ? (
                  <Button
                    onClick={() => handleOpenTableWorkspace(tbl.id)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    <Receipt className="h-3.5 w-3.5 mr-1.5" />
                    View Bill Status
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOpenTableWorkspace(tbl.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
                    Open Table
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* ===================================================================== */}
      {/* SEATING MODAL: Start Table Service Modal                              */}
      {/* ===================================================================== */}
      {seatingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Start Table Service
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Table {seatingTable.table_number} • {seatingTable.section_name || "AC Hall"}
                </p>
              </div>
              <button
                onClick={() => setSeatingTable(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stepper for Guest Count */}
            <div className="space-y-2 text-center py-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Number of Guests
              </span>

              <div className="flex items-center justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setSeatingGuestCount((prev) => Math.max(1, prev - 1))}
                  className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-800 text-lg active:scale-95"
                >
                  <Minus className="h-5 w-5" />
                </button>

                <span className="text-3xl font-black text-slate-900 dark:text-slate-100 w-12 text-center">
                  {seatingGuestCount}
                </span>

                <button
                  type="button"
                  onClick={() => setSeatingGuestCount((prev) => prev + 1)}
                  className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-800 text-lg active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex justify-center space-x-2 pt-2">
                {[1, 2, 4, 6, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSeatingGuestCount(num)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-bold",
                      seatingGuestCount === num
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer Name (Optional)
              </label>
              <Input
                placeholder="Guest name or reference..."
                value={seatingCustomerName}
                onChange={(e) => setSeatingCustomerName(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Optional Special Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Special Seating Notes (Optional)
              </label>
              <Input
                placeholder="e.g. Birthday celebration, High chair needed"
                value={seatingNotes}
                onChange={(e) => setSeatingNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSeatingTable(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSeating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95"
              >
                Start Table
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
