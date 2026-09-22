"use client";

import * as React from "react";
import { ChefHat, Clock, CheckCircle2, Flame, AlertCircle, Sparkles, Send, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useKds, KotTicketRecord } from "@/lib/hooks/useKds";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { useDineInStore } from "@/stores/useDineInStore";
import { usePosStore } from "@/stores/usePosStore";
import { KotStatus } from "@/lib/constants";

interface UnifiedTicket {
  id: string;
  kotNumber: string;
  orderNumber: string;
  tableOrCustomer: string;
  type: string;
  elapsedTime: string;
  timeCreated: string;
  timeSent: string;
  status: "new" | "sent" | "preparing" | "ready";
  isUrgent?: boolean;
  notes?: string | null;
  items: { name: string; qty: number; instructions?: string }[];
}

const mockKdsFallback: UnifiedTicket[] = [
  {
    id: "kot-1",
    kotNumber: "KOT #501",
    orderNumber: "ORD-1049",
    tableOrCustomer: "Counter (Takeaway)",
    type: "TAKEAWAY",
    elapsedTime: "2m",
    timeCreated: "11:40 AM",
    timeSent: "11:42 AM",
    status: "sent",
    items: [
      { name: "Special Dum Chicken Biryani", qty: 2, instructions: "Medium spicy" },
      { name: "Garlic Butter Naan", qty: 3 },
    ],
  },
  {
    id: "kot-2",
    kotNumber: "KOT #103",
    orderNumber: "ORD-1048",
    tableOrCustomer: "Table 01",
    type: "DINE IN",
    elapsedTime: "12m",
    timeCreated: "11:32 AM",
    timeSent: "11:34 AM",
    status: "preparing",
    isUrgent: true,
    items: [
      { name: "Mutton Ghee Roast Biryani", qty: 1 },
      { name: "Guntur Chilli Chicken", qty: 1, instructions: "Extra curry leaves" },
    ],
  },
  {
    id: "kot-3",
    kotNumber: "KOT #502",
    orderNumber: "ORD-1047",
    tableOrCustomer: "Srinivas Rao (Delivery)",
    type: "DELIVERY",
    elapsedTime: "18m",
    timeCreated: "11:25 AM",
    timeSent: "11:27 AM",
    status: "ready",
    items: [
      { name: "Paneer Tikka Angara", qty: 2 },
      { name: "Butter Chicken Delhi Style", qty: 1 },
    ],
  },
];

