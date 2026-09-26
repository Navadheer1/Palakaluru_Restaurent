import React from "react";
import type { Metadata } from "next";
import { PublicDigitalMenuView } from "@/components/menu/PublicDigitalMenuView";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function getMenuData(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug || "").trim();
  if (!slug) return { restaurant: null, categories: [], items: [], notFound: true };

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = createClient();
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let restaurant = null;
  if (isUUID) {
    const { data } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
      .eq("id", slug)
      .maybeSingle();
    restaurant = data;
  }

  if (!restaurant) {
    const { data } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
      .eq("slug", slug)
      .maybeSingle();
    restaurant = data;
  }

  if (!restaurant && (slug === "default" || slug === "main")) {
    const { data } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, address, city, state, pincode, phone, email, currency")
      .limit(1)
      .maybeSingle();
    restaurant = data;
  }

  if (!restaurant) {
    const { data: branch } = await supabase
      .from("branches")
      .select("restaurant_id")
      .eq("code", slug)
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
    return { restaurant: null, categories: [], items: [], notFound: true };
  }

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

  const itemsWithVariants = items.map((item) => ({
    ...item,
    variants: variants.filter((v) => v.menu_item_id === item.id),
  }));

  return {
    restaurant,
    categories,
    items: itemsWithVariants,
    notFound: false,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { restaurant } = await getMenuData(params.slug);
  if (!restaurant) {
    return {
      title: "Menu Not Found | CulinaCloud RMS",
    };
  }
  return {
    title: `${restaurant.name} — Digital Menu`,
    description: `Browse the digital menu for ${restaurant.name}. Live prices, chef specials, and availability.`,
  };
}

export default async function PublicMenuSlugPage({ params }: PageProps) {
  const { restaurant, categories, items, notFound } = await getMenuData(params.slug);

  return (
    <PublicDigitalMenuView
      restaurant={restaurant}
      categories={categories}
      items={items}
      notFound={notFound}
    />
  );
}
