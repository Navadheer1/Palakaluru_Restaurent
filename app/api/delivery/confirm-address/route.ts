import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { calculateRoute } from "@/lib/maps/routing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth || !["admin", "manager", "cashier"].includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      deliveryId,
      latitude,
      longitude,
      deliveryAddress,
      landmark,
    } = body;

    if (!deliveryId || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { success: false, error: "deliveryId, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = createClient();
    }

    // Default restaurant base coordinate (Palakaluru)
    const restaurantOrigin = { lat: 16.297, lng: 80.4072 };
    const destination = { lat: latitude, lng: longitude };

    // Calculate initial route distance and duration
    const route = await calculateRoute(restaurantOrigin, destination);

    const updatePayload: Record<string, any> = {
      customer_latitude: latitude,
      customer_longitude: longitude,
      address_confirmed: true,
      route_distance_km: route.distanceKm,
      route_duration_mins: route.durationMins,
    };

    if (deliveryAddress) updatePayload.delivery_address = deliveryAddress;
    if (landmark) updatePayload.customer_landmark = landmark;

    const { data, error } = await supabase
      .from("delivery_orders")
      .update(updatePayload)
      .eq("id", deliveryId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      delivery: data,
      route,
    });
  } catch (error: any) {
    console.error("[API /api/delivery/confirm-address] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
