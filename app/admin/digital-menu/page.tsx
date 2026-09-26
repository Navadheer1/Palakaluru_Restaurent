import React from "react";
import type { Metadata } from "next";
import { DigitalMenuAdminView } from "@/components/menu/DigitalMenuAdminView";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Digital Menu QR - Admin - Palakaluru RMS",
  description: "Permanent QR code and table stand for your restaurant digital menu",
};

export const dynamic = "force-dynamic";

export default async function AdminDigitalMenuPage() {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = createClient();
  }

  // Fetch restaurant
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, address, phone, email")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const restaurantId = restaurant?.id || "a0000000-0000-0000-0000-000000000001";

  // Fetch counts
  const [itemsRes, catsRes] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true),
    supabase
      .from("menu_categories")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true),
  ]);

  const itemCount = itemsRes.count || 0;
  const categoryCount = catsRes.count || 0;

  return (
    <DigitalMenuAdminView
      restaurant={restaurant}
      itemCount={itemCount}
      categoryCount={categoryCount}
    />
  );
}
