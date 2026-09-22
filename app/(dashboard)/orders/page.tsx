"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Edit3,
  Send,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  ChefHat,
  Bike,
  PackageCheck,
  UtensilsCrossed,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { useOrders } from "@/lib/hooks/useOrders";
import { usePosStore, PosActiveOrder } from "@/stores/usePosStore";
import { useDineInStore } from "@/stores/useDineInStore";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { KotStatus, PaymentStatus, OrderStatus, DeliveryStatus } from "@/lib/constants";
import { TableOrderModal } from "@/components/tables/TableOrderModal";

interface UnifiedOrderRow {
  id: string; // internal id
  orderNumber: string;
  type: string;
  orderSource: "waiter" | "admin_pos"; // 'waiter' for Dine-In tables, 'admin_pos' for Admin Takeaways & Deliveries
  waiterName?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  tableOrCustomer: string;
  tableId?: string;
  tableNumber?: string;
  itemsCount: number;
  total: number;
  paymentStatus: PaymentStatus;
  kotStatus: KotStatus;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  time: string;
  items?: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  kots?: { kot_number: string; status: string; sent_at?: string | null; items?: { name: string; quantity: number }[] }[];
  isPosLocal?: boolean;
}

const sampleFallbackOrders: UnifiedOrderRow[] = [
  {
    id: "sample-1",
    orderNumber: "ORD-1048",
    type: "Dine In",
    orderSource: "waiter",
    waiterName: "R. Naresh",
    tableOrCustomer: "Table 04",
    tableNumber: "04",
    itemsCount: 3,
    total: 400,
    paymentStatus: "paid",
    kotStatus: "ready",
    orderStatus: "ready",
    deliveryStatus: "not_applicable",
    time: "12:42 PM",
    items: [
      { name: "Special Dum Chicken Biryani", quantity: 1, unitPrice: 280, totalPrice: 280 },
      { name: "Garlic Butter Naan", quantity: 2, unitPrice: 60, totalPrice: 120 },
    ],
    kots: [
      { kot_number: "KOT #101", status: "ready", items: [{ name: "Special Dum Chicken Biryani", quantity: 1 }] },
    ],
  },
  {
    id: "sample-2",
    orderNumber: "ORD-1047",
    type: "Delivery",
    orderSource: "admin_pos",
    waiterName: "Admin POS",
    tableOrCustomer: "Srinivas Rao",
    customerName: "Srinivas Rao",
    customerPhone: "9848011223",
    itemsCount: 3,
    total: 1100,
    paymentStatus: "paid",
    kotStatus: "preparing",
    orderStatus: "preparing",
    deliveryStatus: "packed",
    time: "12:35 PM",
  },
  {
    id: "sample-3",
    orderNumber: "ORD-1046",
    type: "Takeaway",
    orderSource: "admin_pos",
    waiterName: "Admin POS",
    tableOrCustomer: "Mohan Krishna",
    customerName: "Mohan Krishna",
    customerPhone: "9988233441",
    itemsCount: 2,
    total: 580,
    paymentStatus: "paid",
    kotStatus: "not_sent",
    orderStatus: "paid",
    deliveryStatus: "not_applicable",
    time: "12:20 PM",
  },
];

