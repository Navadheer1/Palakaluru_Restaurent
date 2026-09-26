"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Send,
  PlusCircle,
  Clock,
  CheckCircle2,
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
import { useOrders } from "@/lib/hooks/useOrders";
import { usePosStore } from "@/stores/usePosStore";
import { useDineInStore } from "@/stores/useDineInStore";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { KotStatus, PaymentStatus, OrderStatus, DeliveryStatus, UserRole } from "@/lib/constants";
import { TableOrderModal } from "@/components/tables/TableOrderModal";

interface UnifiedOrderRow {
  id: string;
  orderNumber: string;
  type: string;
  orderSource: "waiter" | "admin_pos";
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

interface OrdersViewProps {
  role: UserRole;
}

export function OrdersView({ role }: OrdersViewProps) {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const isWaiter = role === "waiter";
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  useRealtimeSync(restaurantId);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [page, setPage] = React.useState(1);
  const [orderSourceTab, setOrderSourceTab] = React.useState<"all" | "waiter" | "admin_pos">(
    isWaiter ? "waiter" : "all"
  );
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

  // Extract from PosStore
  const localPosOrders: UnifiedOrderRow[] = React.useMemo(() => {
    if (!mounted || isWaiter) return [];
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
      tableOrCustomer: ord.customerName || (ord.orderType === "takeaway" ? "Takeaway Customer" : "Delivery Guest"),
      itemsCount: ord.items.reduce((s, i) => s + i.quantity, 0),
      total: ord.totalAmount,
      paymentStatus: ord.paymentStatus,
      kotStatus: ord.kotStatus,
      orderStatus: ord.orderStatus,
      deliveryStatus: ord.deliveryStatus,
      time: new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: ord.items.map((i) => ({
        name: i.menuItem?.name || "Item",
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      kots: ord.kots?.map((k) => ({ kot_number: k.kot_number, status: k.status, sent_at: k.sent_at, items: k.items?.map((ki) => ({ name: ki.name, quantity: ki.quantity })) })),
      isPosLocal: true,
    }));
  }, [activeOrders, orderHistory, isWaiter, mounted]);

  // Extract active Dine-In sessions
  const localDineInOrders: UnifiedOrderRow[] = React.useMemo(() => {
    if (!mounted) return [];
    return Object.values(sessions).map((sess) => ({
      id: sess.tableId,
      orderNumber: sess.bill?.bill_number || `TBL-${sess.tableNumber}`,
      type: "Dine In",
      orderSource: "waiter" as const,
      waiterName: sess.waiterName || (profile?.full_name && isWaiter ? profile.full_name : "Waiter"),
      tableOrCustomer: `Table ${sess.tableNumber}`,
      tableId: sess.tableId,
      tableNumber: sess.tableNumber,
      itemsCount: sess.sentItems.length + sess.unsentItems.length,
      total: sess.bill?.final_total || sess.sentItems.reduce((s, i) => s + i.total_price, 0),
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
  }, [sessions, profile, isWaiter, mounted]);

  // Combined order list
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

    return baseList;
  }, [localPosOrders, localDineInOrders, data, isWaiter]);

  // Filtered orders
  const orders: UnifiedOrderRow[] = React.useMemo(() => {
    let list = baseOrdersList;
    if (orderSourceTab !== "all") {
      list = list.filter((o) => o.orderSource === orderSourceTab);
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => {
        if (statusFilter === "active") return o.orderStatus !== "completed" && o.paymentStatus !== "paid";
        if (statusFilter === "preparing") return o.kotStatus === "preparing" || o.kotStatus === "sent";
        if (statusFilter === "ready") return o.kotStatus === "ready";
        if (statusFilter === "bill_requested") return o.orderStatus === "bill_requested";
        if (statusFilter === "completed") return o.orderStatus === "completed" || o.paymentStatus === "paid";
        return o.orderStatus === statusFilter || o.kotStatus === statusFilter;
      });
    }
    return list;
  }, [baseOrdersList, orderSourceTab, statusFilter]);

  const posRoute = role === "cashier" ? "/cashier/pos" : "/admin/pos";

  const handleEditOrderInPos = (order: UnifiedOrderRow) => {
    if (order.isPosLocal && !isWaiter) {
      selectActiveOrder(order.id);
      startPostPaymentEdit();
      router.push(posRoute);
    }
  };

  const handleAddItemsInPos = (order: UnifiedOrderRow) => {
    if (order.isPosLocal && !isWaiter) {
      selectActiveOrder(order.id);
      startAddItems();
      router.push(posRoute);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isWaiter ? "My Waiter Orders" : "Order Management"}
            </h1>
            <span className="text-[10px] font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {isWaiter
              ? "Live tracking of all your assigned dining floor orders and KOTs"
              : "Decoupled tracking: Payment Status, KOT Dispatch, and Kitchen Progress"}
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {["all", "active", "preparing", "ready", "bill_requested", "completed"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              statusFilter === st
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Order</th>
              <th className="p-3.5">Destination</th>
              <th className="p-3.5">Payment</th>
              <th className="p-3.5">KOT State</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {!mounted || isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <span>Loading orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                  No orders matching the criteria.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {o.orderNumber}
                    <span className="block text-[10px] text-slate-400 font-normal">{o.time}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{o.tableOrCustomer}</span>
                    <span className="block text-[10px] text-slate-400">{o.type}</span>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"}>
                      {o.paymentStatus.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={o.kotStatus === "ready" ? "success" : o.kotStatus === "preparing" ? "warning" : "default"}>
                      {o.kotStatus.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {o.tableId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTableForModal({ id: o.tableId!, number: o.tableNumber || "01" })}
                        className="text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Table Order
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrderForView(o)}
                        className="text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    )}

                    {!isWaiter && o.isPosLocal && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddItemsInPos(o)}
                        className="text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Items
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Order Modal */}
      {selectedTableForModal && (
        <TableOrderModal
          isOpen={!!selectedTableForModal}
          onClose={() => setSelectedTableForModal(null)}
          tableId={selectedTableForModal.id}
          tableNumber={selectedTableForModal.number}
          role={role}
        />
      )}
    </div>
  );
}
