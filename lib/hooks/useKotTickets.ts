"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useDineInStore, ActiveTableSession } from "@/stores/useDineInStore";
import { usePosStore, PosActiveOrder } from "@/stores/usePosStore";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";
import { BillData, BillItemData } from "@/components/billing/BillReceiptModal";
import { PaymentStatus } from "@/lib/constants";

export interface UnifiedKotItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions?: string | null;
  status?: string;
}

export interface UnifiedKotTicket {
  id: string; // KOT ticket id
  kotNumber: string;
  orderId: string;
  orderNumber: string;
  billNumber: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableId?: string | null;
  tableNumber: string; // e.g. "T-01" or "Takeaway" or "Delivery"
  waiterId?: string | null;
  waiterName: string;
  customerName?: string | null;
  customerPhone?: string | null;
  createdAt: string;
  sentAt?: string | null;
  status: "not_sent" | "sent" | "preparing" | "ready" | "served" | "completed" | "cancelled";
  orderStatus: string;
  paymentStatus: PaymentStatus;
  items: UnifiedKotItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  source: "dine_in_session" | "pos_order" | "database";
  billData: BillData;
}

export interface KotFilterOptions {
  tableFilter?: string; // "all" or specific table e.g. "T-01"
  waiterFilter?: string; // "all" or specific waiter name
  orderTypeFilter?: string; // "all" | "dine_in" | "takeaway" | "delivery"
  statusFilter?: string; // "all" | "pending" | "ready" | "served"
  dateFilter?: string; // "all" | "today" | "yesterday"
  searchQuery?: string;
  waiterOnlyName?: string | null; // When logged-in as Waiter, locks to their name
}

