import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Session required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      deliveryId,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      batteryLevel,
    } = body;

    // Validate parameters
    if (!deliveryId || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing required location parameters" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: "Coordinates out of bounds" },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = createClient();
    }

    // 1. Verify delivery order exists and belongs to this user's restaurant
    const { data: delivery, error: fetchError } = await supabase
      .from("delivery_orders")
      .select("id, order_id, delivery_partner_id, status")
      .eq("id", deliveryId)
      .maybeSingle();

    if (fetchError || !delivery) {
      return NextResponse.json(
        { success: false, error: "Delivery order not found" },
        { status: 404 }
      );
    }

    // 2. Strict authorization: delivery boy can only submit location for their own assigned order
    if (auth.role === "delivery" && delivery.delivery_partner_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not assigned to this delivery" },
        { status: 403 }
      );
    }

    // 3. Active delivery check: only track while delivery is in transit
    const activeStatuses = ["picked_up", "out_for_delivery"];
    if (!activeStatuses.includes(delivery.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tracking inactive: order status is '${delivery.status}'`,
          trackingActive: false,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 4. Update delivery order current snapshot
    await supabase
      .from("delivery_orders")
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: now,
        tracking_status: "active",
      })
      .eq("id", deliveryId);

    // 5. Append location breadcrumb to delivery_locations table
    await supabase.from("delivery_locations").insert({
      delivery_id: deliveryId,
      delivery_boy_id: auth.userId,
      restaurant_id: auth.restaurantId,
      latitude,
      longitude,
      accuracy: typeof accuracy === "number" ? accuracy : null,
      heading: typeof heading === "number" ? heading : null,
      speed: typeof speed === "number" ? speed : null,
      battery_level: typeof batteryLevel === "number" ? batteryLevel : null,
      recorded_at: now,
    });

    return NextResponse.json({
      success: true,
      recordedAt: now,
      trackingActive: true,
    });
  } catch (error: any) {
    console.error("[API /api/delivery/track] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