export default function OrdersPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const { activeRole } = useRolePermissions();
  const isWaiter = activeRole === "waiter";
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  useRealtimeSync(restaurantId);

  const [page, setPage] = React.useState(1);
  const [orderSourceTab, setOrderSourceTab] = React.useState<"all" | "waiter" | "admin_pos">("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedOrderForView, setSelectedOrderForView] = React.useState<UnifiedOrderRow | null>(null);
  const [selectedTableForModal, setSelectedTableForModal] = React.useState<{ id: string; number: string } | null>(null);

  const { activeOrders, orderHistory, selectActiveOrder, startPostPaymentEdit, startAddItems, manuallySendKot } = usePosStore();
  const { sessions } = useDineInStore();

  const { data, isLoading } = useOrders(restaurantId, {
    page,
    pageSize: 25,
    status: statusFilter,
    search: searchQuery,
  });

  // Extract from PosStore (Takeaway & Delivery orders created by Admin in POS)
  const localPosOrders: UnifiedOrderRow[] = React.useMemo(() => {
    const allPos = [...Object.values(activeOrders), ...(orderHistory ? Object.values(orderHistory) : [])];
    return allPos.map((ord) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      type: ord.orderType === "takeaway" ? "Takeaway" : "Delivery",
      orderSource: "admin_pos" as const,
      waiterName: "Admin POS",
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      deliveryAddress: ord.deliveryAddress,
      tableOrCustomer: ord.orderType === "delivery" ? ord.customerName || "Delivery Customer" : (ord.customerName ? `${ord.customerName} (Takeaway)` : "Counter Takeaway"),
      itemsCount: ord.items.reduce((s, i) => s + i.quantity, 0),
      total: ord.totalAmount,
      paymentStatus: ord.paymentStatus,
      kotStatus: ord.kotStatus,
      orderStatus: ord.orderStatus,
      deliveryStatus: ord.deliveryStatus,
      time: new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: ord.items.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      kots: ord.kots.map((k) => ({
        kot_number: k.kot_number,
        status: k.status,
        sent_at: k.sent_at,
        items: k.items?.map((ki) => ({ name: ki.name, quantity: ki.quantity })),
      })),
      isPosLocal: true,
    }));
  }, [activeOrders, orderHistory]);

  // Extract from DineIn sessions (Orders taken by Waiters on dining tables)
  const localDineInOrders: UnifiedOrderRow[] = React.useMemo(() => {
    return Object.values(sessions).map((sess) => ({
      id: sess.orderId,
      orderNumber: sess.orderNumber,
      type: "Dine In",
      orderSource: "waiter" as const,
      waiterName: sess.waiterName || (profile?.full_name && isWaiter ? profile.full_name : "Waiter"),
      tableOrCustomer: `Table ${sess.tableNumber}`,
      tableId: sess.tableId,
      tableNumber: sess.tableNumber,
      itemsCount: sess.sentItems.length + sess.unsentItems.length,
      total: sess.bill?.final_total || sess.sentItems.reduce((s, i) => s + i.total_price, 0) * 1.05,
      paymentStatus: sess.paymentStatus,
      kotStatus: sess.kotStatus,
      orderStatus: sess.status,
      deliveryStatus: "not_applicable",
      time: new Date(sess.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: [
        ...sess.sentItems.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unit_price, totalPrice: i.total_price })),
        ...sess.unsentItems.map((i) => ({ name: i.menuItem.name, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
      ],
      kots: sess.kots.map((k) => ({
        kot_number: k.kot_number,
        status: k.status,
        sent_at: k.sent_at,
        items: k.items?.map((ki) => ({ name: ki.name, quantity: ki.quantity })),
      })),
    }));
  }, [sessions, profile, isWaiter]);

  // Combine remote database orders + local active orders
  const baseOrdersList: UnifiedOrderRow[] = React.useMemo(() => {
    const dbFormatted: UnifiedOrderRow[] = (data?.orders && data.orders.length > 0)
      ? data.orders.map((o) => {
          const isDineIn = o.order_type === "dine_in";
          return {
            id: o.id,
            orderNumber: o.order_number,
            type: isDineIn ? "Dine In" : o.order_type === "delivery" ? "Delivery" : "Takeaway",
            orderSource: isDineIn ? ("waiter" as const) : ("admin_pos" as const),
            waiterName: isDineIn ? "Waiter" : "Admin POS",
            tableOrCustomer: o.table_id ? `Table ${o.table_id.slice(-2)}` : (isDineIn ? "Dine-In Table" : "Counter Customer"),
            itemsCount: 1,
            total: Number(o.total_amount),
            paymentStatus: o.payment_status || "paid",
            kotStatus: o.kot_status || "sent",
            orderStatus: o.status,
            deliveryStatus: o.delivery_status || "not_applicable",
            time: new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
        })
      : [];

    const baseList = isWaiter
      ? [...localDineInOrders, ...dbFormatted.filter((d) => d.orderSource === "waiter")]
      : [...localPosOrders, ...localDineInOrders];

    for (const d of dbFormatted) {
      if (!baseList.some((c) => c.orderNumber === d.orderNumber)) {
        if (!isWaiter || d.orderSource === "waiter") {
          baseList.push(d);
        }
      }
    }

    return baseList.length > 0 ? baseList : sampleFallbackOrders;
  }, [localPosOrders, localDineInOrders, data, isWaiter]);

  // Source Type Counts
  const waiterOrdersCount = React.useMemo(
    () => baseOrdersList.filter((o) => o.orderSource === "waiter").length,
    [baseOrdersList]
  );
  const adminPosOrdersCount = React.useMemo(
    () => baseOrdersList.filter((o) => o.orderSource === "admin_pos").length,
    [baseOrdersList]
  );

  // Filtered orders based on Order Source and Status Filter
  const orders: UnifiedOrderRow[] = React.useMemo(() => {
    let list = baseOrdersList;

    // 1. Filter by 2 Order Types (Waiter vs Admin POS)
    if (orderSourceTab !== "all") {
      list = list.filter((o) => o.orderSource === orderSourceTab);
    }

    // 2. Filter by Status
    if (statusFilter !== "all") {
      list = list.filter((o) => {
        if (statusFilter === "active") return o.orderStatus !== "completed" && o.paymentStatus !== "paid";
        if (statusFilter === "preparing") return o.kotStatus === "preparing" || o.kotStatus === "sent";
        if (statusFilter === "ready") return o.kotStatus === "ready";
        if (statusFilter === "bill_requested") return o.orderStatus === "bill_requested";
        if (statusFilter === "bill_ready") return o.orderStatus === "bill_generated" || o.orderStatus === "payment_pending";
        if (statusFilter === "completed") return o.orderStatus === "completed" || o.paymentStatus === "paid";
        return o.orderStatus === statusFilter || o.kotStatus === statusFilter;
      });
    }

    return list;
  }, [baseOrdersList, orderSourceTab, statusFilter]);

  const totalPages = data?.totalPages || 1;

  // Contextual actions
  const handleEditOrderInPos = (order: UnifiedOrderRow) => {
    if (order.isPosLocal) {
      selectActiveOrder(order.id);
      startPostPaymentEdit();
      router.push("/pos");
    }
  };

  const handleAddItemsInPos = (order: UnifiedOrderRow) => {
    if (order.isPosLocal) {
      selectActiveOrder(order.id);
      startAddItems();
      router.push("/pos");
    }
  };

  const handleDirectSendKot = async (order: UnifiedOrderRow) => {
    if (order.isPosLocal) {
      selectActiveOrder(order.id);
      await manuallySendKot(restaurantId, profile?.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Order Management
            </h1>
            <span className="text-[10px] font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Decoupled tracking: Payment Status, KOT Dispatch, and Kitchen Progress
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-80">
          <Input
            placeholder="Search Order ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* 2 Primary Order Divisions: Waiter Orders vs Admin POS Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: All Orders */}
        <button
          onClick={() => {
            setOrderSourceTab("all");
            setPage(1);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            orderSourceTab === "all"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider">All Orders</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${orderSourceTab === "all" ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
              {baseOrdersList.length}
            </span>
          </div>
          <p className={`text-[11px] mt-1 line-clamp-1 ${orderSourceTab === "all" ? "opacity-80" : "text-slate-400"}`}>
            Unified consolidated feed
          </p>
        </button>

        {/* Card 2: Waiter Orders (Dine-In Tables) */}
        <button
          onClick={() => {
            setOrderSourceTab(orderSourceTab === "waiter" ? "all" : "waiter");
            setPage(1);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
            orderSourceTab === "waiter"
              ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/50"
              : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 hover:border-purple-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-xs font-extrabold">🍽️ Waiter Orders</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${orderSourceTab === "waiter" ? "bg-white/20 text-white" : "bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200"}`}>
              {waiterOrdersCount}
            </span>
          </div>
          <p className={`text-[11px] mt-1 line-clamp-1 ${orderSourceTab === "waiter" ? "opacity-85" : "text-purple-700/70 dark:text-purple-300/70"}`}>
            Dine-In tables taken by Waiters
          </p>
        </button>

        {/* Card 3: Admin POS Orders (Takeaways & Deliveries) */}
        <button
          onClick={() => {
            setOrderSourceTab(orderSourceTab === "admin_pos" ? "all" : "admin_pos");
            setPage(1);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
            orderSourceTab === "admin_pos"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-400/50"
              : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <PackageCheck className="h-4 w-4" />
              <span className="text-xs font-extrabold">🛍️ Admin Orders</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${orderSourceTab === "admin_pos" ? "bg-white/20 text-white" : "bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200"}`}>
              {adminPosOrdersCount}
            </span>
          </div>
          <p className={`text-[11px] mt-1 line-clamp-1 ${orderSourceTab === "admin_pos" ? "opacity-85" : "text-amber-700/70 dark:text-amber-300/70"}`}>
            Takeaways & Deliveries from POS
          </p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {(isWaiter
          ? [
              { id: "all", label: "All Tables" },
              { id: "active", label: "Active Dining" },
              { id: "preparing", label: "KOT Preparing" },
              { id: "ready", label: "KOT Ready" },
              { id: "bill_requested", label: "Bill Requested" },
              { id: "bill_ready", label: "Bill Ready" },
              { id: "completed", label: "Completed" },
            ]
          : [
              { id: "all", label: "All" },
              { id: "paid", label: "Paid" },
              { id: "not_sent", label: "Not Sent" },
              { id: "sent", label: "Sent" },
              { id: "preparing", label: "Preparing" },
              { id: "ready", label: "Ready" },
              { id: "completed", label: "Completed" },
            ]
        ).map((st) => (
          <button
            key={st.id}
            onClick={() => {
              setStatusFilter(st.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              statusFilter === st.id
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Orders Table with Decoupled Status Columns & Contextual Actions */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Source / Origin</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Table / Customer</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">KOT Status</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {orders.map((ord) => {
                const canEdit = ord.paymentStatus === "paid" && ord.kotStatus === "not_sent";
                const isKotDispatched = ord.kotStatus === "sent" || ord.kotStatus === "preparing" || ord.kotStatus === "ready";

                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-brand-600">{ord.orderNumber}</td>
                    <td className="p-3.5">
                      {ord.orderSource === "waiter" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800">
                          <UtensilsCrossed className="h-3 w-3 text-purple-600 shrink-0" />
                          <span>Waiter ({ord.waiterName || "Staff"})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800">
                          <PackageCheck className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Admin POS</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium">
                      <span className="flex items-center space-x-1">
                        {ord.type === "Dine In" && <UtensilsCrossed className="h-3 w-3 text-slate-400" />}
                        {ord.type === "Takeaway" && <PackageCheck className="h-3 w-3 text-slate-400" />}
                        {ord.type === "Delivery" && <Bike className="h-3 w-3 text-slate-400" />}
                        <span>{ord.type}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {ord.tableOrCustomer}
                      </div>
                      <div className="text-[10px] text-slate-400">{ord.itemsCount} dishes</div>
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(ord.total)}
                    </td>
                    {/* 1. Payment Status */}
                    <td className="p-3.5">
                      <Badge
                        variant={
                          ord.paymentStatus === "paid"
                            ? "success"
                            : ord.paymentStatus === "payment_adjusted"
                            ? "info"
                            : "warning"
                        }
                        className="font-extrabold text-[10px]"
                      >
                        {ord.paymentStatus.toUpperCase().replace("_", " ")}
                      </Badge>
                    </td>

                    {/* 2. KOT Status */}
                    <td className="p-3.5">
                      <Badge
                        variant={
                          ord.kotStatus === "not_sent"
                            ? "warning"
                            : ord.kotStatus === "ready"
                            ? "success"
                            : "info"
                        }
                        className="font-extrabold text-[10px]"
                      >
                        {ord.kotStatus === "not_sent"
                          ? "🟡 KOT NOT SENT"
                          : ord.kotStatus === "ready"
                          ? "🟢 READY"
                          : "🔵 KOT SENT"}
                      </Badge>
                    </td>

                    {/* 3. Order Status */}
                    <td className="p-3.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {ord.orderStatus}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-400">{ord.time}</td>

                    {/* 4. Contextual Actions based on Order & KOT Status */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {ord.tableId ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedTableForModal({ id: ord.tableId!, number: ord.tableNumber || "01" })}
                            className="h-7 px-2.5 text-[11px] font-bold bg-brand-600 hover:bg-brand-700"
                          >
                            Manage Table
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderForView(ord)}
                          className="h-7 px-2 text-[11px]"
                          title="View Order Details"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>

                        {/* If Paid & KOT Not Sent: Show [ EDIT ] and [ SEND KOT ] */}
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrderInPos(ord)}
                              className="h-7 px-2 text-[11px] text-amber-700 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleDirectSendKot(ord)}
                              className="h-7 px-2 text-[11px] font-bold bg-brand-600 hover:bg-brand-700"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send KOT
                            </Button>
                          </>
                        )}

                        {/* If KOT is Sent: Show [ ADD ITEMS ] */}
                        {isKotDispatched && ord.orderStatus !== "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddItemsInPos(ord)}
                            className="h-7 px-2 text-[11px] text-brand-600 border-brand-300 hover:bg-brand-50"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            + Add Items
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing Page {page} of {totalPages}</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Order & KOT Inspection Modal */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedOrderForView.orderNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedOrderForView.type} • {selectedOrderForView.tableOrCustomer}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForView(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Order Source / Creator Origin */}
              <div className="p-3 rounded-xl border flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Order Origin</span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    {selectedOrderForView.orderSource === "waiter" ? (
                      <>
                        <UtensilsCrossed className="h-3.5 w-3.5 text-purple-600" />
                        <span>Waiter Order — {selectedOrderForView.waiterName || "Staff"} ({selectedOrderForView.tableOrCustomer})</span>
                      </>
                    ) : (
                      <>
                        <PackageCheck className="h-3.5 w-3.5 text-amber-600" />
                        <span>Admin Order — POS {selectedOrderForView.type}</span>
                      </>
                    )}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedOrderForView.orderSource === "waiter"
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                }`}>
                  {selectedOrderForView.orderSource === "waiter" ? "Dine-In Table" : `POS ${selectedOrderForView.type}`}
                </span>
              </div>

              {/* Status Pills Summary */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payment Status</span>
                  <span className="font-extrabold text-emerald-600 uppercase">{selectedOrderForView.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">KOT Status</span>
                  <span className="font-extrabold text-brand-600 uppercase">{selectedOrderForView.kotStatus.replace("_", " ")}</span>
                </div>
              </div>

              {/* Items breakdown */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Order Items</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                  {selectedOrderForView.items?.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center bg-white dark:bg-slate-900">
                      <div>
                        <span className="font-bold">{it.quantity}× {it.name}</span>
                      </div>
                      <span className="font-extrabold">{formatCurrency(it.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatched KOTs */}
              {selectedOrderForView.kots && selectedOrderForView.kots.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Dispatched KOT Tickets</h4>
                  <div className="space-y-2">
                    {selectedOrderForView.kots.map((k, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-brand-600">{k.kot_number}</span>
                          <Badge variant="info" className="text-[10px] uppercase font-bold">{k.status}</Badge>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {k.items?.map((ki) => `${ki.quantity}× ${ki.name}`).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrderForView(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Order Modal for Dine-In Table Management */}
      {selectedTableForModal && (
        <TableOrderModal
          isOpen={!!selectedTableForModal}
          onClose={() => setSelectedTableForModal(null)}
          tableId={selectedTableForModal.id}
          tableNumber={selectedTableForModal.number}
        />
      )}
    </div>
  );
}
