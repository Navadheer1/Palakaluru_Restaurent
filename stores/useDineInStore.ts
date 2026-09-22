import { create } from "zustand";
import { MenuItem, MenuVariant, MenuAddon, OrderItem, KOT, KOTItem, Bill, Payment } from "@/types/database";
import { OrderStatus, KotStatus, PaymentStatus, PaymentMethod } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "./useNotificationStore";

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
  sentItems: OrderItem[];
  kots: KOT[];
  unsentItems: DraftItem[];
  payments: Payment[];
  bill?: Bill | null;
  billRequested?: boolean;
  billRequestedAt?: string;
  createdAt: string;
  paidAt?: string;
  kotSentAt?: string;
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
    waiterName?: string
  ) => ActiveTableSession;
  setGuestCount: (tableId: string, guestCount: number) => void;
  setWaiterName: (tableId: string, waiterName: string) => void;
  getActiveSession: () => ActiveTableSession | null;
  addDraftItem: (item: MenuItem, variant?: MenuVariant, addons?: MenuAddon[], instructions?: string) => void;
  updateDraftQuantity: (draftItemId: string, delta: number) => void;
  removeDraftItem: (draftItemId: string) => void;
  clearDraftItems: () => void;
  
  // High-level RMS actions for Dine-In Standard
  // 1. Waiter sends KOT (incremental KOTs: KOT #101, #102...)
  sendKot: (
    restaurantId: string,
    waiterId?: string | null,
    waiterName?: string
  ) => Promise<{ kot: KOT; session: ActiveTableSession } | null>;

  // 2. Waiter requests bill
  requestBill: (tableId: string, restaurantId?: string) => Promise<boolean>;
  cancelBillRequest: (tableId: string) => void;

  // 3. Admin generates final bill
  generateBill: (restaurantId: string, discountPercent?: number) => Promise<Bill | null>;

  // 4. Admin settles payment & frees table
  processPayment: (
    restaurantId: string,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => Promise<boolean>;

  // 5. Bill Reopening Protection: Controlled flow for adding items post-bill
  reopenBill: (tableId: string, reason?: string) => Promise<boolean>;

  // 6. Edit adjustments / corrections
  recordPaymentAdjustment: (
    restaurantId: string,
    difference: number,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => Promise<boolean>;

  // 6. Mark served & Free Table
  markTableServed: (restaurantId: string, tableId: string) => Promise<void>;
  closeTableOrder: (tableId: string, restaurantId?: string) => Promise<void>;
  updateKotStatusInSession: (kotId: string, newStatus: KotStatus) => void;
  
  // Helpers
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: (discountPercent?: number) => number;
  getPayableAmount: (discountPercent?: number) => number;
}

const STORAGE_KEY = "culinacloud_dine_in_sessions_v2";

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

  initSession: (tableId, tableNumber, existingOrderId, guestCount = 2, waiterName = "Staff") => {
    const state = get();
    if (state.sessions[tableId]) {
      set({ activeTableId: tableId });
      return state.sessions[tableId];
    }

    const orderId = existingOrderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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

  getActiveSession: () => {
    const { activeTableId, sessions } = get();
    if (!activeTableId) return null;
    return sessions[activeTableId] || null;
  },

  addDraftItem: (menuItem, variant, addons = [], instructions = "") => {
    const session = get().getActiveSession();
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

  updateDraftQuantity: (draftItemId, delta) => {
    const session = get().getActiveSession();
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

  removeDraftItem: (draftItemId) => {
    const session = get().getActiveSession();
    if (!session) return;

    const updatedUnsent = session.unsentItems.filter((i) => i.id !== draftItemId);
    const updatedSession = { ...session, unsentItems: updatedUnsent };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  clearDraftItems: () => {
    const session = get().getActiveSession();
    if (!session) return;

    const updatedSession = { ...session, unsentItems: [] };
    const updatedSessions = { ...get().sessions, [session.tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  // 1. DINE-IN MULTI-KOT DISPATCH: Waiter or Staff sends incremental KOT to Kitchen
  sendKot: async (restaurantId, waiterId, waiterName) => {
    const state = get();
    if (state.isSubmittingKot) return null;

    const session = state.getActiveSession();
    if (!session) return null;
    const itemsToSend = session.unsentItems.length > 0 ? session.unsentItems : [];
    if (itemsToSend.length === 0) {
      return null;
    }

    set({ isSubmittingKot: true });

    try {
      const kotCount = session.kots.length + 1;
      const kotNumber = `KOT #${100 + kotCount}`;
      const kotId = `kot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      const kotItems: KOTItem[] = itemsToSend.map((draft, idx) => ({
        id: `koti_${Date.now()}_${idx}`,
        kot_id: kotId,
        order_item_id: `oi_${Date.now()}_${idx}`,
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
        branch_id: "",
        table_id: session.tableId,
        order_type: "dine_in",
        waiter_id: waiterId || session.waiterId || null,
        status: "sent",
        notes: `Table: ${session.tableNumber}${waiterName ? ` | Waiter: ${waiterName}` : ""}`,
        sent_at: nowIso,
        created_at: nowIso,
        items: kotItems,
      };

      const newOrderItems: OrderItem[] = itemsToSend.map((draft, idx) => ({
        id: `oi_${Date.now()}_${idx}`,
        order_id: session.orderId,
        menu_item_id: draft.menuItem.id,
        variant_id: draft.variant?.id || null,
        name: draft.menuItem.name + (draft.variant ? ` (${draft.variant.name})` : ""),
        quantity: draft.quantity,
        unit_price: draft.unitPrice,
        total_price: draft.totalPrice,
        special_instructions: draft.instructions || null,
        status: "preparing",
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
        sentItems: updatedSentItems,
        kots: updatedKots,
        unsentItems: [], // Cleared so next add-items only sends new items!
        billRequested: false, // Adding items resets bill request
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
            name: ki.name,
            quantity: ki.quantity,
            instructions: ki.instructions,
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
      status: session.sentItems.length > 0 ? "confirmed" : "open",
      history: [...(session.history || []), cancelHistory],
    };
    const updatedSessions = { ...get().sessions, [tableId]: updatedSession };
    saveSessions(updatedSessions);
    set({ sessions: updatedSessions });
  },

  // 3. GENERATE FINAL BILL: Admin/Cashier creates invoice consolidating all KOTs
  generateBill: async (restaurantId, discountPercent = 0) => {
    const state = get();
    if (state.isGeneratingBill) return null;

    const session = state.getActiveSession();
    if (!session) return null;

    set({ isGeneratingBill: true });

    try {
      const subtotal = state.getSubtotal();
      const discountAmount = (subtotal * discountPercent) / 100;
      const taxAmount = ((subtotal - discountAmount) * 5) / 100;
      const finalTotal = Math.round(subtotal - discountAmount + taxAmount);

      const billNumber = `BILL-${Date.now().toString().slice(-5)}`;
      const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

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
        created_at: new Date().toISOString(),
      };

      const billGenHistory: SessionHistoryEvent = {
        id: `h_${Date.now()}_bill_gen`,
        timestamp: new Date().toISOString(),
        event: `Final Bill ${billNumber} generated for ₹${finalTotal}`,
        actor: "Admin / Cashier",
      };

      const updatedSession: ActiveTableSession = {
        ...session,
        bill: newBill,
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

  // 4. SETTLE PAYMENT & FREE TABLE: Admin records payment, order completes, table freed
  processPayment: async (restaurantId, paymentMethod, reference) => {
    const state = get();
    if (state.isProcessingPayment) return false;

    const session = state.getActiveSession();
    if (!session) return false;

    set({ isProcessingPayment: true });

    try {
      const amount = session.bill ? session.bill.final_total : state.getPayableAmount();
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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

      // Notify Waiter and Staff that table is paid and freed
      useNotificationStore.getState().addNotification({
        type: "payment_completed",
        title: `Table ${session.tableNumber} Paid`,
        message: `Payment of ₹${amount} settled via ${paymentMethod.toUpperCase()}. Table is now AVAILABLE.`,
        tableNumber: session.tableNumber,
      });

      try {
        const supabase = createClient();
        // Complete the order in Supabase
        await supabase.from("orders").upsert({
          id: session.orderId,
          order_number: session.orderNumber,
          restaurant_id: restaurantId,
          table_id: session.tableId,
          order_type: "dine_in",
          status: "completed",
          payment_status: "paid",
          total_amount: amount,
          paid_at: nowIso,
          completed_at: nowIso,
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

        // Free table immediately in database
        await supabase
          .from("restaurant_tables")
          .update({
            status: "available",
            current_order_id: null,
          })
          .eq("id", session.tableId);
      } catch {
        // Fallback
      }

      // Free table in local state by clearing active session
      const updatedSessions = { ...get().sessions };
      delete updatedSessions[session.tableId];
      saveSessions(updatedSessions);
      set({ sessions: updatedSessions, activeTableId: null });

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

  markTableServed: async (restaurantId, tableId) => {
    const session = get().sessions[tableId];
    if (!session) return;

    const updatedSession: ActiveTableSession = {
      ...session,
      status: "served",
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

  updateKotStatusInSession: (kotId, newStatus) => {
    const { sessions } = get();
    let changed = false;
    const updatedSessions = { ...sessions };

    for (const tableId in updatedSessions) {
      const sess = updatedSessions[tableId];
      if (sess.kots.some((k) => k.id === kotId)) {
        const updatedKots = sess.kots.map((k) => (k.id === kotId ? { ...k, status: newStatus } : k));
        const anyReady = updatedKots.some((k) => k.status === "ready");
        const anyPreparing = updatedKots.some((k) => k.status === "preparing");
        const newKotStatus: KotStatus = anyReady ? "ready" : anyPreparing ? "preparing" : "sent";

        updatedSessions[tableId] = {
          ...sess,
          kotStatus: newKotStatus,
          status: anyReady ? "ready" : anyPreparing ? "preparing" : sess.status,
          kots: updatedKots,
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

  getSubtotal: () => {
    const session = get().getActiveSession();
    if (!session) return 0;
    const sentTotal = session.sentItems.reduce((sum, item) => sum + item.total_price, 0);
    const draftTotal = session.unsentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return sentTotal + draftTotal;
  },

  getDiscountAmount: (discountPercent = 0) => {
    const subtotal = get().getSubtotal();
    return (subtotal * discountPercent) / 100;
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    return (subtotal * 5) / 100; // 5% GST
  },

  getPayableAmount: (discountPercent = 0) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount(discountPercent);
    const tax = get().getTaxAmount();
    return Math.max(0, Math.round(subtotal - discount + tax));
  },
}));
