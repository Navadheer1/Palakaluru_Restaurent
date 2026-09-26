import { create } from "zustand";
import { MenuItem, MenuVariant, MenuAddon, OrderItem, KOT, KOTItem, Bill, Payment } from "@/types/database";
import { OrderStatus, KotStatus, PaymentStatus, PaymentMethod } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "./useNotificationStore";
import { useSettingsStore } from "./useSettingsStore";

export interface DraftItem {
  id: string; // unique draft key
  menuItem: MenuItem;
  variant?: MenuVariant;
  addons: MenuAddon[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions: string;
}

export interface SessionHistoryEvent {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  details?: string;
}

export type BillStatus = "not_requested" | "requested" | "generated" | "printed" | "delivered";

export interface ActiveTableSession {
  tableId: string;
  tableNumber: string;
  orderId: string;
  orderNumber: string;
  guestCount: number;
  waiterId?: string;
  waiterName?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  kotStatus: KotStatus;
  billStatus: BillStatus;
  sentItems: OrderItem[];
  kots: KOT[];
  unsentItems: DraftItem[];
  payments: Payment[];
  bill?: Bill | null;
  billRequested?: boolean;
  billRequestedAt?: string;
  billGeneratedAt?: string;
  billPrintedAt?: string;
  billDeliveredAt?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  createdAt: string;
  paidAt?: string;
  kotSentAt?: string;
  customerName?: string;
  notes?: string;
  history?: SessionHistoryEvent[];
}

interface DineInState {
  // Map of active table sessions keyed by tableId
  sessions: Record<string, ActiveTableSession>;
  activeTableId: string | null;
  isSubmittingKot: boolean;
  isGeneratingBill: boolean;
  isProcessingPayment: boolean;
  searchFilter: string;

  // Actions
  setActiveTable: (tableId: string | null) => void;
  setSearchFilter: (query: string) => void;
  initSession: (
    tableId: string,
    tableNumber: string,
    existingOrderId?: string | null,
    guestCount?: number,
    waiterName?: string,
    forceNew?: boolean
  ) => ActiveTableSession;
  setGuestCount: (tableId: string, guestCount: number) => void;
  setWaiterName: (tableId: string, waiterName: string) => void;
  getActiveSession: (tableId?: string) => ActiveTableSession | null;
  addDraftItem: (item: MenuItem, variant?: MenuVariant, addons?: MenuAddon[], instructions?: string, tableId?: string) => void;
  updateDraftQuantity: (draftItemId: string, delta: number, tableId?: string) => void;
  removeDraftItem: (draftItemId: string, tableId?: string) => void;
  updateDraftInstructions: (draftItemId: string, instructions: string, tableId?: string) => void;
  clearDraftItems: (tableId?: string) => void;
  
  // High-level RMS actions for Dine-In Standard
  // 1. Waiter sends KOT (incremental KOTs: KOT #1001, #1002...)
  sendKot: (
    restaurantId: string,
    waiterId?: string | null,
    waiterName?: string,
    tableId?: string
  ) => Promise<{ kot: KOT; session: ActiveTableSession } | null>;

  // 2. Waiter requests bill
  requestBill: (tableId: string, restaurantId?: string) => Promise<boolean>;
  cancelBillRequest: (tableId: string) => void;

  // 3. Admin generates final bill
  generateBill: (restaurantId: string, discountPercent?: number, tableId?: string) => Promise<Bill | null>;

  // 4. Physical Bill status tracking
  markBillPrinted: (tableId: string) => Promise<boolean>;
  markBillDelivered: (tableId: string) => Promise<boolean>;

  // 5. Admin settles payment
  processPayment: (
    restaurantId: string,
    paymentMethod: PaymentMethod,
    reference?: string,
    tableId?: string
  ) => Promise<boolean>;

  // 6. Bill Reopening Protection: Controlled flow for adding items post-bill
  reopenBill: (tableId: string, reason?: string) => Promise<boolean>;

  // 7. Edit adjustments / corrections
  recordPaymentAdjustment: (
    restaurantId: string,
    difference: number,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => Promise<boolean>;

  // 8. Food Serving & Free Table
  markKotServed: (tableId: string, kotId: string) => void;
  markOrderItemServed: (tableId: string, orderItemId: string) => void;
  markTableServed: (restaurantId: string, tableId: string) => Promise<void>;
  closeTableOrder: (tableId: string, restaurantId?: string) => Promise<void>;
  updateKotStatusInSession: (kotId: string, newStatus: KotStatus, tableId?: string) => void;
  syncTableDatabaseSession: (
    tableId: string,
    tableNumber: string,
    dbOrder: any,
    dbKots: any[]
  ) => void;
  
  // Helpers
  getSubtotal: (tableId?: string) => number;
  getTaxAmount: (tableId?: string) => number;
  getDiscountAmount: (discountPercent?: number, tableId?: string) => number;
  getPayableAmount: (discountPercent?: number, tableId?: string) => number;
}

const STORAGE_KEY = "culinacloud_dine_in_sessions_v2";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadSavedSessions(): Record<string, ActiveTableSession> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse errors
  }
  return {};
}

