import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const rawSlug = decodeURIComponent(params.slug || "").trim();
    if (!rawSlug) {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = createClient();
    }

    // Determine if slug is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug);

    // 1. Resolve restaurant
    let restaurant = null;

    if (isUUID) {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
        .eq("id", rawSlug)
        .maybeSingle();
      restaurant = data;
    }

    if (!restaurant) {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
        .eq("slug", rawSlug)
        .maybeSingle();
      restaurant = data;
    }

    // If still not found and slug is "default" or "main", fetch the first restaurant
    if (!restaurant && (rawSlug === "default" || rawSlug === "main")) {
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
        .limit(1)
        .maybeSingle();
      restaurant = data;
    }

    // If still not found, search branch by code
    if (!restaurant) {
      const { data: branch } = await supabase
        .from("branches")
        .select("restaurant_id")
        .eq("code", rawSlug)
        .maybeSingle();
      
      if (branch?.restaurant_id) {
        const { data } = await supabase
          .from("restaurants")
          .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
          .eq("id", branch.restaurant_id)
          .maybeSingle();
        restaurant = data;
      }
    }

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Menu Not Found" },
        { status: 404 }
      );
    }

    // 2. Fetch categories & items in parallel
    const [categoriesRes, itemsRes] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, restaurant_id, name, description, image_url, sort_order, is_active")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("menu_items")
        .select("id, restaurant_id, category_id, name, description, image_url, base_price, tax_rate, preparation_time_mins, kitchen_station, is_available, is_active")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

    const categories = categoriesRes.data || [];
    const items = itemsRes.data || [];

    // 3. Fetch variants for items if any items exist
    let variants: any[] = [];
    if (items.length > 0) {
      const itemIds = items.map((i) => i.id);
      const { data: variantData } = await supabase
        .from("menu_variants")
        .select("id, menu_item_id, name, price, is_default, is_available")
        .in("menu_item_id", itemIds)
        .eq("is_available", true);
      variants = variantData || [];
    }

    // Attach variants to items
    const itemsWithVariants = items.map((item) => ({
      ...item,
      variants: variants.filter((v) => v.menu_item_id === item.id),
    }));

    return NextResponse.json(
      {
        success: true,
        restaurant,
        categories,
        items: itemsWithVariants,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: any) {
    console.error("Public menu fetch error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
