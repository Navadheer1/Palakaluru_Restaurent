import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CashierShift } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export interface HeldBill {
  id: string;
  heldAt: string;
  label: string; // e.g. "#A01"
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

interface CashierShiftState {
  activeShift: CashierShift | null;
  heldBills: HeldBill[];
  isSubmitting: boolean;

  // Actions
  setActiveShift: (shift: CashierShift | null) => void;
  openShift: (
    restaurantId: string,
    cashierId: string,
    cashierName: string,
    openingCash: number,
    notes?: string
  ) => Promise<CashierShift | null>;
  closeShift: (
    actualCash: number,
    notes?: string
  ) => Promise<{ success: boolean; difference: number }>;
  recordPaymentToShift: (
    paymentMethod: "cash" | "upi" | "card" | "other",
    amount: number
  ) => Promise<void>;

  // Held Bills
  holdBill: (bill: Omit<HeldBill, "id" | "heldAt" | "label">) => string;
  resumeBill: (id: string) => HeldBill | null;
  discardHeldBill: (id: string) => void;
}

export const useCashierShiftStore = create<CashierShiftState>()(
  persist(
    (set, get) => ({
      activeShift: null,
      heldBills: [],
      isSubmitting: false,

      setActiveShift: (shift) => set({ activeShift: shift }),

      openShift: async (restaurantId, cashierId, cashierName, openingCash, notes) => {
        set({ isSubmitting: true });
        try {
          const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const now = new Date().toISOString();

          const newShift: CashierShift = {
            id: shiftId,
            restaurant_id: restaurantId,
            cashier_id: cashierId,
            cashier_name: cashierName,
            opening_cash: openingCash,
            expected_cash: openingCash,
            total_bills: 0,
            cash_sales: 0,
            upi_sales: 0,
            card_sales: 0,
            status: "open",
            opened_at: now,
            notes: notes || null,
          };

          // Optimistic local state
          set({ activeShift: newShift });

          // Non-blocking sync to Supabase
          try {
            const supabase = createClient();
            await supabase.from("cashier_shifts").insert({
              id: shiftId,
              restaurant_id: restaurantId,
              cashier_id: cashierId,
              cashier_name: cashierName,
              opening_cash: openingCash,
              expected_cash: openingCash,
              total_bills: 0,
              cash_sales: 0,
              upi_sales: 0,
              card_sales: 0,
              status: "open",
              opened_at: now,
              notes: notes || null,
            });
          } catch {}

          return newShift;
        } finally {
          set({ isSubmitting: false });
        }
      },

      closeShift: async (actualCash, notes) => {
        const current = get().activeShift;
        if (!current) return { success: false, difference: 0 };

        set({ isSubmitting: true });
        try {
          const now = new Date().toISOString();
          const expectedCash = (current.opening_cash || 0) + (current.cash_sales || 0);
          const difference = actualCash - expectedCash;

          const closedShift: CashierShift = {
            ...current,
            closing_cash: actualCash,
            expected_cash: expectedCash,
            cash_difference: difference,
            status: "closed",
            closed_at: now,
            notes: notes ? `${current.notes || ""} | ${notes}` : current.notes,
          };

          set({ activeShift: null });

          // Sync to Supabase
          try {
            const supabase = createClient();
            await supabase
              .from("cashier_shifts")
              .update({
                closing_cash: actualCash,
                expected_cash: expectedCash,
                cash_difference: difference,
                status: "closed",
                closed_at: now,
                notes: closedShift.notes,
              })
              .eq("id", current.id);
          } catch {}

          return { success: true, difference };
        } finally {
          set({ isSubmitting: false });
        }
      },

      recordPaymentToShift: async (paymentMethod, amount) => {
        const current = get().activeShift;
        if (!current) return;

        let cashSales = current.cash_sales;
        let upiSales = current.upi_sales;
        let cardSales = current.card_sales;

        if (paymentMethod === "cash") {
          cashSales += amount;
        } else if (paymentMethod === "upi") {
          upiSales += amount;
        } else if (paymentMethod === "card") {
          cardSales += amount;
        }

        const totalBills = current.total_bills + 1;
        const expectedCash = current.opening_cash + cashSales;

        const updatedShift: CashierShift = {
          ...current,
          total_bills: totalBills,
          cash_sales: cashSales,
          upi_sales: upiSales,
          card_sales: cardSales,
          expected_cash: expectedCash,
        };

        set({ activeShift: updatedShift });

        // Non-blocking sync
        try {
          const supabase = createClient();
          await supabase
            .from("cashier_shifts")
            .update({
              total_bills: totalBills,
              cash_sales: cashSales,
              upi_sales: upiSales,
              card_sales: cardSales,
              expected_cash: expectedCash,
            })
            .eq("id", current.id);
        } catch {}
      },

      holdBill: (billData) => {
        const held = get().heldBills;
        const nextNum = held.length + 1;
        const label = `#A${String(nextNum).padStart(2, "0")}`;
        const newHeld: HeldBill = {
          ...billData,
          id: `held_${Date.now()}`,
          heldAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          label,
        };

        set({ heldBills: [...held, newHeld] });
        return newHeld.id;
      },

      resumeBill: (id) => {
        const held = get().heldBills;
        const target = held.find((b) => b.id === id);
        if (target) {
          set({ heldBills: held.filter((b) => b.id !== id) });
          return target;
        }
        return null;
      },

      discardHeldBill: (id) => {
        set({ heldBills: get().heldBills.filter((b) => b.id !== id) });
      },
    }),
    {
      name: "rms_cashier_shift_store",
      partialize: (state) => ({
        activeShift: state.activeShift,
        heldBills: state.heldBills,
      }),
    }
  )
);