function saveSessions(sessions: Record<string, ActiveTableSession>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage save errors
  }
}

export const useDineInStore = create<DineInState>((set, get) => ({
  sessions: loadSavedSessions(),
  activeTableId: null,
  isSubmittingKot: false,
  isGeneratingBill: false,
  isProcessingPayment: false,
  searchFilter: "",

  setActiveTable: (tableId) => set({ activeTableId: tableId, searchFilter: "" }),

  setSearchFilter: (query) => set({ searchFilter: query }),

  initSession: (tableId, tableNumber, existingOrderId, guestCount = 2, waiterName = "Staff", forceNew = false) => {
    const state = get();
    const existing = state.sessions[tableId];

    // If not forcing a new session, verify that the existing session is active and not finished/closed
    if (
      !forceNew &&
      existing &&
      existing.status !== "completed" &&
      existing.status !== "paid" &&
      (!existingOrderId || existing.orderId === existingOrderId)
    ) {
      set({ activeTableId: tableId });
      return existing;
    }

    const orderId = existingOrderId || generateUUID();
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;

    const newSession: ActiveTableSession = {
      tableId,
      tableNumber,
      orderId,
      orderNumber,
      guestCount,
      waiterName,
      status: "open",
      paymentStatus: "unpaid",
      kotStatus: "not_sent",
      billStatus: "not_requested",
      sentItems: [],
      kots: [],
      unsentItems: [],
      payments: [],
      bill: null,
      billRequested: false,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `h_${Date.now()}_open`,
          timestamp: new Date().toISOString(),
          event: `Table opened (${guestCount} Guests)`,
          actor: waiterName || "Waiter",
        },
      ],
    };

    const updated = { ...state.sessions, [tableId]: newSession };
    saveSessions(updated);
    set({ sessions: updated, activeTableId: tableId });
    return newSession;
  },

  setGuestCount: (tableId, guestCount) => {
    const session = get().sessions[tableId];
    if (!session) return;
    const updated = { ...get().sessions, [tableId]: { ...session, guestCount } };
    saveSessions(updated);
    set({ sessions: updated });
  },

  setWaiterName: (tableId, waiterName) => {
    const session = get().sessions[tableId];
    if (!session) return;
    const updated = { ...get().sessions, [tableId]: { ...session, waiterName } };
    saveSessions(updated);
    set({ sessions: updated });
  },

  getActiveSession: (tableId?: string) => {
    const { activeTableId, sessions } = get();
    const targetId = tableId || activeTableId;
    if (!targetId) return null;
    return sessions[targetId] || null;
  },

  addDraftItem: (menuItem, variant, addons = [], instructions = "", tableId?: string) => {
    const targetId = tableId || get().activeTableId;
    if (!targetId) return;
    let session = get().sessions[targetId];
    if (!session) {
      session = get().initSession(targetId, targetId);
    }
    if (!session) return;

    const variantId = variant ? variant.id : "base";
    const addonIds = addons.map((a) => a.id).sort().join("-");
    const draftItemId = `${menuItem.id}-${variantId}-${addonIds}`;

    const unitPrice =
      (variant ? Number(variant.price) : Number(menuItem.base_price)) +
      addons.reduce((sum, a) => sum + Number(a.price), 0);

    const existingIndex = session.unsentItems.findIndex((i) => i.id === draftItemId);
    let updatedUnsent: DraftItem[];

    if (existingIndex > -1) {
      updatedUnsent = [...session.unsentItems];
      const existing = updatedUnsent[existingIndex];
      const newQty = existing.quantity + 1;
      updatedUnsent[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: newQty * existing.unitPrice,
      };
    } else {
      const newItem: DraftItem = {
        id: draftItemId,
        menuItem,
        variant,
        addons,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        instructions,
      };
      updatedUnsent = [...session.unsentItems, newItem];
    }

    const updatedSession = { ...session, unsentItems: updatedUnsent };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  updateDraftQuantity: (draftItemId, delta, tableId?: string) => {
    const targetId = tableId || get().activeTableId;
    if (!targetId) return;
    const session = get().sessions[targetId];
    if (!session) return;

    const updatedUnsent = session.unsentItems
      .map((item) => {
        if (item.id === draftItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter(Boolean) as DraftItem[];

    const updatedSession = { ...session, unsentItems: updatedUnsent };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  removeDraftItem: (draftItemId, tableId?: string) => {
    const targetId = tableId || get().activeTableId;
    if (!targetId) return;
    const session = get().sessions[targetId];
    if (!session) return;

    const updatedUnsent = session.unsentItems.filter((i) => i.id !== draftItemId);
    const updatedSession = { ...session, unsentItems: updatedUnsent };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  updateDraftInstructions: (draftItemId, instructions, tableId?: string) => {
    const targetId = tableId || get().activeTableId;
    if (!targetId) return;
    const session = get().sessions[targetId];
    if (!session) return;

    const updatedUnsent = session.unsentItems.map((item) => {
      if (item.id === draftItemId) {
        return { ...item, instructions };
      }
      return item;
    });

    const updatedSession = { ...session, unsentItems: updatedUnsent };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  clearDraftItems: (tableId?: string) => {
    const targetId = (typeof tableId === "string" ? tableId : null) || get().activeTableId;
    if (!targetId) return;
    const session = get().sessions[targetId];
    if (!session) return;

    const updatedSession = { ...session, unsentItems: [] };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  // 1. DINE-IN MULTI-KOT DISPATCH: Waiter or Staff sends incremental KOT to Kitchen
  sendKot: async (restaurantId, waiterId, waiterName, tableId?: string) => {
    const state = get();
    if (state.isSubmittingKot) return null;

    const session = state.getActiveSession(tableId);
    if (!session) return null;
    const itemsToSend = session.unsentItems.length > 0 ? session.unsentItems : [];
    if (itemsToSend.length === 0) {
      return null;
    }

    set({ isSubmittingKot: true });

    try {
      const kotCount = session.kots.length + 1;
      const kotNumber = `KOT #${1000 + kotCount}`;
      const kotId = generateUUID();
      const nowIso = new Date().toISOString();

      const kotItems: KOTItem[] = itemsToSend.map((draft) => ({
        id: generateUUID(),
        kot_id: kotId,
        order_item_id: generateUUID(),
        name: draft.menuItem.name + (draft.variant ? ` (${draft.variant.name})` : ""),
        quantity: draft.quantity,
        instructions: draft.instructions || null,
        status: "pending",
      }));

      const newKot: KOT = {
        id: kotId,
        kot_number: kotNumber,
        order_id: session.orderId,
        restaurant_id: restaurantId,
        branch_id: "00000000-0000-0000-0000-000000000001",
        table_id: session.tableId,
        order_type: "dine_in",
        waiter_id: waiterId || session.waiterId || null,
        status: "sent",
        notes: session.notes || null,
        sent_at: nowIso,
        created_at: nowIso,
        items: kotItems,
      };

      const newOrderItems: OrderItem[] = itemsToSend.map((draft, idx) => ({
        id: kotItems[idx].order_item_id,
        order_id: session.orderId,
        menu_item_id: draft.menuItem.id,
        variant_id: draft.variant?.id || null,
        name: draft.menuItem.name + (draft.variant ? ` (${draft.variant.name})` : ""),
        quantity: draft.quantity,
        unit_price: draft.unitPrice,
        total_price: draft.totalPrice,
        special_instructions: draft.instructions || null,
        status: "pending",
        kot_id: kotId,
        kot_number: kotNumber,
      }));

      const updatedSentItems = [...session.sentItems, ...newOrderItems];
      const updatedKots = [...session.kots, newKot];

      const kotHistoryEvent: SessionHistoryEvent = {
        id: `h_${Date.now()}_kot_${kotCount}`,
        timestamp: nowIso,
        event: `${kotNumber} dispatched to Kitchen (${itemsToSend.length} dishes)`,
        actor: waiterName || session.waiterName || "Waiter",
        details: itemsToSend.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(", "),
      };

      const updatedSession: ActiveTableSession = {
        ...session,
        status: "confirmed",
        kotStatus: "sent",
        kotSentAt: nowIso,
        billStatus: "not_requested",
        billRequested: false, // Adding items resets bill request
        sentItems: updatedSentItems,
        kots: updatedKots,
        unsentItems: [], // Cleared so next add-items only sends new items!
        waiterId: waiterId || session.waiterId,
        waiterName: waiterName || session.waiterName,
        history: [...(session.history || []), kotHistoryEvent],
      };

      const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
      saveSessions(updatedSessions);
      set({ sessions: updatedSessions });

      try {
        const supabase = createClient();
        await supabase.from("orders").upsert({
          id: session.orderId,
          order_number: session.orderNumber,
          restaurant_id: restaurantId,
          table_id: session.tableId,
          order_type: "dine_in",
          status: "confirmed",
          kot_status: "sent",
          kot_sent_at: nowIso,
          subtotal: updatedSentItems.reduce((s, i) => s + i.total_price, 0),
          total_amount: updatedSentItems.reduce((s, i) => s + i.total_price, 0) * 1.05,
        });

        await supabase.from("kot").insert({
          id: kotId,
          kot_number: kotNumber,
          order_id: session.orderId,
          restaurant_id: restaurantId,
          table_id: session.tableId,
          order_type: "dine_in",
          status: "sent",
          notes: `Table ${session.tableNumber}`,
          sent_at: nowIso,
        });

        for (const ki of kotItems) {
          await supabase.from("kot_items").insert({
            id: ki.id,
            kot_id: kotId,
            order_item_id: ki.order_item_id,
            name: ki.name,
            quantity: ki.quantity,
            instructions: ki.instructions,
            status: "pending",
          });
        }

        // Persist order_items to Supabase
        for (const oi of newOrderItems) {
          await supabase.from("order_items").insert({
            id: oi.id,
            order_id: oi.order_id,
            menu_item_id: oi.menu_item_id,
            variant_id: oi.variant_id,
            name: oi.name,
            quantity: oi.quantity,
            unit_price: oi.unit_price,
            total_price: oi.total_price,
            special_instructions: oi.special_instructions,
            status: "pending",
          });
        }

        await supabase
          .from("restaurant_tables")
          .update({
            status: "occupied",
            current_order_id: session.orderId,
          })
          .eq("id", session.tableId);
      } catch {
        // Fallback
      }

      return { kot: newKot, session: updatedSession };
    } finally {
      set({ isSubmittingKot: false });
    }
  },

  // 2. BILL REQUEST: Waiter signals that customer asked for the bill
  requestBill: async (tableId, restaurantId) => {
    const session = get().sessions[tableId];
    if (!session) return false;

    const nowIso = new Date().toISOString();
    const billReqHistory: SessionHistoryEvent = {
      id: `h_${Date.now()}_bill_req`,
      timestamp: nowIso,
      event: "Customer requested bill settlement",
      actor: session.waiterName || "Waiter",
    };

    const updatedSession: ActiveTableSession = {
      ...session,
      billRequested: true,
      billRequestedAt: nowIso,
      billStatus: "requested",
      status: "bill_requested",
      history: [...(session.history || []), billReqHistory],
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });

    // Send realtime notification
    useNotificationStore.getState().addNotification({
      type: "bill_requested",
      title: `Table ${session.tableNumber} Requested Bill`,
      message: `${session.waiterName || "Waiter"} requested bill for Table ${session.tableNumber}.`,
      tableNumber: session.tableNumber,
    });

    try {
      const supabase = createClient();
      await supabase
        .from("orders")
        .update({ status: "bill_requested" })
        .eq("id", session.orderId);
      await supabase
        .from("restaurant_tables")
        .update({ status: "bill_requested" })
        .eq("id", tableId);
    } catch {
      // Fallback
    }

    return true;
  },

  cancelBillRequest: (tableId) => {
    const session = get().sessions[tableId];
    if (!session) return;
    const cancelHistory: SessionHistoryEvent = {
      id: `h_${Date.now()}_bill_cancel`,
      timestamp: new Date().toISOString(),
      event: "Bill request cancelled by Waiter",
      actor: session.waiterName || "Waiter",
    };
    const updatedSession: ActiveTableSession = {
      ...session,
      billRequested: false,
      billRequestedAt: undefined,
      billStatus: "not_requested",
      status: session.sentItems.length > 0 ? "confirmed" : "open",
      history: [...(session.history || []), cancelHistory],
    };
    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  // 3. GENERATE FINAL BILL: Admin/Cashier creates invoice consolidating all KOTs
  generateBill: async (restaurantId, discountPercent = 0, tableId?: string) => {
    const state = get();
    if (state.isGeneratingBill) return null;

    const session = state.getActiveSession(tableId);
    if (!session) return null;

    set({ isGeneratingBill: true });

    try {
      const subtotal = state.getSubtotal(session.tableId);
      const discountAmount = (subtotal * discountPercent) / 100;
      const taxAmount = ((subtotal - discountAmount) * 5) / 100;
      const finalTotal = Math.round(subtotal - discountAmount + taxAmount);

      const billNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const billId = generateUUID();
      const nowIso = new Date().toISOString();

      const newBill: Bill = {
        id: billId,
        bill_number: billNumber,
        order_id: session.orderId,
        restaurant_id: restaurantId,
        branch_id: null,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        service_charge: 0,
        final_total: finalTotal,
        payment_status: "pending",
        created_by: null,
        created_at: nowIso,
      };

      const billGenHistory: SessionHistoryEvent = {
        id: `h_${Date.now()}_bill_gen`,
        timestamp: nowIso,
        event: `Final Bill ${billNumber} generated for ₹${finalTotal}`,
        actor: "Admin / Cashier",
      };

      const updatedSession: ActiveTableSession = {
        ...session,
        bill: newBill,
        billStatus: "generated",
        billGeneratedAt: nowIso,
        status: "bill_generated",
        paymentStatus: "pending",
        history: [...(session.history || []), billGenHistory],
      };

      const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
      saveSessions(updatedSessions);
      set({ sessions: updatedSessions });

      // Notify Waiter in realtime
      useNotificationStore.getState().addNotification({
        type: "bill_ready",
        title: `Bill Ready: Table ${session.tableNumber}`,
        message: `Final Bill #${billNumber} generated for ₹${finalTotal}. Payment pending.`,
        tableNumber: session.tableNumber,
      });

      try {
        const supabase = createClient();
        await supabase.from("bills").insert({
          id: billId,
          bill_number: billNumber,
          order_id: session.orderId,
          restaurant_id: restaurantId,
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          final_total: finalTotal,
          payment_status: "pending",
        });

        await supabase
          .from("orders")
          .update({
            status: "bill_generated",
            total_amount: finalTotal,
          })
          .eq("id", session.orderId);

        await supabase
          .from("restaurant_tables")
          .update({
            status: "billing",
          })
          .eq("id", session.tableId);
      } catch {
        // Fallback
      }

      return newBill;
    } finally {
      set({ isGeneratingBill: false });
    }
  },

  // 4. Physical Bill status tracking
  markBillPrinted: async (tableId) => {
    const session = get().sessions[tableId];
    if (!session) return false;

    const nowIso = new Date().toISOString();
    const printHistory: SessionHistoryEvent = {
      id: `h_${Date.now()}_bill_printed`,
      timestamp: nowIso,
      event: `Final Bill ${session.bill?.bill_number || ""} printed`,
      actor: "Admin / Cashier",
    };

    const updatedSession: ActiveTableSession = {
      ...session,
      billStatus: "printed",
      billPrintedAt: nowIso,
      history: [...(session.history || []), printHistory],
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
    return true;
  },

  markBillDelivered: async (tableId) => {
    const session = get().sessions[tableId];
    if (!session) return false;

    const nowIso = new Date().toISOString();
    const deliverHistory: SessionHistoryEvent = {
      id: `h_${Date.now()}_bill_delivered`,
      timestamp: nowIso,
      event: `Bill ${session.bill?.bill_number || ""} given to customer table`,
      actor: session.waiterName || "Waiter",
    };

    const updatedSession: ActiveTableSession = {
      ...session,
      billStatus: "delivered",
      billDeliveredAt: nowIso,
      status: "bill_delivered" as OrderStatus,
      paymentStatus: "pending", // customer has physical bill, payment pending
      history: [...(session.history || []), deliverHistory],
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
    return true;
  },

  // 5. SETTLE PAYMENT: Records payment confirmation; table stays in state until waiter closes table
  processPayment: async (restaurantId, paymentMethod, reference, tableId?: string) => {
    const state = get();
    if (state.isProcessingPayment) return false;

    const session = state.getActiveSession(tableId);
    if (!session) return false;

    set({ isProcessingPayment: true });

    try {
      const amount = session.bill ? session.bill.final_total : state.getPayableAmount(0, session.tableId);
      const paymentId = generateUUID();
      const nowIso = new Date().toISOString();

      const newPayment: Payment = {
        id: paymentId,
        order_id: session.orderId,
        restaurant_id: restaurantId,
        branch_id: "",
        amount,
        payment_method: paymentMethod,
        status: "paid",
        payment_type: "initial",
        transaction_reference: reference || null,
        processed_by: null,
        created_at: nowIso,
      };

      const payHistory: SessionHistoryEvent = {
        id: `h_${Date.now()}_paid`,
        timestamp: nowIso,
        event: `Payment of ₹${amount} received via ${paymentMethod.toUpperCase()}`,
        actor: "Cashier / Admin",
        details: reference ? `Ref: ${reference}` : undefined,
      };

      // Keep session alive with status PAID so waiter sees payment confirmation and can close table
      const updatedSession: ActiveTableSession = {
        ...session,
        paymentStatus: "paid",
        status: "paid",
        paidAt: nowIso,
        paymentMethod,
        paymentReference: reference || undefined,
        payments: [...session.payments, newPayment],
        history: [...(session.history || []), payHistory],
      };

      const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
      saveSessions(updatedSessions);
      set({ sessions: updatedSessions });

      // Notify Waiter and Staff that payment is completed
      useNotificationStore.getState().addNotification({
        type: "payment_completed",
        title: `Table ${session.tableNumber} Paid`,
        message: `Payment of ₹${amount} settled via ${paymentMethod.toUpperCase()}. Table ready to close.`,
        tableNumber: session.tableNumber,
      });

      try {
        const supabase = createClient();
        await supabase.from("orders").upsert({
          id: session.orderId,
          order_number: session.orderNumber,
          restaurant_id: restaurantId,
          table_id: session.tableId,
          order_type: "dine_in",
          status: "paid",
          payment_status: "paid",
          total_amount: amount,
          paid_at: nowIso,
        });

        await supabase.from("payments").insert({
          id: paymentId,
          order_id: session.orderId,
          restaurant_id: restaurantId,
          amount,
          payment_method: paymentMethod,
          status: "paid",
          payment_type: "initial",
          transaction_reference: reference || null,
        });

        if (session.bill?.id) {
          await supabase
            .from("bills")
            .update({ payment_status: "paid" })
            .eq("id", session.bill.id);
        }

        await supabase
          .from("restaurant_tables")
          .update({
            status: "billing",
          })
          .eq("id", session.tableId);
      } catch {
        // Fallback
      }

      return true;
    } finally {
      set({ isProcessingPayment: false });
    }
  },

  reopenBill: async (tableId, reason = "Customer ordered additional items") => {
    const session = get().sessions[tableId];
    if (!session || !session.bill) return false;

    const nowIso = new Date().toISOString();
    const reopenHistory: SessionHistoryEvent = {
      id: `h_${Date.now()}_reopen`,
      timestamp: nowIso,
      event: `Bill reopened for changes: ${reason}`,
      actor: session.waiterName || "Staff",
    };

    const updatedSession: ActiveTableSession = {
      ...session,
      bill: null,
      status: "confirmed",
      paymentStatus: "unpaid",
      billRequested: false,
      history: [...(session.history || []), reopenHistory],
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });

    try {
      const supabase = createClient();
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", session.orderId);
      await supabase
        .from("restaurant_tables")
        .update({ status: "occupied" })
        .eq("id", tableId);
    } catch {
      // Fallback
    }

    return true;
  },

  recordPaymentAdjustment: async (restaurantId, difference, paymentMethod, reference) => {
    const state = get();
    const session = state.getActiveSession();
    if (!session) return false;

    const nowIso = new Date().toISOString();
    const paymentId = `pay_adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const isAdditional = difference > 0;
    const adjustmentAmount = Math.abs(difference);

    const adjPayment: Payment = {
      id: paymentId,
      order_id: session.orderId,
      restaurant_id: restaurantId,
      branch_id: "",
      amount: adjustmentAmount,
      payment_method: paymentMethod,
      status: isAdditional ? "paid" : "refunded",
      payment_type: isAdditional ? "additional" : "refund",
      transaction_reference: reference || (isAdditional ? `Additional charge (+₹${adjustmentAmount})` : `Refund (-₹${adjustmentAmount})`),
      processed_by: null,
      created_at: nowIso,
    };

    const updatedSession: ActiveTableSession = {
      ...session,
      paymentStatus: "payment_adjusted",
      payments: [...session.payments, adjPayment],
    };

    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });

    try {
      const supabase = createClient();
      await supabase.from("payments").insert({
        id: paymentId,
        order_id: session.orderId,
        restaurant_id: restaurantId,
        amount: adjustmentAmount,
        payment_method: paymentMethod,
        status: isAdditional ? "paid" : "refunded",
        payment_type: isAdditional ? "additional" : "refund",
        transaction_reference: adjPayment.transaction_reference,
      });
    } catch {
      // Fallback
    }

    return true;
  },

  // 8. Food Serving & Item Tracking
  markKotServed: (tableId, kotId) => {
    const session = get().sessions[tableId];
    if (!session) return;

    const updatedKots = session.kots.map((k) => (k.id === kotId ? { ...k, status: "served" as KotStatus } : k));
    const updatedSentItems = session.sentItems.map((item) => {
      if (item.kot_id === kotId) {
        return { ...item, status: "served" as OrderItem["status"] };
      }
      return item;
    });

    const anyReady = updatedKots.some((k) => k.status === "ready");
    const anyPreparing = updatedKots.some((k) => k.status === "preparing");
    const allServed = updatedKots.length > 0 && updatedKots.every((k) => k.status === "served");
    const newKotStatus: KotStatus = anyReady ? "ready" : anyPreparing ? "preparing" : allServed ? "served" : "sent";

    const targetKot = session.kots.find((k) => k.id === kotId);
    const kotServedHistory: SessionHistoryEvent = {
      id: `h_${Date.now()}_kot_served`,
      timestamp: new Date().toISOString(),
      event: `${targetKot?.kot_number || "KOT"} marked as SERVED to table`,
      actor: session.waiterName || "Waiter",
    };

    const updatedSession: ActiveTableSession = {
      ...session,
      kotStatus: newKotStatus,
      kots: updatedKots,
      sentItems: updatedSentItems,
      history: [...(session.history || []), kotServedHistory],
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  markOrderItemServed: (tableId, orderItemId) => {
    const session = get().sessions[tableId];
    if (!session) return;

    const updatedSentItems = session.sentItems.map((item) =>
      item.id === orderItemId ? { ...item, status: "served" as OrderItem["status"] } : item
    );

    const targetItem = session.sentItems.find((i) => i.id === orderItemId);
    let updatedKots = session.kots;
    if (targetItem?.kot_id) {
      const kotItems = updatedSentItems.filter((i) => i.kot_id === targetItem.kot_id);
      if (kotItems.length > 0 && kotItems.every((i) => i.status === "served")) {
        updatedKots = session.kots.map((k) =>
          k.id === targetItem.kot_id ? { ...k, status: "served" as KotStatus } : k
        );
      }
    }

    const anyReady = updatedKots.some((k) => k.status === "ready");
    const anyPreparing = updatedKots.some((k) => k.status === "preparing");
    const allServed = updatedKots.length > 0 && updatedKots.every((k) => k.status === "served");

    const updatedSession: ActiveTableSession = {
      ...session,
      kotStatus: anyReady ? "ready" : anyPreparing ? "preparing" : allServed ? "served" : session.kotStatus,
      kots: updatedKots,
      sentItems: updatedSentItems,
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  markTableServed: async (restaurantId, tableId) => {
    const session = get().sessions[tableId];
    if (!session) return;

    const updatedSentItems = session.sentItems.map((item) => ({ ...item, status: "served" as OrderItem["status"] }));
    const updatedKots = session.kots.map((k) => ({ ...k, status: "served" as KotStatus }));

    const updatedSession: ActiveTableSession = {
      ...session,
      status: "served",
      kotStatus: "served",
      sentItems: updatedSentItems,
      kots: updatedKots,
    };

    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });

    try {
      const supabase = createClient();
      await supabase
        .from("orders")
        .update({ status: "served" })
        .eq("id", session.orderId);
    } catch {
      // Fallback
    }
  },

  closeTableOrder: async (tableId, restaurantId) => {
    const session = get().sessions[tableId];
    if (session && restaurantId) {
      try {
        const supabase = createClient();
        await supabase
          .from("orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", session.orderId);

        await supabase
          .from("restaurant_tables")
          .update({
            status: "available",
            current_order_id: null,
          })
          .eq("id", tableId);
      } catch {
        // Fallback
      }
    }

    const { sessions } = get();
    const updated = { ...sessions };
    delete updated[tableId];
    saveSessions(updated);
    set({ sessions: updated, activeTableId: null });
  },

  updateKotStatusInSession: (kotId, newStatus, tableId?: string) => {
    const { sessions } = get();
    let changed = false;
    const updatedSessions = { ...sessions };

    for (const tid in updatedSessions) {
      if (tableId && tid !== tableId) continue;
      const sess = updatedSessions[tid];
      if (sess.kots.some((k) => k.id === kotId)) {
        const updatedKots = sess.kots.map((k) => (k.id === kotId ? { ...k, status: newStatus } : k));

        // Cascade status to item level
        const itemStatus: OrderItem["status"] =
          newStatus === "ready"
            ? "ready"
            : newStatus === "served"
            ? "served"
            : newStatus === "preparing"
            ? "preparing"
            : "pending";

        const updatedSentItems = sess.sentItems.map((item) => {
          if (item.kot_id === kotId) {
            return { ...item, status: itemStatus };
          }
          return item;
        });

        const anyReady = updatedKots.some((k) => k.status === "ready");
        const anyPreparing = updatedKots.some((k) => k.status === "preparing");
        const allServed = updatedKots.length > 0 && updatedKots.every((k) => k.status === "served");
        const newKotStatus: KotStatus = anyReady ? "ready" : anyPreparing ? "preparing" : allServed ? "served" : "sent";

        updatedSessions[tid] = {
          ...sess,
          kotStatus: newKotStatus,
          status: anyReady ? "ready" : anyPreparing ? "preparing" : allServed ? "served" : sess.status,
          kots: updatedKots,
          sentItems: updatedSentItems,
        };
        changed = true;

        if (newStatus === "ready") {
          useNotificationStore.getState().addNotification({
            type: "kot_ready",
            title: `Table ${sess.tableNumber} Food Ready`,
            message: `Dishes for ${kotId} are plated and ready to serve!`,
            tableNumber: sess.tableNumber,
          });
        }
      }
    }

    if (changed) {
      saveSessions(updatedSessions);
      set({ sessions: updatedSessions });
    }
  },

  syncTableDatabaseSession: (tableId, tableNumber, dbOrder, dbKots) => {
    if (!tableId) return;
    const state = get();
    const existingSession = state.sessions[tableId];

    if (!dbOrder || dbOrder.status === "completed" || dbOrder.status === "cancelled") {
      if (existingSession && (existingSession.status === "completed" || existingSession.status === "paid")) {
        const updated = { ...state.sessions };
        delete updated[tableId];
        saveSessions(updated);
        set({ sessions: updated });
      }
      return;
    }

    const orderId = dbOrder.id;
    const orderNumber = dbOrder.order_number || `ORD-${tableNumber}`;

    const tableKots: KOT[] = (dbKots || [])
      .filter((k) => (k.table_id === tableId || (k.order_id && k.order_id === orderId)))
      .map((k) => ({
        id: k.id,
        kot_number: k.kot_number || "KOT",
        order_id: orderId,
        restaurant_id: k.restaurant_id || dbOrder.restaurant_id,
        branch_id: k.branch_id || "",
        table_id: tableId,
        order_type: "dine_in",
        waiter_id: k.waiter_id || dbOrder.waiter_id || null,
        status: (k.status || "sent") as KotStatus,
        notes: k.notes || null,
        sent_at: k.sent_at || k.created_at || new Date().toISOString(),
        created_at: k.created_at || new Date().toISOString(),
        items: (k.items || []).map((ki: any) => ({
          id: ki.id,
          kot_id: k.id,
          order_item_id: ki.order_item_id || ki.id,
          name: ki.name,
          quantity: ki.quantity,
          instructions: ki.instructions || null,
          status: ki.status || "pending",
        })),
      }));

    let sentItems: OrderItem[] = [];
    const rawItems = dbOrder.order_items || dbOrder.items;
    if (rawItems && Array.isArray(rawItems) && rawItems.length > 0) {
      sentItems = rawItems
        .filter((oi: any) => (!oi.order_id || oi.order_id === orderId))
        .map((oi: any) => ({
          id: oi.id,
          order_id: orderId,
          menu_item_id: oi.menu_item_id || "",
          variant_id: oi.variant_id || null,
          name: oi.name || "Item",
          quantity: oi.quantity || 1,
          unit_price: Number(oi.unit_price) || 0,
          total_price: Number(oi.total_price) || (Number(oi.unit_price || 0) * Number(oi.quantity || 1)),
          special_instructions: oi.special_instructions || null,
          status: oi.status || "pending",
          kot_id: oi.kot_id || undefined,
          kot_number: oi.kot_number || undefined,
        }));
    } else {
      tableKots.forEach((k) => {
        k.items?.forEach((ki) => {
          sentItems.push({
            id: ki.order_item_id || ki.id,
            order_id: orderId,
            menu_item_id: "",
            variant_id: null,
            name: ki.name,
            quantity: ki.quantity,
            unit_price: 0,
            total_price: 0,
            special_instructions: ki.instructions,
            status: ki.status as any,
            kot_id: k.id,
            kot_number: k.kot_number,
          });
        });
      });
    }

    const unsentItems = (existingSession && existingSession.orderId === orderId) ? existingSession.unsentItems : [];

    const syncedSession: ActiveTableSession = {
      tableId,
      tableNumber,
      orderId,
      orderNumber,
      guestCount: dbOrder.guest_count || existingSession?.guestCount || 2,
      waiterName: dbOrder.waiter_name || existingSession?.waiterName || "Staff",
      waiterId: dbOrder.waiter_id || existingSession?.waiterId || null,
      status: (dbOrder.status || "confirmed") as OrderStatus,
      paymentStatus: (dbOrder.payment_status || "unpaid") as any,
      kotStatus: (dbOrder.kot_status || (tableKots.length > 0 ? tableKots[tableKots.length - 1].status : "sent")) as KotStatus,
      billStatus: dbOrder.status === "bill_requested" ? "requested" : dbOrder.status === "bill_generated" ? "generated" : existingSession?.billStatus || "not_requested",
      bill: existingSession?.bill || null,
      billRequested: dbOrder.status === "bill_requested" || existingSession?.billRequested || false,
      sentItems,
      kots: tableKots,
      unsentItems,
      payments: existingSession?.payments || [],
      createdAt: dbOrder.created_at || existingSession?.createdAt || new Date().toISOString(),
      history: existingSession?.history || [],
    };

    const updated = { ...state.sessions, [tableId]: syncedSession };
    saveSessions(updated);
    set({ sessions: updated });
  },

  getSubtotal: (tableId?: string) => {
    const session = get().getActiveSession(tableId);
    if (!session) return 0;
    const currentOrderId = session.orderId;
    const sentTotal = session.sentItems
      .filter((item) => !item.order_id || item.order_id === currentOrderId)
      .reduce((sum, item) => sum + item.total_price, 0);
    const draftTotal = session.unsentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return sentTotal + draftTotal;
  },

  getDiscountAmount: (discountPercent = 0, tableId?: string) => {
    const subtotal = get().getSubtotal(tableId);
    return (subtotal * discountPercent) / 100;
  },

  getTaxAmount: (tableId?: string) => {
    const subtotal = get().getSubtotal(tableId);
    const settings = useSettingsStore.getState();
    if (!settings.taxes.taxesEnabled) return 0;
    const rate = settings.taxes.defaultTaxRate ?? 5.0;
    return (subtotal * rate) / 100;
  },

  getPayableAmount: (discountPercent = 0, tableId?: string) => {
    const subtotal = get().getSubtotal(tableId);
    const discount = get().getDiscountAmount(discountPercent, tableId);
    const tax = get().getTaxAmount(tableId);
    const rawTotal = subtotal - discount + tax;
    const settings = useSettingsStore.getState();
    const rule = settings.billing.roundingRule;
    if (rule === "nearest_1") return Math.max(0, Math.round(rawTotal));
    if (rule === "nearest_5") return Math.max(0, Math.round(rawTotal / 5) * 5);
    if (rule === "round_up") return Math.max(0, Math.ceil(rawTotal));
    return Math.max(0, Number(rawTotal.toFixed(settings.billing.decimalPrecision ?? 2)));
  },
}));
