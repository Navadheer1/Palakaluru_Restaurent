"use client";

import * as React from "react";
import { Bike, Search, CheckCircle2, Clock, MapPin, Phone, Truck, Sparkles, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { usePosStore } from "@/stores/usePosStore";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";

interface DeliveryItem {
  id: string;
  orderId: string;
  internalId?: string;
  customer: string;
  phone: string;
  address: string;
  amount: number;
  status: string;
  rider: string;
  time: string;
}

const fallbackDeliveryOrders: DeliveryItem[] = [
  {
    id: "DEL-801",
    orderId: "ORD-1047",
    customer: "Srinivas Rao",
    phone: "+91 98480 11223",
    address: "Flat 302, Green Meadows, Palakaluru",
    amount: 1100,
    status: "out_for_delivery",
    rider: "Ramesh Rider (Bike #02)",
    time: "Dispatched 8m ago",
  },
  {
    id: "DEL-802",
    orderId: "ORD-1043",
    customer: "Venkat Reddy",
    phone: "+91 99887 66554",
    address: "H.No 4-12, Near Temple, Palakaluru",
    amount: 850,
    status: "ready_for_delivery",
    rider: "Unassigned",
    time: "Waiting 4m",
  },
];

export default function DeliveryPage() {
  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const { activeOrders, updateDeliveryStatus, selectActiveOrder } = usePosStore();
  const [notice, setNotice] = React.useState<string | null>(null);

  useRealtimeSync(restaurantId);

  // Live delivery orders from PosStore
  const liveDeliveries = React.useMemo(() => {
    return Object.values(activeOrders)
      .filter((o) => o.orderType === "delivery")
      .map((o) => ({
        id: `DEL-${o.orderNumber.slice(-3)}`,
        orderId: o.orderNumber,
        internalId: o.id,
        customer: o.customerName || "Customer",
        phone: o.customerPhone || "N/A",
        address: o.deliveryAddress || "Address on File",
        amount: o.totalAmount,
        status: o.deliveryStatus,
        rider: o.deliveryStatus === "out_for_delivery" ? "Assigned Rider" : o.deliveryStatus === "delivered" ? "Delivered" : "Pending Dispatch",
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
  }, [activeOrders]);

  const displayOrders = liveDeliveries.length > 0 ? liveDeliveries : fallbackDeliveryOrders;

  const handleStatusAdvance = async (internalId: string | undefined, targetStatus: "packed" | "out_for_delivery" | "delivered") => {
    if (internalId) {
      selectActiveOrder(internalId);
      await updateDeliveryStatus(restaurantId, targetStatus);
      setNotice(`Order moved to ${targetStatus.replace(/_/g, " ").toUpperCase()}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <Bike className="h-6 w-6 mr-2 text-brand-600" />
            Delivery Dispatch & Rider Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Progressive workflow: Packed → Out for Delivery → Delivered
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0 duration-150">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayOrders.map((del) => {
          const isDelivered = del.status === "delivered";
          const isOut = del.status === "out_for_delivery";

          return (
            <div key={del.id} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-bold text-sm text-brand-600">{del.id}</span>
                  <span className="text-xs text-slate-400 ml-2">({del.orderId})</span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{del.customer}</h3>
                </div>
                <Badge variant={isDelivered ? "success" : isOut ? "info" : "warning"} className="font-extrabold text-[10px]">
                  {del.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span>{del.phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0 mt-0.5" />
                  <span>{del.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Total Amount</p>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(del.amount)}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {"internalId" in del && del.internalId ? (
                    !isOut && !isDelivered ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusAdvance(del.internalId, "out_for_delivery")}
                        className="text-xs space-x-1 bg-sky-600 hover:bg-sky-700"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Dispatch Rider</span>
                      </Button>
                    ) : isOut ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusAdvance(del.internalId, "delivered")}
                        className="text-xs space-x-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Mark Delivered</span>
                      </Button>
                    ) : (
                      <Badge variant="success">Completed</Badge>
                    )
                  ) : (
                    <Badge variant={isOut ? "info" : "default"}>{del.rider}</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
