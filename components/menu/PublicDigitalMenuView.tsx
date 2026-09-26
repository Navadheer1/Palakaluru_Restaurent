"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { 
  Search, 
  UtensilsCrossed, 
  Clock, 
  Sparkles, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Leaf,
  Flame,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PublicRestaurant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  currency?: string;
}

interface PublicCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
}

interface PublicVariant {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_default: boolean;
  is_available: boolean;
}

interface PublicMenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  base_price: number;
  tax_rate?: number;
  preparation_time_mins?: number;
  kitchen_station?: string | null;
  is_available: boolean;
  variants?: PublicVariant[];
}

interface PublicDigitalMenuViewProps {
  restaurant: PublicRestaurant | null;
  categories: PublicCategory[];
  items: PublicMenuItem[];
  notFound?: boolean;
}

export function PublicDigitalMenuView({
  restaurant,
  categories,
  items,
  notFound = false,
}: PublicDigitalMenuViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");

  // Helper to determine if an item is vegetarian by keywords
  const isVegetarian = (name: string, description?: string | null) => {
    const text = `${name} ${description || ""}`.toLowerCase();
    const nonVegKeywords = ["chicken", "mutton", "fish", "prawn", "egg", "meat", "pork", "beef", "keema", "tandoori chicken", "lamb"];
    return !nonVegKeywords.some((kw) => text.includes(kw));
  };

  // Filter items based on active category, search, and dietary preference
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category_id !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDesc) return false;
      }

      // Dietary filter
      if (dietFilter !== "all") {
        const veg = isVegetarian(item.name, item.description);
        if (dietFilter === "veg" && !veg) return false;
        if (dietFilter === "non-veg" && veg) return false;
      }

      return true;
    });
  }, [items, selectedCategory, searchQuery, dietFilter]);

  // Group items by category for structured browsing when "all" is selected
  const itemsByCategory = useMemo(() => {
    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.id === selectedCategory);
      return [
        {
          category: cat || { id: "custom", name: "Menu", description: null, sort_order: 1, restaurant_id: "" },
          items: filteredItems,
        },
      ];
    }

    return categories
      .map((cat) => ({
        category: cat,
        items: filteredItems.filter((i) => i.category_id === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredItems, selectedCategory]);

  // Uncategorized items if any
  const uncategorizedItems = useMemo(() => {
    if (selectedCategory !== "all") return [];
    const validCatIds = new Set(categories.map((c) => c.id));
    return filteredItems.filter((i) => !i.category_id || !validCatIds.has(i.category_id));
  }, [categories, filteredItems, selectedCategory]);

  // 1. Not Found State
  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-rose-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">Menu Not Found</h1>
        <p className="text-slate-400 max-w-md text-base leading-relaxed mb-8">
          The digital menu you are trying to access could not be found or has an invalid restaurant link.
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
          Please ask a staff member or scan the restaurant table QR code again.
        </div>
      </div>
    );
  }

  // 2. Main Digital Menu View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Banner / Restaurant Header */}
      <header className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800/80 pt-8 pb-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Logo or Restaurant Emblem */}
          <div className="relative mb-3">
            {restaurant.logo_url ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-xl bg-slate-800">
                <Image
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
                <UtensilsCrossed className="w-8 h-8 text-amber-50" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {restaurant.name}
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold tracking-wide uppercase mt-2">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Menu
          </div>

          {(restaurant.address || restaurant.phone) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-y-1.5 gap-x-4 text-xs text-slate-400">
              {restaurant.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{restaurant.phone}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Sticky Filter & Search Control Panel */}
      <section className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Search bar & Veg filter row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, drinks, desserts..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Veg / Non-Veg toggle pills */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setDietFilter("all")}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  dietFilter === "all"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDietFilter("veg")}
                className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-all ${
                  dietFilter === "veg"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
                title="Vegetarian only"
              >
                <Leaf className="w-3 h-3" />
                Veg
              </button>
              <button
                onClick={() => setDietFilter("non-veg")}
                className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-all ${
                  dietFilter === "non-veg"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-rose-400 hover:text-rose-300"
                }`}
                title="Non-Vegetarian only"
              >
                <Flame className="w-3 h-3" />
                Non-Veg
              </button>
            </div>
          </div>

          {/* Categories Horizontal Scroll */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                }`}
              >
                All Items ({items.length})
              </button>
              {categories.map((cat) => {
                const count = items.filter((i) => i.category_id === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                        : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Main Menu Items Feed */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Empty state when menu has no items at all */}
        {items.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Our menu is currently being updated.
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Please check again soon or ask your server for today's special offerings.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Filter empty state */
          <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">
              No matching dishes found
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Try adjusting your search terms or dietary filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setDietFilter("all");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Render grouped dishes */
          <div className="space-y-8">
            {itemsByCategory.map((group) => (
              <section key={group.category.id} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{group.category.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                        {group.items.length}
                      </span>
                    </h2>
                    {group.category.description && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {group.category.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {group.items.map((dish) => {
                    const veg = isVegetarian(dish.name, dish.description);
                    return (
                      <div
                        key={dish.id}
                        className={`relative group rounded-xl p-4 transition-all border ${
                          dish.is_available
                            ? "bg-slate-900/70 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700"
                            : "bg-slate-900/40 border-slate-800/40 opacity-70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            {/* Veg / Non-Veg badge + Prep time */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                                  veg
                                    ? "border-emerald-500 bg-emerald-950/40"
                                    : "border-rose-500 bg-rose-950/40"
                                }`}
                                title={veg ? "Vegetarian" : "Non-Vegetarian"}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    veg ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                              </span>

                              <span className="font-semibold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                                {dish.name}
                              </span>

                              {!dish.is_available && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                                  Sold Out
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {dish.description && (
                              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 pr-2">
                                {dish.description}
                              </p>
                            )}

                            {/* Preparation Time & Station */}
                            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                              {dish.preparation_time_mins && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {dish.preparation_time_mins} mins
                                </span>
                              )}
                            </div>

                            {/* Variants preview if available */}
                            {dish.variants && dish.variants.length > 0 && (
                              <div className="pt-2 flex flex-wrap gap-1.5">
                                {dish.variants.map((v) => (
                                  <span
                                    key={v.id}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60"
                                  >
                                    {v.name}: <span className="text-amber-400 font-semibold">{formatCurrency(v.price)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Price & Image Column */}
                          <div className="flex flex-col items-end justify-between shrink-0">
                            <span className="text-base font-bold text-amber-400 tracking-tight">
                              {formatCurrency(dish.base_price)}
                            </span>

                            {dish.image_url && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-800 mt-2 bg-slate-800">
                                <Image
                                  src={dish.image_url}
                                  alt={dish.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Uncategorized group if any */}
            {uncategorizedItems.length > 0 && (
              <section className="space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Other Delights
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {uncategorizedItems.map((dish) => (
                    <div
                      key={dish.id}
                      className="rounded-xl p-4 bg-slate-900/70 border border-slate-800 flex justify-between items-start"
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-100">{dish.name}</div>
                        {dish.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{dish.description}</p>
                        )}
                      </div>
                      <span className="text-base font-bold text-amber-400 shrink-0 ml-3">
                        {formatCurrency(dish.base_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Minimal Customer Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-slate-400 font-medium">{restaurant.name}</p>
          <p className="text-slate-500">
            Scan to view live digital menu. Items & prices are subject to seasonal availability.
          </p>
          <div className="pt-2 text-[10px] text-slate-600 font-mono">
            Powered by CulinaCloud RMS • High-Speed Digital Experience
          </div>
        </div>
      </footer>
    </div>
  );
}
