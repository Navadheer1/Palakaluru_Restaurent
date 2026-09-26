"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Bike, 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Edit3, 
  Check, 
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  DollarSign
} from "lucide-react";
import { ProductionDeliveryMap } from "@/components/maps/ProductionDeliveryMap";
import { formatCurrency, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { Coordinates } from "@/lib/maps/types";

interface DeliveryRecord {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  customer_landmark?: string | null;
  customer_latitude?: number | null;
  customer_longitude?: number | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_location_update?: string | null;
  status: "ready_for_delivery" | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "failed" | "cancelled";
  tracking_status?: string | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  rider_id?: string | null;
  total_amount: number;
  payment_method?: string;
  route_distance_km?: number | null;
  route_duration_mins?: number | null;
  address_confirmed?: boolean;
  created_at: string;
}

export function AdminDeliveryManagementView() {
  const { profile } = useAuthProfile();
  const restaurantId = profile?.restaurant_id || "a0000000-0000-0000-0000-000000000001";

  // Base restaurant coordinates (Palakaluru Grand Restaurant)
  const restaurantCoords = useMemo(
    () => ({ lat: 16.297, lng: 80.4072, name: "Palakaluru Grand (Base)" }),
    []
  );

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdjustingPin, setIsAdjustingPin] = useState(false);
  const [tempPinCoords, setTempPinCoords] = useState<Coordinates | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [availableRiders, setAvailableRiders] = useState<{ id: string; name: string; phone: string | null }[]>([]);

  // Fetch active deliveries from Supabase
  const fetchDeliveries = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("delivery_orders")
      .select(`
        id,
        order_id,
        delivery_partner_id,
        status,
        delivery_address,
        customer_landmark,
        customer_latitude,
        customer_longitude,
        current_latitude,
        current_longitude,
        last_location_update,
        tracking_status,
        route_distance_km,
        route_duration_mins,
        address_confirmed,
        payment_method,
        cash_collected_amount,
        orders:order_id (
          id,
          order_number,
          total_amount,
          created_at,
          customer:customer_id (name, phone)
        ),
        delivery_partner:delivery_partner_id (id, name, full_name, phone)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deliveries:", error);
      return;
    }

    if (data) {
      const mapped: DeliveryRecord[] = data.map((d: any) => {
        const order = d.orders;
        const customer = order?.customer;
        const partner = d.delivery_partner;

        return {
          id: d.id,
          order_id: d.order_id,
          order_number: order?.order_number || `ORD-${d.id.slice(0, 5)}`,
          customer_name: customer?.name || "Customer",
          customer_phone: customer?.phone || "N/A",
          delivery_address: d.delivery_address || "Address on File",
          customer_landmark: d.customer_landmark,
          customer_latitude: d.customer_latitude || 16.302,
          customer_longitude: d.customer_longitude || 80.412,
          current_latitude: d.current_latitude,
          current_longitude: d.current_longitude,
          last_location_update: d.last_location_update,
          status: d.status,
          tracking_status: d.tracking_status,
          rider_name: partner?.full_name || partner?.name || null,
          rider_phone: partner?.phone || null,
          rider_id: d.delivery_partner_id,
          total_amount: order?.total_amount || 0,
          payment_method: d.payment_method || "cod",
          route_distance_km: d.route_distance_km || 2.4,
          route_duration_mins: d.route_duration_mins || 12,
          address_confirmed: d.address_confirmed || false,
          created_at: order?.created_at || new Date().toISOString(),
        };
      });

      setDeliveries(mapped);
      if (mapped.length > 0 && !selectedId) {
        setSelectedId(mapped[0].id);
      }
    }
  }, [selectedId]);

  // Fetch delivery personnel for assignment
  const fetchRiders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, name, full_name, phone, role")
      .eq("role", "delivery")
      .eq("status", "active");

    if (data) {
      setAvailableRiders(
        data.map((r) => ({
          id: r.id,
          name: r.full_name || r.name,
          phone: r.phone,
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    fetchRiders();

    // Supabase Realtime channel for live rider location updates
    const supabase = createClient();
    const channel = supabase
      .channel("admin-delivery-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_orders",
        },
        (payload: any) => {
          const updated = payload.new;
          setDeliveries((prev) =>
            prev.map((d) => {
              if (d.id === updated.id) {
                return {
                  ...d,
                  current_latitude: updated.current_latitude,
                  current_longitude: updated.current_longitude,
                  last_location_update: updated.last_location_update,
                  status: updated.status,
                  tracking_status: updated.tracking_status,
                  route_distance_km: updated.route_distance_km || d.route_distance_km,
                  route_duration_mins: updated.route_duration_mins || d.route_duration_mins,
                };
              }
              return d;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDeliveries, fetchRiders]);

  // Selected delivery record
  const selectedDelivery = useMemo(() => {
    return deliveries.find((d) => d.id === selectedId) || deliveries[0] || null;
  }, [deliveries, selectedId]);

  // Compute staleness of rider location
  const riderLocationInfo = useMemo(() => {
    if (!selectedDelivery || !selectedDelivery.current_latitude || !selectedDelivery.current_longitude) {
      return null;
    }

    let isStale = false;
    let timeText = "Just now";

    if (selectedDelivery.last_location_update) {
      const diffSec = Math.floor(
        (Date.now() - new Date(selectedDelivery.last_location_update).getTime()) / 1000
      );
      if (diffSec < 60) {
        timeText = `${diffSec} seconds ago`;
      } else {
        const mins = Math.floor(diffSec / 60);
        timeText = `${mins} min ago`;
        if (mins >= 3) {
          isStale = true;
        }
      }
    }

    return {
      lat: selectedDelivery.current_latitude,
      lng: selectedDelivery.current_longitude,
      name: selectedDelivery.rider_name || "Delivery Partner",
      lastUpdated: timeText,
      isStale,
      isLowAccuracy: false,
    };
  }, [selectedDelivery]);

  // Customer destination coordinates
  const customerCoords = useMemo(() => {
    if (!selectedDelivery) return null;
    if (isAdjustingPin && tempPinCoords) {
      return {
        lat: tempPinCoords.lat,
        lng: tempPinCoords.lng,
        address: selectedDelivery.delivery_address,
        landmark: selectedDelivery.customer_landmark,
      };
    }
    return {
      lat: selectedDelivery.customer_latitude || 16.302,
      lng: selectedDelivery.customer_longitude || 80.412,
      address: selectedDelivery.delivery_address,
      landmark: selectedDelivery.customer_landmark,
    };
  }, [selectedDelivery, isAdjustingPin, tempPinCoords]);

  // Filter deliveries list
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (filterStatus === "active") {
        if (["delivered", "cancelled", "failed"].includes(d.status)) return false;
      } else if (filterStatus === "completed") {
        if (d.status !== "delivered") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.order_number.toLowerCase().includes(q) ||
          d.customer_name.toLowerCase().includes(q) ||
          d.delivery_address.toLowerCase().includes(q) ||
          (d.rider_name && d.rider_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [deliveries, filterStatus, searchQuery]);

  // Handle pin adjustment on map
  const handlePinMove = (coords: Coordinates) => {
    setTempPinCoords(coords);
  };

  const handleStartAdjustPin = () => {
    if (customerCoords) {
      setTempPinCoords({ lat: customerCoords.lat, lng: customerCoords.lng });
    }
    setIsAdjustingPin(true);
  };

  const handleConfirmPin = async () => {
    if (!selectedDelivery || !tempPinCoords) return;
    setIsSavingPin(true);
    try {
      const res = await fetch("/api/delivery/confirm-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId: selectedDelivery.id,
          latitude: tempPinCoords.lat,
          longitude: tempPinCoords.lng,
          deliveryAddress: selectedDelivery.delivery_address,
          landmark: selectedDelivery.customer_landmark,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === selectedDelivery.id
              ? {
                  ...d,
                  customer_latitude: tempPinCoords.lat,
                  customer_longitude: tempPinCoords.lng,
                  address_confirmed: true,
                  route_distance_km: data.route?.distanceKm || d.route_distance_km,
                  route_duration_mins: data.route?.durationMins || d.route_duration_mins,
                }
              : d
          )
        );
        setNotice("Customer destination pin confirmed successfully!");
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (err) {
      console.error("Failed to confirm pin:", err);
    } finally {
      setIsSavingPin(false);
      setIsAdjustingPin(false);
    }
  };

  // Assign Rider
  const handleAssignRider = async (deliveryId: string, riderId: string) => {
    const supabase = createClient();
    const rider = availableRiders.find((r) => r.id === riderId);

    const { error } = await supabase
      .from("delivery_orders")
      .update({
        delivery_partner_id: riderId,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", deliveryId);

    if (!error) {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? { ...d, rider_id: riderId, rider_name: rider?.name || "Assigned", status: "assigned" }
            : d
        )
      );
      setNotice(`Assigned to ${rider?.name}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Delivery Live Fleet Tracking
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Production real-time GPS telemetry, address confirmation, and route supervision
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeliveries}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Deliveries"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Telemetry Stream Active
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main 2-Column Split: Active Deliveries List (Left) & Live Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Deliveries Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterStatus === "active"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Active In-Transit ({deliveries.filter((d) => !["delivered", "cancelled"].includes(d.status)).length})
              </button>
              <button
                onClick={() => setFilterStatus("completed")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterStatus === "completed"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, rider, customer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Deliveries List */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredDeliveries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No deliveries found matching current filter.
              </div>
            ) : (
              filteredDeliveries.map((del) => {
                const isSelected = selectedId === del.id;
                const isDelivered = del.status === "delivered";
                const isOut = del.status === "out_for_delivery" || del.status === "picked_up";

                return (
                  <div
                    key={del.id}
                    onClick={() => {
                      setSelectedId(del.id);
                      setIsAdjustingPin(false);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2",
                      isSelected
                        ? "bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-500 shadow-sm"
                        : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">
                          #{del.order_number}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                            isDelivered
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isOut
                              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {del.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(del.total_amount)}
                      </span>
                    </div>

                    {/* Rider info */}
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                          {del.rider_name || "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{del.route_duration_mins || 15} min • {del.route_distance_km || 2.4} km</span>
                      </div>
                    </div>

                    {/* Address snippet */}
                    <div className="flex items-start gap-1.5 text-slate-500 text-[11px] line-clamp-1">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                      <span>{del.delivery_address}</span>
                    </div>

                    {/* Rider assignment dropdown if unassigned */}
                    {!del.rider_id && availableRiders.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Assign Partner:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAssignRider(del.id, e.target.value);
                          }}
                          className="text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select rider...
                          </option>
                          {availableRiders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Map & Delivery Focus (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Map Component */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Active Live Telemetry
                </span>
                {selectedDelivery && (
                  <span className="text-xs text-slate-500">
                    Order #{selectedDelivery.order_number} ({selectedDelivery.customer_name})
                  </span>
                )}
              </div>

              {/* Pin Adjuster Actions */}
              {selectedDelivery && (
                <div className="flex items-center gap-2">
                  {!isAdjustingPin ? (
                    <button
                      onClick={handleStartAdjustPin}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Adjust Pin</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleConfirmPin}
                        disabled={isSavingPin}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingPin ? "Saving..." : "Confirm Location"}</span>
                      </button>
                      <button
                        onClick={() => setIsAdjustingPin(false)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map Canvas */}
            <ProductionDeliveryMap
              restaurant={restaurantCoords}
              rider={riderLocationInfo}
              customer={customerCoords}
              isAdjustingPin={isAdjustingPin}
              onCustomerPinMove={handlePinMove}
            />

            {/* Selected Delivery Telemetry Card */}
            {selectedDelivery && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Rider Telemetry</span>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{selectedDelivery.rider_name || "Awaiting Assignment"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {riderLocationInfo?.lastUpdated ? `Updated ${riderLocationInfo.lastUpdated}` : "GPS idle"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Route Distance & ETA</span>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {selectedDelivery.route_distance_km || 2.4} km ({selectedDelivery.route_duration_mins || 12} mins)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
                    Optimal Transit Path
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Customer & Contact</span>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1 truncate">
                    <span>{selectedDelivery.customer_name}</span>
                  </div>
                  <a
                    href={`tel:${selectedDelivery.customer_phone}`}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                  >
                    <Phone className="w-3 h-3" />
                    {selectedDelivery.customer_phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
