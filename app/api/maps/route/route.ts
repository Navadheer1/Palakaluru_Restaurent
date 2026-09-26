import { NextRequest, NextResponse } from "next/server";
import { calculateRoute } from "@/lib/maps/routing";
import { Coordinates } from "@/lib/maps/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination } = body as {
      origin: Coordinates;
      destination: Coordinates;
    };

    if (!origin || !destination || typeof origin.lat !== "number" || typeof destination.lat !== "number") {
      return NextResponse.json(
        { success: false, error: "Valid origin and destination coordinates are required" },
        { status: 400 }
      );
    }

    const route = await calculateRoute(origin, destination);
    return NextResponse.json({ success: true, data: route });
  } catch (error: any) {
    console.error("[API /api/maps/route] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
