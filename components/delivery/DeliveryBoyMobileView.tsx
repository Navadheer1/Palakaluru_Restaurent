"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Home, 
  Package, 
  Clock, 
  User, 
  Bike, 
  Phone, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useDeliveryTracker } from "@/lib/hooks/useDeliveryTracker";
import { formatCurrency, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";

type MobileTab = "home" | "deliveries" | "history" | "profile";

interface MobileDeliveryOrder {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  customer_landmark?: string | null;
  customer_latitude?: number | null;
  customer_longitude?: number | null;
  status: "ready_for_delivery" | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "failed" | "cancelled";
  route_distance_km?: number | null;
  route_duration_mins?: number | null;
  total_amount: number;
  payment_method?: string;
  cash_collected_amount?: number;
  payment_collected?: boolean;
}

export function DeliveryBoyMobileView() {
  const { profile } = useAuthProfile();
  const userId = profile?.id;
  const userName = profile?.full_name || profile?.name || "Delivery Partner";
  const userPhone = profile?.phone || "+91 98480 67890";

  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [deliveries, setDeliveries] = useState<MobileDeliveryOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<MobileDeliveryOrder | null>(null);
  const [isCollectingPayment, setIsCollectingPayment] = useState(false);
  const [cashAmountInput, setCashAmountInput] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch orders assigned to this delivery partner
  const fetchAssignedDeliveries = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("delivery_orders")
      .select(`
        id,
        order_id,
        status,
        delivery_address,
        customer_landmark,
        customer_latitude,
        customer_longitude,
        route_distance_km,
        route_duration_mins,
        payment_method,
        cash_collected_amount,
        payment_collected,
        orders:order_id (
          id,
          order_number,
          total_amount,
          created_at,
          customer:customer_id (name, phone)
        )
      `)
      .eq("delivery_partner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch delivery orders error:", error);
      return;
    }

    if (data) {
      const mapped: MobileDeliveryOrder[] = data.map((d: any) => {
        const order = d.orders;
        const customer = order?.customer;

        return {
          id: d.id,
          order_id: d.order_id,
          order_number: order?.order_number || `ORD-${d.id.slice(0, 4)}`,
          customer_name: customer?.name || "Customer",
          customer_phone: customer?.phone || "N/A",
          delivery_address: d.delivery_address || "Address on File",
          customer_landmark: d.customer_landmark,
          customer_latitude: d.customer_latitude || 16.302,
          customer_longitude: d.customer_longitude || 80.412,
          status: d.status,
          route_distance_km: d.route_distance_km || 2.4,
          route_duration_mins: d.route_duration_mins || 12,
          total_amount: order?.total_amount || 0,
          payment_method: d.payment_method || "cod",
          cash_collected_amount: d.cash_collected_amount || 0,
          payment_collected: d.payment_collected || false,
        };
      });

      setDeliveries(mapped);

      // Find current in-progress delivery
      const active = mapped.find((d) => ["assigned", "picked_up", "out_for_delivery"].includes(d.status));
      setActiveDelivery(active || null);
      if (active) {
        setCashAmountInput(active.total_amount.toString());
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignedDeliveries();
  }, [fetchAssignedDeliveries]);

  // Telemetry Tracker: ONLY runs when status is actively in transit
  const isTrackingActive = useMemo(() => {
    return Boolean(
      activeDelivery &&
      ["picked_up", "out_for_delivery"].includes(activeDelivery.status)
    );
  }, [activeDelivery]);

  const tracker = useDeliveryTracker({
    deliveryId: activeDelivery?.id || null,
    isActive: isTrackingActive,
    minIntervalMs: 12000, // 12 seconds
    minDistanceMeters: 25, // 25 meters delta
  });

  // Action: Pick Up Order
  const handleStartDelivery = async () => {
    if (!activeDelivery) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("delivery_orders")
      .update({
        status: "out_for_delivery",
        tracking_status: "active",
      })
      .eq("id", activeDelivery.id);

    if (!error) {
      setActiveDelivery((prev) => (prev ? { ...prev, status: "out_for_delivery" } : null));
      setActionNotice("Order picked up! Live GPS tracking started.");
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  // Action: Arrived at Customer
  const handleArrived = async () => {
    if (!activeDelivery) return;
    setActionNotice("Arrived at customer location. Ready for payment & handover.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Action: Collect Payment & Mark Delivered
  const handleMarkDelivered = async () => {
    if (!activeDelivery) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("delivery_orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        tracking_status: "completed",
        payment_collected: true,
        cash_collected_amount: parseFloat(cashAmountInput) || activeDelivery.total_amount,
      })
      .eq("id", activeDelivery.id);

    if (!error) {
      tracker.stopTracking();
      setActionNotice("Delivery completed! Payment verified and GPS tracking ended.");
      setIsCollectingPayment(false);
      fetchAssignedDeliveries();
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Action: Navigate (open native Google Maps or Apple Maps)
  const handleNavigate = () => {
    if (!activeDelivery) return;
    const lat = activeDelivery.customer_latitude || 16.302;
    const lng = activeDelivery.customer_longitude || 80.412;
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(navUrl, "_blank");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-20 select-none">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-md">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Palakaluru Fleet</h1>
            <span className="text-[10px] text-cyan-400 font-semibold">{userName}</span>
          </div>
        </div>

        <button
          onClick={fetchAssignedDeliveries}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Live GPS Tracking Telemetry Status Strip */}
      {isTrackingActive && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  tracker.isOnline ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                }`}
              />
              <span className="font-bold text-white">
                {tracker.isOnline ? "● Tracking Active" : "⚠ Connection Lost"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {tracker.lastSyncTime
                ? `Sync: ${tracker.lastSyncTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Acquiring..."}
            </span>
          </div>

          {tracker.isLowAccuracy && (
            <div className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Low GPS accuracy (~{tracker.accuracy ? Math.round(tracker.accuracy) : 50}m margin)</span>
            </div>
          )}

          {!tracker.isOnline && (
            <div className="mt-1 text-[10px] text-amber-300">
              Location will sync automatically when connection returns.
            </div>
          )}
        </div>
      )}

      {/* Main Tab Views */}
      <main className="flex-1 p-4 space-y-4">
        {actionNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in-0">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 1. HOME TAB: Active Delivery Workflow */}
        {activeTab === "home" && (
          <div className="space-y-4">
            {!activeDelivery ? (
              <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 space-y-3">
                <Bike className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">No Active Delivery</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You do not have any order in transit right now. Check assigned deliveries when the kitchen prepares an order.
                </p>
                <button
                  onClick={() => setActiveTab("deliveries")}
                  className="mt-3 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition"
                >
                  View Assigned Deliveries
                </button>
              </div>
            ) : (
              /* Active Delivery Card */
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Active Order
                    </span>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      DELIVERY #{activeDelivery.order_number}
                    </h2>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      {activeDelivery.customer_name}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                      activeDelivery.status === "out_for_delivery"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    )}
                  >
                    {activeDelivery.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Distance & ETA */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Distance</span>
                      <span className="text-sm font-extrabold text-white">
                        {activeDelivery.route_distance_km || 2.4} km
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">ETA</span>
                      <span className="text-sm font-extrabold text-white">
                        {activeDelivery.route_duration_mins || 12} mins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-semibold text-slate-400">Drop Address:</span>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    {activeDelivery.delivery_address}
                    {activeDelivery.customer_landmark && (
                      <span className="block text-amber-400 font-medium mt-1">
                        Landmark: {activeDelivery.customer_landmark}
                      </span>
                    )}
                  </p>
                </div>

                {/* Amount to collect */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Payment Mode</span>
                    <span className="text-xs font-bold text-amber-400 uppercase">
                      {activeDelivery.payment_method}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Amount to Collect</span>
                    <span className="text-base font-black text-white">
                      {formatCurrency(activeDelivery.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Workflow */}
                <div className="space-y-2.5 pt-2">
                  {/* Top helper actions: Call & Navigate */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${activeDelivery.customer_phone}`}
                      className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Call Customer</span>
                    </a>

                    <button
                      onClick={handleNavigate}
                      className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Navigate</span>
                    </button>
                  </div>

                  {/* Primary Workflow State Button */}
                  {activeDelivery.status === "assigned" ? (
                    <button
                      onClick={handleStartDelivery}
                      className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition"
                    >
                      <Bike className="w-5 h-5" />
                      <span>Start Delivery</span>
                    </button>
                  ) : activeDelivery.status === "out_for_delivery" ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleArrived}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Arrived at Customer</span>
                      </button>

                      {!isCollectingPayment ? (
                        <button
                          onClick={() => setIsCollectingPayment(true)}
                          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Collect Payment & Handover</span>
                        </button>
                      ) : (
                        /* Payment Collection Form */
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                          <span className="text-xs font-bold text-slate-200 block">
                            Confirm Payment Collection (COD)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={cashAmountInput}
                              onChange={(e) => setCashAmountInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold"
                            />
                          </div>
                          <button
                            onClick={handleMarkDelivered}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm & Mark Delivered</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl">
                      Delivered Successfully
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. DELIVERIES TAB: All Assigned Deliveries */}
        {activeTab === "deliveries" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200">Assigned Deliveries</h2>
            {deliveries.filter((d) => d.status !== "delivered").length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No pending deliveries assigned.
              </div>
            ) : (
              deliveries
                .filter((d) => d.status !== "delivered")
                .map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setActiveDelivery(d);
                      setActiveTab("home");
                    }}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-white">#{d.order_number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">{d.customer_name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{d.delivery_address}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">{d.route_distance_km} km • {d.route_duration_mins} min</span>
                      <span className="font-bold text-amber-400">{formatCurrency(d.total_amount)}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 3. HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200">Delivery History</h2>
            {deliveries.filter((d) => d.status === "delivered").length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No completed deliveries yet.
              </div>
            ) : (
              deliveries
                .filter((d) => d.status === "delivered")
                .map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">#{d.order_number}</span>
                      <span className="text-emerald-400 font-bold text-[10px]">DELIVERED</span>
                    </div>
                    <div className="text-slate-400">{d.customer_name}</div>
                    <div className="flex justify-between text-[11px] pt-1 text-slate-500">
                      <span>Cash Collected: {formatCurrency(d.total_amount)}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 4. PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-cyan-600 text-white text-xl font-bold flex items-center justify-center mx-auto shadow-lg">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-base font-bold text-white">{userName}</h2>
              <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                Official Delivery Fleet Partner
              </span>
              <p className="text-xs text-slate-400 font-mono">{userPhone}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <h3 className="font-bold text-white mb-2">Privacy & Telemetry Protocol</h3>
              <p className="text-slate-400 leading-relaxed">
                GPS telemetry is strictly activated during in-transit delivery assignments. No location is tracked when off-duty or after delivery completion.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around py-2 px-1">
        <button
          onClick={() => setActiveTab("home")}
          className={cn(
            "flex flex-col items-center py-1 px-3 rounded-xl transition text-xs font-semibold",
            activeTab === "home" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab("deliveries")}
          className={cn(
            "flex flex-col items-center py-1 px-3 rounded-xl transition text-xs font-semibold relative",
            activeTab === "deliveries" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Deliveries</span>
          {deliveries.filter((d) => d.status !== "delivered").length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex flex-col items-center py-1 px-3 rounded-xl transition text-xs font-semibold",
            activeTab === "history" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>History</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex flex-col items-center py-1 px-3 rounded-xl transition text-xs font-semibold",
            activeTab === "profile" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