export function useKotTickets(options: KotFilterOptions = {}) {
  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  const { sessions } = useDineInStore();
  const { activeOrders, orderHistory } = usePosStore();

  // 1. Fetch remote KOT tickets from Supabase when available
  const { data: remoteTickets = [] } = useQuery({
    queryKey: ["remote_kot_tickets", restaurantId],
    queryFn: async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("kot")
          .select(`
            id,
            kot_number,
            order_id,
            restaurant_id,
            table_id,
            order_type,
            waiter_id,
            status,
            notes,
            sent_at,
            created_at,
            items:kot_items(id, name, quantity, instructions, status),
            order:orders(
              id,
              order_number,
              subtotal,
              discount_amount,
              tax_amount,
              total_amount,
              payment_status,
              status
            ),
            table:restaurant_tables(table_number)
          `)
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false });

        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 15,
  });

  // 2. Aggregate & Unify tickets from local Dine-In sessions, POS orders, and remote DB
  const allTickets: UnifiedKotTicket[] = React.useMemo(() => {
    const list: UnifiedKotTicket[] = [];
    const seenKotIds = new Set<string>();

    // A. Extract from Dine-In Sessions
    Object.values(sessions).forEach((sess: ActiveTableSession) => {
      const defaultWaiter = sess.waiterName || "Staff";
      const billNum = sess.bill?.bill_number || `BILL-${sess.orderNumber.replace("ORD-", "")}`;

      // Calculate table order totals
      const subtotal = sess.bill?.subtotal ||
        sess.sentItems.reduce((acc, i) => acc + (i.total_price || 0), 0);
      const discount = sess.bill?.discount_amount || 0;
      const tax = sess.bill?.tax_amount || Math.round((subtotal - discount) * 0.05);
      const grandTotal = sess.bill?.final_total || (subtotal - discount + tax);

      // Construct BillData for this table order
      const fullBillItems: BillItemData[] = sess.sentItems.map((si) => ({
        name: si.name,
        quantity: si.quantity,
        unitPrice: si.unit_price,
        totalPrice: si.total_price,
      }));

      const tableBillData: BillData = {
        billNumber: billNum,
        kotNumber: sess.kots.map((k) => k.kot_number),
        orderNumber: sess.orderNumber,
        date: new Date(sess.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: new Date(sess.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        orderType: "dine_in",
        tableNumber: sess.tableNumber,
        waiterName: defaultWaiter,
        items: fullBillItems.length > 0 ? fullBillItems : [{ name: "Standard Meal Order", quantity: 1, unitPrice: subtotal, totalPrice: subtotal }],
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        grandTotal,
        paymentStatus: sess.paymentStatus,
      };

      // If session has individual KOTs
      if (sess.kots && sess.kots.length > 0) {
        sess.kots.forEach((kot) => {
          if (seenKotIds.has(kot.id)) return;
          seenKotIds.add(kot.id);

          // Find items matching this KOT
          const matchedSent = sess.sentItems.filter((si) => si.kot_id === kot.id || si.kot_number === kot.kot_number);
          let kotItems: UnifiedKotItem[] = [];

          if (matchedSent.length > 0) {
            kotItems = matchedSent.map((m) => ({
              id: m.id,
              name: m.name,
              quantity: m.quantity,
              unitPrice: m.unit_price,
              totalPrice: m.total_price,
              instructions: m.special_instructions,
              status: m.status,
            }));
          } else if (kot.items && kot.items.length > 0) {
            kotItems = kot.items.map((ki) => {
              const matchingInSent = sess.sentItems.find((s) => s.name.startsWith(ki.name) || ki.name.startsWith(s.name));
              const uPrice = matchingInSent ? matchingInSent.unit_price : 180;
              return {
                id: ki.id,
                name: ki.name,
                quantity: ki.quantity,
                unitPrice: uPrice,
                totalPrice: uPrice * ki.quantity,
                instructions: ki.instructions,
                status: ki.status,
              };
            });
          } else {
            kotItems = sess.sentItems.map((s) => ({
              id: s.id,
              name: s.name,
              quantity: s.quantity,
              unitPrice: s.unit_price,
              totalPrice: s.total_price,
              status: s.status,
            }));
          }

          const kotSubtotal = kotItems.reduce((s, i) => s + i.totalPrice, 0);
          const kotTax = Math.round(kotSubtotal * 0.05);
          const kotGrandTotal = kotSubtotal + kotTax;

          list.push({
            id: kot.id,
            kotNumber: kot.kot_number,
            orderId: sess.orderId,
            orderNumber: sess.orderNumber,
            billNumber: billNum,
            orderType: "dine_in",
            tableId: sess.tableId,
            tableNumber: sess.tableNumber,
            waiterId: sess.waiterId,
            waiterName: defaultWaiter,
            createdAt: kot.created_at || sess.createdAt,
            sentAt: kot.sent_at || sess.kotSentAt,
            status: (kot.status as UnifiedKotTicket["status"]) || "sent",
            orderStatus: sess.status,
            paymentStatus: sess.paymentStatus,
            items: kotItems,
            subtotal: kotSubtotal || subtotal,
            taxAmount: kotTax || tax,
            discountAmount: discount,
            deliveryFee: 0,
            grandTotal: kotGrandTotal || grandTotal,
            source: "dine_in_session",
            billData: tableBillData,
          });
        });
      } else if (sess.sentItems.length > 0) {
        // Active table with sent items before formal KOT object
        const fallbackKotId = `kot_fallback_${sess.tableId}`;
        if (!seenKotIds.has(fallbackKotId)) {
          seenKotIds.add(fallbackKotId);
          list.push({
            id: fallbackKotId,
            kotNumber: sess.orderNumber ? `KOT-${sess.orderNumber.replace("ORD-", "")}` : "KOT-01",
            orderId: sess.orderId,
            orderNumber: sess.orderNumber,
            billNumber: billNum,
            orderType: "dine_in",
            tableId: sess.tableId,
            tableNumber: sess.tableNumber,
            waiterId: sess.waiterId,
            waiterName: defaultWaiter,
            createdAt: sess.createdAt,
            sentAt: sess.kotSentAt || sess.createdAt,
            status: "sent",
            orderStatus: sess.status,
            paymentStatus: sess.paymentStatus,
            items: sess.sentItems.map((si) => ({
              id: si.id,
              name: si.name,
              quantity: si.quantity,
              unitPrice: si.unit_price,
              totalPrice: si.total_price,
              status: si.status,
            })),
            subtotal,
            taxAmount: tax,
            discountAmount: discount,
            deliveryFee: 0,
            grandTotal,
            source: "dine_in_session",
            billData: tableBillData,
          });
        }
      }
    });

    // B. Extract from POS Store (Takeaway & Delivery)
    const allPos = [...Object.values(activeOrders), ...(orderHistory ? Object.values(orderHistory) : [])];
    allPos.forEach((posOrd: PosActiveOrder) => {
      const waiter = "Counter POS";
      const billNum = posOrd.billNumber || `BILL-${posOrd.orderNumber.replace("ORD-", "")}`;

      const posBillItems: BillItemData[] = posOrd.items.map((i) => ({
        name: i.menuItem.name + (i.variant ? ` (${i.variant.name})` : ""),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      }));

      const posBillData: BillData = {
        billNumber: billNum,
        kotNumber: posOrd.kots.map((k) => k.kot_number),
        orderNumber: posOrd.orderNumber,
        date: new Date(posOrd.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: new Date(posOrd.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        orderType: posOrd.orderType,
        tableNumber: posOrd.orderType === "takeaway" ? "Takeaway" : "Delivery",
        waiterName: waiter,
        customerName: posOrd.customerName,
        customerPhone: posOrd.customerPhone,
        deliveryAddress: posOrd.deliveryAddress,
        items: posBillItems,
        subtotal: posOrd.subtotal,
        taxAmount: posOrd.taxAmount,
        discountAmount: posOrd.discountAmount,
        deliveryFee: posOrd.deliveryFee,
        grandTotal: posOrd.totalAmount,
        paymentStatus: posOrd.paymentStatus,
      };

      if (posOrd.kots && posOrd.kots.length > 0) {
        posOrd.kots.forEach((k) => {
          if (seenKotIds.has(k.id)) return;
          seenKotIds.add(k.id);

          const items: UnifiedKotItem[] = (k.items || []).map((ki) => {
            const matchingCart = posOrd.items.find((ci) => ci.menuItem.name === ki.name || ki.name.startsWith(ci.menuItem.name));
            const uPrice = matchingCart ? matchingCart.unitPrice : 150;
            return {
              id: ki.id,
              name: ki.name,
              quantity: ki.quantity,
              unitPrice: uPrice,
              totalPrice: uPrice * ki.quantity,
              instructions: ki.instructions,
              status: ki.status,
            };
          });

          const sub = items.reduce((s, i) => s + i.totalPrice, 0) || posOrd.subtotal;
          const tax = Math.round(sub * 0.05);

          list.push({
            id: k.id,
            kotNumber: k.kot_number,
            orderId: posOrd.id,
            orderNumber: posOrd.orderNumber,
            billNumber: billNum,
            orderType: posOrd.orderType,
            tableNumber: posOrd.orderType === "takeaway" ? "Takeaway" : "Delivery",
            waiterName: waiter,
            customerName: posOrd.customerName,
            customerPhone: posOrd.customerPhone,
            createdAt: k.created_at || posOrd.createdAt,
            sentAt: k.sent_at || posOrd.kotSentAt,
            status: (k.status as UnifiedKotTicket["status"]) || "sent",
            orderStatus: posOrd.orderStatus,
            paymentStatus: posOrd.paymentStatus,
            items: items.length > 0 ? items : posBillItems.map((p) => ({ ...p, status: "sent" })),
            subtotal: sub,
            taxAmount: tax,
            discountAmount: posOrd.discountAmount,
            deliveryFee: posOrd.deliveryFee,
            grandTotal: sub + tax + posOrd.deliveryFee - posOrd.discountAmount,
            source: "pos_order",
            billData: posBillData,
          });
        });
      } else if (posOrd.kotStatus !== "not_sent") {
        const fallbackKotId = `kot_pos_${posOrd.id}`;
        if (!seenKotIds.has(fallbackKotId)) {
          seenKotIds.add(fallbackKotId);
          list.push({
            id: fallbackKotId,
            kotNumber: posOrd.orderNumber ? `KOT-${posOrd.orderNumber.replace(/^ORD-?/, "")}` : "KOT",
            orderId: posOrd.id,
            orderNumber: posOrd.orderNumber,
            billNumber: billNum,
            orderType: posOrd.orderType,
            tableNumber: posOrd.orderType === "takeaway" ? "Takeaway" : "Delivery",
            waiterName: waiter,
            customerName: posOrd.customerName,
            customerPhone: posOrd.customerPhone,
            createdAt: posOrd.createdAt,
            sentAt: posOrd.kotSentAt || posOrd.createdAt,
            status: posOrd.kotStatus as UnifiedKotTicket["status"],
            orderStatus: posOrd.orderStatus,
            paymentStatus: posOrd.paymentStatus,
            items: posBillItems.map((p) => ({ ...p, status: "sent" })),
            subtotal: posOrd.subtotal,
            taxAmount: posOrd.taxAmount,
            discountAmount: posOrd.discountAmount,
            deliveryFee: posOrd.deliveryFee,
            grandTotal: posOrd.totalAmount,
            source: "pos_order",
            billData: posBillData,
          });
        }
      }
    });

    // C. Extract from Remote Database if not already captured
    if (Array.isArray(remoteTickets)) {
      remoteTickets.forEach((rt: any) => {
        if (seenKotIds.has(rt.id)) return;
        seenKotIds.add(rt.id);

        const tblNum = rt.table?.table_number || (rt.table_id ? `T-${rt.table_id.slice(-2)}` : rt.order_type === "takeaway" ? "Takeaway" : "Delivery");
        const orderNum = rt.order?.order_number || `ORD-${rt.order_id?.slice(-4) || "1001"}`;
        const billNum = `BILL-${orderNum.replace("ORD-", "")}`;
        const sub = Number(rt.order?.subtotal) || 0;
        const disc = Number(rt.order?.discount_amount) || 0;
        const tax = Number(rt.order?.tax_amount) || Math.round(sub * 0.05);
        const tot = Number(rt.order?.total_amount) || (sub - disc + tax);

        const items: UnifiedKotItem[] = (rt.items || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Math.round(sub / (rt.items.length || 1)),
          totalPrice: Math.round(sub / (rt.items.length || 1)) * i.quantity,
          instructions: i.instructions,
          status: i.status,
        }));

        const remoteBillData: BillData = {
          billNumber: billNum,
          kotNumber: rt.kot_number,
          orderNumber: orderNum,
          date: new Date(rt.created_at).toLocaleDateString("en-IN"),
          time: new Date(rt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          orderType: rt.order_type || "dine_in",
          tableNumber: tblNum,
          waiterName: "Floor Staff",
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
          subtotal: sub,
          taxAmount: tax,
          discountAmount: disc,
          grandTotal: tot,
          paymentStatus: rt.order?.payment_status || "paid",
        };

        list.push({
          id: rt.id,
          kotNumber: rt.kot_number,
          orderId: rt.order_id,
          orderNumber: orderNum,
          billNumber: billNum,
          orderType: rt.order_type || "dine_in",
          tableId: rt.table_id,
          tableNumber: tblNum,
          waiterName: "Floor Staff",
          createdAt: rt.created_at,
          sentAt: rt.sent_at || rt.created_at,
          status: rt.status,
          orderStatus: rt.order?.status || "confirmed",
          paymentStatus: rt.order?.payment_status || "paid",
          items,
          subtotal: sub,
          taxAmount: tax,
          discountAmount: disc,
          deliveryFee: 0,
          grandTotal: tot,
          source: "database",
          billData: remoteBillData,
        });
      });
    }

    // Sort newest first
    return list.sort((a, b) => {
      const ta = new Date(a.sentAt || a.createdAt).getTime();
      const tb = new Date(b.sentAt || b.createdAt).getTime();
      return tb - ta;
    });
  }, [sessions, activeOrders, orderHistory, remoteTickets]);

  // 3. Extract unique filter options
  const filterOptions = React.useMemo(() => {
    const tables = Array.from(new Set(allTickets.map((t) => t.tableNumber))).filter(Boolean).sort();
    const waiters = Array.from(new Set(allTickets.map((t) => t.waiterName))).filter(Boolean).sort();
    return { tables, waiters };
  }, [allTickets]);

  // 4. Filter Tickets based on passed options
  const filteredTickets = React.useMemo(() => {
    return allTickets.filter((t) => {
      // Waiter-only constraint (Waiter Dashboard KOT tab)
      if (options.waiterOnlyName) {
        const waiterNormalized = options.waiterOnlyName.toLowerCase();
        const ticketWaiterNormalized = t.waiterName.toLowerCase();
        const matchesWaiter =
          ticketWaiterNormalized.includes(waiterNormalized) ||
          waiterNormalized.includes(ticketWaiterNormalized) ||
          ticketWaiterNormalized === "waiter" ||
          ticketWaiterNormalized === "staff";
        if (!matchesWaiter) return false;
      }

      // Filter by Table
      if (options.tableFilter && options.tableFilter !== "all") {
        if (t.tableNumber !== options.tableFilter) return false;
      }

      // Filter by Waiter
      if (options.waiterFilter && options.waiterFilter !== "all") {
        if (t.waiterName !== options.waiterFilter) return false;
      }

      // Filter by Order Type
      if (options.orderTypeFilter && options.orderTypeFilter !== "all") {
        if (t.orderType !== options.orderTypeFilter) return false;
      }

      // Filter by Status
      if (options.statusFilter && options.statusFilter !== "all") {
        if (options.statusFilter === "pending") {
          if (t.status !== "sent" && t.status !== "preparing") return false;
        } else if (options.statusFilter === "ready") {
          if (t.status !== "ready") return false;
        } else if (options.statusFilter === "served") {
          if (t.status !== "served" && t.status !== "completed") return false;
        } else if (t.status !== options.statusFilter) {
          return false;
        }
      }

      // Filter by Date
      if (options.dateFilter && options.dateFilter !== "all") {
        const ticketDate = new Date(t.createdAt).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        if (options.dateFilter === "today") {
          if (ticketDate !== today) return false;
        } else if (options.dateFilter === "yesterday") {
          const yesterday = today - 86400000;
          if (ticketDate !== yesterday) return false;
        }
      }

      // Search Query
      if (options.searchQuery && options.searchQuery.trim()) {
        const q = options.searchQuery.trim().toLowerCase();
        const matchesKot = t.kotNumber.toLowerCase().includes(q);
        const matchesBill = t.billNumber.toLowerCase().includes(q);
        const matchesTable = t.tableNumber.toLowerCase().includes(q);
        const matchesWaiter = t.waiterName.toLowerCase().includes(q);
        const matchesCust = (t.customerName || "").toLowerCase().includes(q);
        const matchesItem = t.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesKot && !matchesBill && !matchesTable && !matchesWaiter && !matchesCust && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [allTickets, options]);

  return {
    tickets: filteredTickets,
    allTickets,
    filterOptions,
    totalCount: allTickets.length,
    cookingCount: allTickets.filter((t) => t.status === "sent" || t.status === "preparing").length,
    readyCount: allTickets.filter((t) => t.status === "ready").length,
    servedCount: allTickets.filter((t) => t.status === "served" || t.status === "completed").length,
  };
}
