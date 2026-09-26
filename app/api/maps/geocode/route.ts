import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/maps/geocoding";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address = body.address;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { success: false, error: "Address string is required" },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Unable to geocode address" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[API /api/maps/geocode] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
