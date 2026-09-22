import { create } from "zustand";
import { MenuItem, MenuVariant, MenuAddon, KOT, KOTItem, Payment, Bill } from "@/types/database";
import { PaymentMethod, PaymentStatus, KotStatus, OrderStatus, DeliveryStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export interface CartItem {
  id: string; // unique item cart key (item_id + variant_id + sorted addons)
  menuItem: MenuItem;
  variant?: MenuVariant;
  addons: MenuAddon[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions: string;
}

export interface PosActiveOrder {
  id: string;
  orderNumber: string;
  billNumber: string;
  orderType: "takeaway" | "delivery";
  selectedCustomerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  kotStatus: KotStatus;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  payments: Payment[];
  kots: KOT[];
  createdAt: string;
  paidAt?: string;
  kotSentAt?: string;
  readyAt?: string;
  completedAt?: string;
}

export type PosWorkflowStage =
  | "cart"
  | "paid_confirmation"
  | "editing_post_payment"
  | "kot_active"
  | "adding_items";

interface PosState {
  // Current in-progress cart or active order editing
  orderType: "takeaway" | "delivery";
  selectedCustomerId: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryFee: number;
  notes: string;
  items: CartItem[];
  discountPercent: number;
  taxPercent: number;
  isSubmitting: boolean;

  // Multi-order tracking & workflow state
  activeOrders: Record<string, PosActiveOrder>;
  orderHistory: Record<string, PosActiveOrder>;
  currentOrderId: string | null;
  workflowStage: PosWorkflowStage;

  // Post-payment edit snapshot (original state before edit)
  editSnapshot: {
    originalItems: CartItem[];
    originalSubtotal: number;
    originalTotal: number;
    originalDiscountPercent: number;
  } | null;

  // Supplementary add items cart (when adding items post-KOT)
  supplementaryItems: CartItem[];

  // Actions - Cart Building
  setOrderType: (type: "takeaway" | "delivery") => void;
  setCustomerDetails: (details: {
    id?: string | null;
    name?: string;
    phone?: string;
    address?: string;
  }) => void;
  setDeliveryFee: (fee: number) => void;
  setNotes: (notes: string) => void;
  addItem: (item: MenuItem, variant?: MenuVariant, addons?: MenuAddon[], instructions?: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  setDiscount: (percent: number) => void;

  // Calculations
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getFinalTotal: () => number;

  // Calculation for post-payment editing difference
  getEditDifference: () => {
    originalTotal: number;
    newTotal: number;
    difference: number; // positive = customer owes more, negative = refund due
  };

  // Calculation for supplementary items (post-KOT add items)
  getSupplementarySubtotal: () => number;
  getSupplementaryTax: () => number;
  getSupplementaryTotal: () => number;
  addSupplementaryItem: (item: MenuItem, variant?: MenuVariant, addons?: MenuAddon[], instructions?: string) => void;
  updateSupplementaryQuantity: (cartItemId: string, delta: number) => void;
  removeSupplementaryItem: (cartItemId: string) => void;
  clearSupplementaryCart: () => void;

  // Workflow transitions
  startNewOrder: () => void;
  selectActiveOrder: (orderId: string) => void;

  // CORE WORKFLOW: 1. Process Initial Payment -> Order becomes PAID (KOT: NOT SENT)
  processInitialPayment: (
    restaurantId: string,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => Promise<PosActiveOrder | null>;

  // CORE WORKFLOW: 2. Edit Order After Payment (Only when Paid & KOT NOT SENT)
  startPostPaymentEdit: () => void;
  cancelPostPaymentEdit: () => void;
  savePostPaymentEdit: (
    restaurantId: string,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => Promise<PosActiveOrder | null>;

  // CORE WORKFLOW: 3. Cashier manually clicks SEND KOT
  manuallySendKot: (
    restaurantId: string,
    waiterId?: string | null
  ) => Promise<{ kot: KOT; order: PosActiveOrder } | null>;

  // CORE WORKFLOW: 4. Add Items post-KOT -> Supplementary KOT
  startAddItems: () => void;
  cancelAddItems: () => void;
  submitSupplementaryItems: (
    restaurantId: string,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => Promise<{ kot: KOT; order: PosActiveOrder } | null>;

  // CORE WORKFLOW: 5. Operational updates (Hand Over / Delivery)
  updateDeliveryStatus: (
    restaurantId: string,
    deliveryStatus: DeliveryStatus
  ) => Promise<void>;
  completeOrderHandover: (
    restaurantId: string
  ) => Promise<void>;

  // Realtime hook sync
  syncRemoteKotUpdate: (kotId: string, status: KotStatus) => void;
}

const STORAGE_KEY = "culinacloud_pos_active_orders_v2";
const HISTORY_STORAGE_KEY = "culinacloud_pos_history_orders_v2";

function loadActiveOrders(): Record<string, PosActiveOrder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return {};
}

function saveActiveOrders(orders: Record<string, PosActiveOrder>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage errors
  }
}

function loadOrderHistory(): Record<string, PosActiveOrder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return {};
}

function saveOrderHistory(orders: Record<string, PosActiveOrder>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage errors
  }
}

// Background audit log helper
async function logAudit(
  restaurantId: string,
  orderId: string,
  action: string,
  details: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    await supabase.from("order_audit_logs").insert({
      restaurant_id: restaurantId,
      order_id: orderId,
      action,
      details,
    });
  } catch {
    // Non-blocking
  }
}

export const usePosStore = create<PosState>((set, get) => ({
  orderType: "takeaway",
  selectedCustomerId: null,
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  deliveryFee: 0,
  notes: "",
  items: [],
  discountPercent: 0,
  taxPercent: 5.0,
  isSubmitting: false,

  activeOrders: loadActiveOrders(),
  orderHistory: loadOrderHistory(),
  currentOrderId: null,
  workflowStage: "cart",
  editSnapshot: null,
  supplementaryItems: [],

  setOrderType: (orderType) => set({ orderType }),
  setCustomerDetails: ({ id = null, name = "", phone = "", address = "" }) =>
    set({
      selectedCustomerId: id,
      customerName: name,
      customerPhone: phone,
      deliveryAddress: address,
    }),
  setDeliveryFee: (deliveryFee) => set({ deliveryFee }),
  setNotes: (notes) => set({ notes }),

  addItem: (menuItem, variant, addons = [], instructions = "") => {
    const variantId = variant ? variant.id : "base";
    const addonIds = addons.map((a) => a.id).sort().join("-");
    const cartItemId = `${menuItem.id}-${variantId}-${addonIds}`;

    const unitPrice =
      (variant ? Number(variant.price) : Number(menuItem.base_price)) +
      addons.reduce((sum, a) => sum + Number(a.price), 0);

    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];
        const newQty = existing.quantity + 1;
        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * existing.unitPrice,
        };
        return { items: updatedItems };
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          menuItem,
          variant,
          addons,
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
          instructions,
        };
        return { items: [...state.items, newItem] };
      }
    });
  },

  updateQuantity: (cartItemId, delta) => {
    set((state) => {
      const updated = state.items
        .map((item) => {
          if (item.id === cartItemId) {
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
        .filter(Boolean) as CartItem[];
      return { items: updated };
    });
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      selectedCustomerId: null,
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      deliveryFee: 0,
      notes: "",
      discountPercent: 0,
      workflowStage: "cart",
      editSnapshot: null,
      supplementaryItems: [],
    });
  },

  setDiscount: (percent) => set({ discountPercent: Math.max(0, Math.min(100, percent)) }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    return (subtotal * get().discountPercent) / 100;
  },

  getTaxAmount: () => {
    const taxable = get().getSubtotal() - get().getDiscountAmount();
    return (taxable * get().taxPercent) / 100;
  },

  getFinalTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    const delivery = get().orderType === "delivery" ? get().deliveryFee : 0;
    return Math.max(0, Math.round(subtotal - discount + tax + delivery));
  },

  getEditDifference: () => {
    const state = get();
    const originalTotal = state.editSnapshot ? state.editSnapshot.originalTotal : 0;
    const newTotal = state.getFinalTotal();
    return {
      originalTotal,
      newTotal,
      difference: newTotal - originalTotal,
    };
  },

  // Supplementary items logic
  getSupplementarySubtotal: () => {
    return get().supplementaryItems.reduce((sum, item) => sum + item.totalPrice, 0);
  },
  getSupplementaryTax: () => {
    return (get().getSupplementarySubtotal() * get().taxPercent) / 100;
  },
  getSupplementaryTotal: () => {
    return Math.round(get().getSupplementarySubtotal() + get().getSupplementaryTax());
  },
  addSupplementaryItem: (menuItem, variant, addons = [], instructions = "") => {
    const variantId = variant ? variant.id : "base";
    const addonIds = addons.map((a) => a.id).sort().join("-");
    const cartItemId = `supp-${menuItem.id}-${variantId}-${addonIds}`;

    const unitPrice =
      (variant ? Number(variant.price) : Number(menuItem.base_price)) +
      addons.reduce((sum, a) => sum + Number(a.price), 0);

    set((state) => {
      const existingIndex = state.supplementaryItems.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...state.supplementaryItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + 1;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * existing.unitPrice,
        };
        return { supplementaryItems: updated };
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          menuItem,
          variant,
          addons,
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
          instructions,
        };
        return { supplementaryItems: [...state.supplementaryItems, newItem] };
      }
    });
  },
  updateSupplementaryQuantity: (cartItemId, delta) => {
    set((state) => {
      const updated = state.supplementaryItems
        .map((item) => {
          if (item.id === cartItemId) {
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
        .filter(Boolean) as CartItem[];
      return { supplementaryItems: updated };
    });
  },
  removeSupplementaryItem: (cartItemId) => {
    set((state) => ({
      supplementaryItems: state.supplementaryItems.filter((i) => i.id !== cartItemId),
    }));
  },
  clearSupplementaryCart: () => set({ supplementaryItems: [] }),

  startNewOrder: () => {
    get().clearCart();
    set({ currentOrderId: null, workflowStage: "cart" });
  },

  selectActiveOrder: (orderId) => {
    const state = get();
    const ord = state.activeOrders[orderId];
    if (!ord) return;

    // Load selected order details into view
    set({
      currentOrderId: orderId,
      orderType: ord.orderType,
      selectedCustomerId: ord.selectedCustomerId || null,
      customerName: ord.customerName || "",
      customerPhone: ord.customerPhone || "",
      deliveryAddress: ord.deliveryAddress || "",
      deliveryFee: ord.deliveryFee || 0,
      notes: ord.notes || "",
      items: ord.items,
      discountPercent: ord.discountPercent,
      editSnapshot: null,
      supplementaryItems: [],
      workflowStage:
        ord.kotStatus === "not_sent"
          ? "paid_confirmation"
          : "kot_active",
    });
  },

  // 1. Process Initial Payment -> Order is PAID, KOT is NOT SENT
  processInitialPayment: async (restaurantId, paymentMethod, reference) => {
    const state = get();
    if (state.items.length === 0 || state.isSubmitting) return null;

    set({ isSubmitting: true });

    try {
      const timestamp = Date.now();
      const orderNumber = `ORD-${timestamp.toString().slice(-4)}`;
      const billNumber = `BILL-${timestamp.toString().slice(-4)}`;
      const orderId = `ord_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;
      const paymentId = `pay_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;
      const finalTotal = state.getFinalTotal();
      const subtotal = state.getSubtotal();
      const tax = state.getTaxAmount();
      const discount = state.getDiscountAmount();
      const nowIso = new Date().toISOString();

      const initialPayment: Payment = {
        id: paymentId,
        order_id: orderId,
        restaurant_id: restaurantId,
        branch_id: "",
        amount: finalTotal,
        payment_method: paymentMethod,
        status: "paid",
        payment_type: "initial",
        transaction_reference: reference || null,
        processed_by: null,
        created_at: nowIso,
      };

      const newActiveOrder: PosActiveOrder = {
        id: orderId,
        orderNumber,
        billNumber,
        orderType: state.orderType,
        selectedCustomerId: state.selectedCustomerId,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        deliveryAddress: state.deliveryAddress,
        deliveryFee: state.deliveryFee,
        notes: state.notes,
        items: [...state.items],
        subtotal,
        discountPercent: state.discountPercent,
        discountAmount: discount,
        taxAmount: tax,
        totalAmount: finalTotal,
        paidAmount: finalTotal,
        paymentStatus: "paid",
        kotStatus: "not_sent",
        orderStatus: "paid",
        deliveryStatus: state.orderType === "delivery" ? "packed" : "not_applicable",
        payments: [initialPayment],
        kots: [],
        createdAt: nowIso,
        paidAt: nowIso,
      };

      // Save locally (immediate, resilient)
      const updatedOrders = { ...state.activeOrders, [orderId]: newActiveOrder };
      saveActiveOrders(updatedOrders);

      set({
        activeOrders: updatedOrders,
        currentOrderId: orderId,
        workflowStage: "paid_confirmation",
      });

      // Background non-blocking sync to Supabase
      try {
        const supabase = createClient();
        await supabase.from("orders").insert({
          id: orderId,
          order_number: orderNumber,
          restaurant_id: restaurantId,
          order_type: state.orderType,
          status: "paid",
          payment_status: "paid",
          kot_status: "not_sent",
          delivery_status: state.orderType === "delivery" ? "packed" : "not_applicable",
          subtotal,
          discount_amount: discount,
          tax_amount: tax,
          total_amount: finalTotal,
          paid_at: nowIso,
          notes: state.notes || null,
        });

        await supabase.from("bills").insert({
          bill_number: billNumber,
          order_id: orderId,
          restaurant_id: restaurantId,
          subtotal,
          discount_amount: discount,
          tax_amount: tax,
          final_total: finalTotal,
          payment_status: "paid",
        });

        await supabase.from("payments").insert({
          id: paymentId,
          order_id: orderId,
          restaurant_id: restaurantId,
          amount: finalTotal,
          payment_method: paymentMethod,
          status: "paid",
          payment_type: "initial",
          transaction_reference: reference || null,
        });

        if (state.orderType === "delivery" && state.deliveryAddress) {
          await supabase.from("delivery_orders").insert({
            order_id: orderId,
            delivery_address: state.deliveryAddress,
            delivery_fee: state.deliveryFee,
            status: "ready_for_delivery",
            notes: state.customerName ? `Customer: ${state.customerName} (${state.customerPhone})` : null,
          });
        }

        await logAudit(restaurantId, orderId, "order_created_and_paid", {
          total: finalTotal,
          paymentMethod,
          itemsCount: state.items.length,
        });
      } catch {
        // Handled gracefully in offline mode
      }

      return newActiveOrder;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // 2. Edit Order After Payment (allowed ONLY when PAID and KOT NOT SENT)
  startPostPaymentEdit: () => {
    const state = get();
    if (state.workflowStage !== "paid_confirmation") return;

    set({
      workflowStage: "editing_post_payment",
      editSnapshot: {
        originalItems: [...state.items],
        originalSubtotal: state.getSubtotal(),
        originalTotal: state.getFinalTotal(),
        originalDiscountPercent: state.discountPercent,
      },
    });
  },

  cancelPostPaymentEdit: () => {
    const state = get();
    if (!state.editSnapshot) return;

    set({
      items: [...state.editSnapshot.originalItems],
      discountPercent: state.editSnapshot.originalDiscountPercent,
      editSnapshot: null,
      workflowStage: "paid_confirmation",
    });
  },

  savePostPaymentEdit: async (restaurantId, paymentMethod, reference) => {
    const state = get();
    if (!state.currentOrderId || !state.editSnapshot || state.isSubmitting) return null;

    set({ isSubmitting: true });

    try {
      const activeOrder = state.activeOrders[state.currentOrderId];
      if (!activeOrder) return null;

      const { originalTotal, newTotal, difference } = state.getEditDifference();
      const nowIso = new Date().toISOString();
      const updatedPayments = [...activeOrder.payments];

      let adjustmentPayment: Payment | null = null;

      if (difference > 0) {
        // Customer owes additional money
        adjustmentPayment = {
          id: `pay_add_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          order_id: activeOrder.id,
          restaurant_id: restaurantId,
          branch_id: "",
          amount: difference,
          payment_method: paymentMethod,
          status: "paid",
          payment_type: "additional",
          transaction_reference: reference || `Additional charge on edit (+₹${difference})`,
          processed_by: null,
          created_at: nowIso,
        };
        updatedPayments.push(adjustmentPayment);
      } else if (difference < 0) {
        // Refund/adjustment due to customer
        const refundAmt = Math.abs(difference);
        adjustmentPayment = {
          id: `pay_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          order_id: activeOrder.id,
          restaurant_id: restaurantId,
          branch_id: "",
          amount: refundAmt,
          payment_method: paymentMethod,
          status: "refunded",
          payment_type: "refund",
          transaction_reference: reference || `Refund adjustment on edit (-₹${refundAmt})`,
          processed_by: null,
          created_at: nowIso,
        };
        updatedPayments.push(adjustmentPayment);
      }

      const updatedOrder: PosActiveOrder = {
        ...activeOrder,
        items: [...state.items],
        subtotal: state.getSubtotal(),
        discountPercent: state.discountPercent,
        discountAmount: state.getDiscountAmount(),
        taxAmount: state.getTaxAmount(),
        totalAmount: newTotal,
        paidAmount: newTotal,
        paymentStatus: difference !== 0 ? "payment_adjusted" : activeOrder.paymentStatus,
        payments: updatedPayments,
      };

      const updatedOrders = { ...state.activeOrders, [activeOrder.id]: updatedOrder };
      saveActiveOrders(updatedOrders);

      set({
        activeOrders: updatedOrders,
        editSnapshot: null,
        workflowStage: "paid_confirmation",
      });

      // Sync to Supabase
      try {
        const supabase = createClient();
        await supabase
          .from("orders")
          .update({
            subtotal: updatedOrder.subtotal,
            discount_amount: updatedOrder.discountAmount,
            tax_amount: updatedOrder.taxAmount,
            total_amount: updatedOrder.totalAmount,
            payment_status: updatedOrder.paymentStatus,
          })
          .eq("id", activeOrder.id);

        if (adjustmentPayment) {
          await supabase.from("payments").insert({
            id: adjustmentPayment.id,
            order_id: activeOrder.id,
            restaurant_id: restaurantId,
            amount: adjustmentPayment.amount,
            payment_method: adjustmentPayment.payment_method,
            status: adjustmentPayment.status,
            payment_type: adjustmentPayment.payment_type,
            transaction_reference: adjustmentPayment.transaction_reference,
          });
        }

        await logAudit(restaurantId, activeOrder.id, "order_edited_post_payment", {
          originalTotal,
          newTotal,
          difference,
          adjustmentPaymentId: adjustmentPayment?.id,
        });
      } catch {
        // Offline resilience
      }

      return updatedOrder;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // 3. Cashier manually clicks SEND KOT
  manuallySendKot: async (restaurantId, waiterId) => {
    const state = get();
    if (!state.currentOrderId || state.isSubmitting) return null;

    set({ isSubmitting: true });

    try {
      const activeOrder = state.activeOrders[state.currentOrderId];
      if (!activeOrder) return null;

      const kotCount = activeOrder.kots.length + 1;
      const kotNumber = `KOT #${500 + kotCount}`;
      const kotId = `kot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      const kotItems: KOTItem[] = activeOrder.items.map((item, idx) => ({
        id: `koti_${Date.now()}_${idx}`,
        kot_id: kotId,
        order_item_id: `oi_${Date.now()}_${idx}`,
        name: item.menuItem.name + (item.variant ? ` (${item.variant.name})` : ""),
        quantity: item.quantity,
        instructions: item.instructions || null,
        status: "pending",
      }));

      const newKot: KOT = {
        id: kotId,
        kot_number: kotNumber,
        order_id: activeOrder.id,
        restaurant_id: restaurantId,
        branch_id: "",
        table_id: null,
        order_type: activeOrder.orderType,
        waiter_id: waiterId || null,
        status: "sent",
        notes: activeOrder.orderType === "delivery"
          ? `Delivery: ${activeOrder.customerName || "Customer"} (${activeOrder.customerPhone || ""})`
          : "Counter Takeaway",
        sent_at: nowIso,
        created_at: nowIso,
        items: kotItems,
      };

      const updatedOrder: PosActiveOrder = {
        ...activeOrder,
        kotStatus: "sent",
        orderStatus: "confirmed",
        kotSentAt: nowIso,
        kots: [...activeOrder.kots, newKot],
      };

      const updatedOrders = { ...state.activeOrders, [activeOrder.id]: updatedOrder };
      saveActiveOrders(updatedOrders);

      set({
        activeOrders: updatedOrders,
        workflowStage: "kot_active",
      });

      // Background sync to Supabase
      try {
        const supabase = createClient();
        await supabase
          .from("orders")
          .update({
            kot_status: "sent",
            status: "confirmed",
            kot_sent_at: nowIso,
          })
          .eq("id", activeOrder.id);

        await supabase.from("kot").insert({
          id: kotId,
          kot_number: kotNumber,
          order_id: activeOrder.id,
          restaurant_id: restaurantId,
          order_type: activeOrder.orderType,
          status: "sent",
          notes: newKot.notes,
          sent_at: nowIso,
        });

        // Insert kot_items
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

        await logAudit(restaurantId, activeOrder.id, "kot_manually_sent", {
          kotNumber,
          kotId,
          itemsCount: kotItems.length,
        });
      } catch {
        // Offline resilience
      }

      return { kot: newKot, order: updatedOrder };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // 4. Add Items post-KOT (Supplementary items -> Supplementary KOT)
  startAddItems: () => {
    set({
      workflowStage: "adding_items",
      supplementaryItems: [],
    });
  },

  cancelAddItems: () => {
    set({
      workflowStage: "kot_active",
      supplementaryItems: [],
    });
  },

  submitSupplementaryItems: async (restaurantId, paymentMethod, reference) => {
    const state = get();
    if (
      !state.currentOrderId ||
      state.supplementaryItems.length === 0 ||
      state.isSubmitting
    ) {
      return null;
    }

    set({ isSubmitting: true });

    try {
      const activeOrder = state.activeOrders[state.currentOrderId];
      if (!activeOrder) return null;

      const supplementarySubtotal = state.getSupplementarySubtotal();
      const supplementaryTax = state.getSupplementaryTax();
      const supplementaryTotal = state.getSupplementaryTotal();
      const nowIso = new Date().toISOString();

      // Supplementary payment
      const paymentId = `pay_supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const suppPayment: Payment = {
        id: paymentId,
        order_id: activeOrder.id,
        restaurant_id: restaurantId,
        branch_id: "",
        amount: supplementaryTotal,
        payment_method: paymentMethod,
        status: "paid",
        payment_type: "additional",
        transaction_reference: reference || `Supplementary order payment (+₹${supplementaryTotal})`,
        processed_by: null,
        created_at: nowIso,
      };

      // Supplementary KOT (e.g. KOT #502)
      const kotCount = activeOrder.kots.length + 1;
      const kotNumber = `KOT #${500 + kotCount}`;
      const kotId = `kot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const kotItems: KOTItem[] = state.supplementaryItems.map((item, idx) => ({
        id: `koti_supp_${Date.now()}_${idx}`,
        kot_id: kotId,
        order_item_id: `oi_supp_${Date.now()}_${idx}`,
        name: item.menuItem.name + (item.variant ? ` (${item.variant.name})` : ""),
        quantity: item.quantity,
        instructions: item.instructions || null,
        status: "pending",
      }));

      const supplementaryKot: KOT = {
        id: kotId,
        kot_number: kotNumber,
        order_id: activeOrder.id,
        restaurant_id: restaurantId,
        branch_id: "",
        table_id: null,
        order_type: activeOrder.orderType,
        waiter_id: null,
        status: "sent",
        notes: `Additional Order for ${activeOrder.orderNumber}`,
        sent_at: nowIso,
        created_at: nowIso,
        items: kotItems,
      };

      // Merge items into order item list without altering previous KOT
      const combinedItems = [...activeOrder.items, ...state.supplementaryItems];
      const newTotalAmount = activeOrder.totalAmount + supplementaryTotal;
      const newPaidAmount = activeOrder.paidAmount + supplementaryTotal;

      const updatedOrder: PosActiveOrder = {
        ...activeOrder,
        items: combinedItems,
        subtotal: activeOrder.subtotal + supplementarySubtotal,
        taxAmount: activeOrder.taxAmount + supplementaryTax,
        totalAmount: newTotalAmount,
        paidAmount: newPaidAmount,
        paymentStatus: "paid",
        kots: [...activeOrder.kots, supplementaryKot],
      };

      const updatedOrders = { ...state.activeOrders, [activeOrder.id]: updatedOrder };
      saveActiveOrders(updatedOrders);

      set({
        activeOrders: updatedOrders,
        items: combinedItems,
        supplementaryItems: [],
        workflowStage: "kot_active",
      });

      // Sync to Supabase
      try {
        const supabase = createClient();
        await supabase
          .from("orders")
          .update({
            subtotal: updatedOrder.subtotal,
            tax_amount: updatedOrder.taxAmount,
            total_amount: updatedOrder.totalAmount,
            payment_status: "paid",
          })
          .eq("id", activeOrder.id);

        await supabase.from("payments").insert({
          id: suppPayment.id,
          order_id: activeOrder.id,
          restaurant_id: restaurantId,
          amount: supplementaryTotal,
          payment_method: paymentMethod,
          status: "paid",
          payment_type: "additional",
          transaction_reference: suppPayment.transaction_reference,
        });

        await supabase.from("kot").insert({
          id: kotId,
          kot_number: kotNumber,
          order_id: activeOrder.id,
          restaurant_id: restaurantId,
          order_type: activeOrder.orderType,
          status: "sent",
          notes: supplementaryKot.notes,
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

        await logAudit(restaurantId, activeOrder.id, "additional_kot_created", {
          kotNumber,
          kotId,
          additionalAmount: supplementaryTotal,
          itemsCount: kotItems.length,
        });
      } catch {
        // Offline resilience
      }

      return { kot: supplementaryKot, order: updatedOrder };
    } finally {
      set({ isSubmitting: false });
    }
  },

  // 5. Handover / Delivery Status transitions
  updateDeliveryStatus: async (restaurantId, deliveryStatus) => {
    const state = get();
    if (!state.currentOrderId) return;
    const activeOrder = state.activeOrders[state.currentOrderId];
    if (!activeOrder) return;

    const isDelivered = deliveryStatus === "delivered";
    const nowIso = new Date().toISOString();

    const updatedOrder: PosActiveOrder = {
      ...activeOrder,
      deliveryStatus,
      orderStatus: isDelivered ? "completed" : activeOrder.orderStatus,
      completedAt: isDelivered ? nowIso : activeOrder.completedAt,
    };

    if (isDelivered) {
      const updatedHistory = { ...state.orderHistory, [updatedOrder.id]: updatedOrder };
      saveOrderHistory(updatedHistory);
      const updatedActive = { ...state.activeOrders };
      delete updatedActive[updatedOrder.id];
      saveActiveOrders(updatedActive);

      // If viewing this order in POS, reset for next order immediately
      if (state.currentOrderId === updatedOrder.id) {
        set({
          activeOrders: updatedActive,
          orderHistory: updatedHistory,
          currentOrderId: null,
          items: [],
          selectedCustomerId: null,
          customerName: "",
          customerPhone: "",
          deliveryAddress: "",
          deliveryFee: 0,
          notes: "",
          discountPercent: 0,
          workflowStage: "cart",
          editSnapshot: null,
          supplementaryItems: [],
        });
      } else {
        set({ activeOrders: updatedActive, orderHistory: updatedHistory });
      }
    } else {
      const updatedOrders = { ...state.activeOrders, [activeOrder.id]: updatedOrder };
      saveActiveOrders(updatedOrders);
      set({ activeOrders: updatedOrders });
    }

    try {
      const supabase = createClient();
      await supabase
        .from("orders")
        .update({
          delivery_status: deliveryStatus,
          status: isDelivered ? "completed" : activeOrder.orderStatus,
          completed_at: isDelivered ? nowIso : null,
        })
        .eq("id", activeOrder.id);

      await supabase
        .from("delivery_orders")
        .update({
          status: deliveryStatus === "out_for_delivery" ? "out_for_delivery" : deliveryStatus === "delivered" ? "delivered" : "ready_for_delivery",
          delivered_at: isDelivered ? nowIso : null,
        })
        .eq("order_id", activeOrder.id);

      await logAudit(restaurantId, activeOrder.id, "delivery_status_changed", {
        deliveryStatus,
      });
    } catch {
      // Handled
    }
  },

  completeOrderHandover: async (restaurantId) => {
    const state = get();
    if (!state.currentOrderId) return;
    const activeOrder = state.activeOrders[state.currentOrderId];
    if (!activeOrder) return;

    const nowIso = new Date().toISOString();
    const completedOrder: PosActiveOrder = {
      ...activeOrder,
      orderStatus: "completed",
      completedAt: nowIso,
    };

    // 1. Save to order history so it immediately appears in the Orders tab
    const updatedHistory = { ...state.orderHistory, [completedOrder.id]: completedOrder };
    saveOrderHistory(updatedHistory);

    // 2. Remove from active orders so ticket is no longer pending in active bar
    const updatedActive = { ...state.activeOrders };
    delete updatedActive[completedOrder.id];
    saveActiveOrders(updatedActive);

    // 3. Reset POS state immediately so cashier is ready for the NEXT order
    set({
      activeOrders: updatedActive,
      orderHistory: updatedHistory,
      currentOrderId: null,
      items: [],
      selectedCustomerId: null,
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      deliveryFee: 0,
      notes: "",
      discountPercent: 0,
      workflowStage: "cart",
      editSnapshot: null,
      supplementaryItems: [],
    });

    try {
      const supabase = createClient();
      await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: nowIso,
        })
        .eq("id", activeOrder.id);

      await logAudit(restaurantId, activeOrder.id, "order_completed_and_handed_over", {
        orderNumber: activeOrder.orderNumber,
      });
    } catch {
      // Handled
    }
  },

  syncRemoteKotUpdate: (kotId, status) => {
    const state = get();
    let changed = false;
    const updatedOrders = { ...state.activeOrders };

    for (const ordId in updatedOrders) {
      const ord = updatedOrders[ordId];
      const targetKot = ord.kots.find((k) => k.id === kotId);
      if (targetKot && targetKot.status !== status) {
        changed = true;
        const updatedKots = ord.kots.map((k) => (k.id === kotId ? { ...k, status } : k));
        // If any KOT is preparing or ready, reflect in order kotStatus
        const anyReady = updatedKots.some((k) => k.status === "ready");
        const anyPreparing = updatedKots.some((k) => k.status === "preparing");
        const newKotStatus: KotStatus = anyReady ? "ready" : anyPreparing ? "preparing" : "sent";

        updatedOrders[ordId] = {
          ...ord,
          kotStatus: newKotStatus,
          orderStatus: anyReady ? "ready" : anyPreparing ? "preparing" : ord.orderStatus,
          kots: updatedKots,
        };
      }
    }

    if (changed) {
      saveActiveOrders(updatedOrders);
      set({ activeOrders: updatedOrders });
    }
  },
}));