export default function KitchenPage() {
  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";
  const { tickets: dbTickets, updateKotStatus } = useKds(restaurantId);
  const { sessions, updateKotStatusInSession } = useDineInStore();
  const { activeOrders, syncRemoteKotUpdate } = usePosStore();
  const [transitionNotice, setTransitionNotice] = React.useState<string | null>(null);

  // Scoped Supabase Realtime channel that patches cache
  useRealtimeSync(restaurantId);

  // 1. Extract KOTs from Dine-In active sessions
  const dineInKots = React.useMemo(() => {
    const list: UnifiedTicket[] = [];
    for (const tableId in sessions) {
      const s = sessions[tableId];
      for (const k of s.kots) {
        if (k.status === "cancelled" || k.status === "served") continue;
        const sentTime = k.sent_at || k.created_at;
        const mins = Math.max(
          1,
          Math.floor((Date.now() - new Date(sentTime).getTime()) / 60000)
        );
        list.push({
          id: k.id,
          kotNumber: k.kot_number,
          orderNumber: s.orderNumber,
          tableOrCustomer: `Table ${s.tableNumber}`,
          type: "DINE IN",
          elapsedTime: `${mins}m`,
          timeCreated: new Date(k.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timeSent: new Date(sentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: (k.status === "accepted" ? "preparing" : k.status) as "new" | "sent" | "preparing" | "ready",
          isUrgent: mins > 15,
          notes: k.notes,
          items: k.items?.map((item) => ({
            name: item.name,
            qty: item.quantity,
            instructions: item.instructions || undefined,
          })) || [],
        });
      }
    }
    return list;
  }, [sessions]);

  // 2. Extract KOTs from Counter & Delivery active orders in PosStore
  const posKots = React.useMemo(() => {
    const list: UnifiedTicket[] = [];
    for (const ordId in activeOrders) {
      const ord = activeOrders[ordId];
      if (ord.orderStatus === "completed" || ord.orderStatus === "cancelled") continue;
      for (const k of ord.kots) {
        if (k.status === "cancelled" || k.status === "served") continue;
        const sentTime = k.sent_at || k.created_at;
        const mins = Math.max(
          1,
          Math.floor((Date.now() - new Date(sentTime).getTime()) / 60000)
        );
        list.push({
          id: k.id,
          kotNumber: k.kot_number,
          orderNumber: ord.orderNumber,
          tableOrCustomer: ord.orderType === "delivery"
            ? `${ord.customerName || "Customer"} (Delivery)`
            : "Counter (Takeaway)",
          type: ord.orderType.toUpperCase(),
          elapsedTime: `${mins}m`,
          timeCreated: new Date(k.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timeSent: new Date(sentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: (k.status === "accepted" ? "preparing" : k.status) as "new" | "sent" | "preparing" | "ready",
          isUrgent: mins > 15,
          notes: k.notes,
          items: k.items?.map((item) => ({
            name: item.name,
            qty: item.quantity,
            instructions: item.instructions || undefined,
          })) || [],
        });
      }
    }
    return list;
  }, [activeOrders]);

  // 3. Merge with remote DB tickets
  const activeTickets: UnifiedTicket[] = React.useMemo(() => {
    const dbFormatted: UnifiedTicket[] = (dbTickets && dbTickets.length > 0)
      ? dbTickets.map((t) => {
          const sentTime = t.sent_at || t.created_at;
          const mins = Math.max(
            1,
            Math.floor((Date.now() - new Date(sentTime).getTime()) / 60000)
          );
          return {
            id: t.id,
            kotNumber: t.kot_number,
            orderNumber: `ORD-${t.order_id.slice(-4).toUpperCase()}`,
            tableOrCustomer: t.table_id ? `Table ${t.table_id.slice(-2)}` : "Counter / Delivery",
            type: t.order_type === "dine_in" ? "DINE IN" : t.order_type.toUpperCase(),
            elapsedTime: `${mins}m`,
            timeCreated: new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timeSent: new Date(sentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: (t.status === "accepted" ? "preparing" : t.status) as "new" | "sent" | "preparing" | "ready",
            isUrgent: mins > 15,
            notes: t.notes,
            items: t.items?.map((item) => ({
              name: item.name,
              qty: item.quantity,
              instructions: item.instructions || undefined,
            })) || [],
          };
        })
      : [];

    const combined = [...dineInKots, ...posKots];
    for (const d of dbFormatted) {
      if (!combined.some((c) => c.id === d.id)) {
        combined.push(d);
      }
    }

    return combined.length > 0 ? combined : mockKdsFallback;
  }, [dineInKots, posKots, dbTickets]);

  const ticketsByStatus = {
    new: activeTickets.filter((t) => t.status === "new" || t.status === "sent"),
    preparing: activeTickets.filter((t) => t.status === "preparing"),
    ready: activeTickets.filter((t) => t.status === "ready"),
  };

  const handleAdvanceStatus = (ticket: UnifiedTicket, targetStatus: "preparing" | "ready") => {
    updateKotStatus({ kotId: ticket.id, newStatus: targetStatus });
    updateKotStatusInSession(ticket.id, targetStatus as KotStatus);
    syncRemoteKotUpdate(ticket.id, targetStatus as KotStatus);
    setTransitionNotice(`${ticket.kotNumber} moved to ${targetStatus.toUpperCase()}`);
    setTimeout(() => setTransitionNotice(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <ChefHat className="h-6 w-6 mr-2 text-brand-600" />
            Kitchen Display System (KDS)
          </h1>
          <p className="text-xs text-slate-500">
            Real-time kitchen order tickets (KOT) feed • Auto-synced via Supabase Realtime
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">Station: All Lines</Badge>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <BellRing className="h-3 w-3 mr-1 text-emerald-600" />
            <span>Live Sync Active</span>
          </Badge>
        </div>
      </div>

      {transitionNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in-0 duration-150">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{transitionNotice}</span>
        </div>
      )}

      {/* 3 Main KDS Columns: 1. NEW KOTS / SENT | 2. PREPARING | 3. READY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. NEW KOTs / SENT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
            <span className="font-extrabold text-sm uppercase tracking-wider">
              1. New KOTs ({ticketsByStatus.new.length})
            </span>
            <Flame className="h-4 w-4" />
          </div>

          <div className="space-y-3">
            {ticketsByStatus.new.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900/60 dark:bg-slate-900 space-y-3"
              >
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {ticket.kotNumber}
                      </span>
                      <Badge variant="primary" className="text-[10px] font-bold">
                        {ticket.type}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {ticket.orderNumber} • {ticket.tableOrCustomer}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Created: {ticket.timeCreated} • Sent: {ticket.timeSent}
                    </p>
                  </div>
                  <Badge variant="warning" className="flex items-center shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {ticket.elapsedTime}
                  </Badge>
                </div>

                {/* Items & quantities list */}
                <div className="space-y-1.5">
                  {ticket.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {item.qty}× {item.name}
                      </span>
                      {item.instructions && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                          ({item.instructions})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {ticket.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800 p-1.5 rounded">
                    Note: {ticket.notes}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold text-xs py-2 bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleAdvanceStatus(ticket, "preparing")}
                >
                  START PREPARING
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PREPARING */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400">
            <span className="font-extrabold text-sm uppercase tracking-wider">
              2. Preparing ({ticketsByStatus.preparing.length})
            </span>
            <Clock className="h-4 w-4" />
          </div>

          <div className="space-y-3">
            {ticketsByStatus.preparing.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm dark:border-sky-900/60 dark:bg-slate-900 space-y-3"
              >
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {ticket.kotNumber}
                      </span>
                      <Badge variant="primary" className="text-[10px] font-bold">
                        {ticket.type}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {ticket.orderNumber} • {ticket.tableOrCustomer}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Sent: {ticket.timeSent}
                    </p>
                  </div>
                  <Badge variant={ticket.isUrgent ? "danger" : "default"} className="flex items-center shrink-0">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {ticket.elapsedTime}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {ticket.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {item.qty}× {item.name}
                      </span>
                      {item.instructions && (
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 italic">
                          ({item.instructions})
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold text-xs py-2 bg-sky-600 hover:bg-sky-700"
                  onClick={() => handleAdvanceStatus(ticket, "ready")}
                >
                  MARK READY
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. READY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <span className="font-extrabold text-sm uppercase tracking-wider">
              3. Ready ({ticketsByStatus.ready.length})
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <div className="space-y-3">
            {ticketsByStatus.ready.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900 space-y-3 opacity-95"
              >
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {ticket.kotNumber}
                      </span>
                      <Badge variant="success" className="text-[10px] font-bold">
                        {ticket.type}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {ticket.orderNumber} • {ticket.tableOrCustomer}
                    </p>
                  </div>
                  <Badge variant="success" className="flex items-center shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {ticket.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.qty}× {item.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-center font-bold text-xs">
                  Food Prepared • Awaiting Pickup / Serve
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
