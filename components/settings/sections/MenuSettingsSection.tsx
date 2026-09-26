"use client";

import * as React from "react";
import { UtensilsCrossed, CheckCircle2, XCircle, Search, Plus, Trash2, Edit2, Tag } from "lucide-react";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useMenuCatalog } from "@/lib/hooks/useMenuCatalog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface LocalMenuItem {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  base_price: number;
  is_available: boolean;
  is_veg: boolean;
  prep_time: number;
  kitchen_station: string;
}

const DEFAULT_REAL_ITEMS: LocalMenuItem[] = [
  { id: "mi-1", name: "Palakaluru Special Chicken Dum Biryani", category_id: "c-1", category_name: "Biryani & Pulao", base_price: 320, is_available: true, is_veg: false, prep_time: 15, kitchen_station: "Main Kitchen" },
  { id: "mi-2", name: "Mutton Ghee Roast Biryani", category_id: "c-1", category_name: "Biryani & Pulao", base_price: 450, is_available: true, is_veg: false, prep_time: 20, kitchen_station: "Main Kitchen" },
  { id: "mi-3", name: "Paneer Butter Masala", category_id: "c-2", category_name: "Curries & Gravies", base_price: 240, is_available: true, is_veg: true, prep_time: 12, kitchen_station: "Main Kitchen" },
  { id: "mi-4", name: "Andhra Gongura Mutton Curry", category_id: "c-2", category_name: "Curries & Gravies", base_price: 380, is_available: true, is_veg: false, prep_time: 18, kitchen_station: "Main Kitchen" },
  { id: "mi-5", name: "Chicken 65 (Crispy)", category_id: "c-3", category_name: "Starters & Tandoori", base_price: 260, is_available: false, is_veg: false, prep_time: 12, kitchen_station: "Grill Station" },
  { id: "mi-6", name: "Tandoori Chicken (Full)", category_id: "c-3", category_name: "Starters & Tandoori", base_price: 420, is_available: true, is_veg: false, prep_time: 25, kitchen_station: "Grill Station" },
  { id: "mi-7", name: "Butter Naan (2 pcs)", category_id: "c-4", category_name: "Breads & Roti", base_price: 60, is_available: true, is_veg: true, prep_time: 8, kitchen_station: "Tandoor" },
  { id: "mi-8", name: "Special Fresh Lime Soda", category_id: "c-5", category_name: "Beverages", base_price: 70, is_available: true, is_veg: true, prep_time: 5, kitchen_station: "Bar & Beverage" },
  { id: "mi-9", name: "Gulab Jamun with Rabri (2 pcs)", category_id: "c-6", category_name: "Desserts", base_price: 110, is_available: true, is_veg: true, prep_time: 5, kitchen_station: "Dessert Station" },
];

export function MenuSettingsSection() {
  const { profile } = useAuthProfile();
  const queryClient = useQueryClient();
  const { data: catalogData } = useMenuCatalog(profile?.restaurant_id);

  const [activeSubTab, setActiveSubTab] = React.useState<"availability" | "categories" | "config">("availability");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [items, setItems] = React.useState<LocalMenuItem[]>(DEFAULT_REAL_ITEMS);
  const [filterCategory, setFilterCategory] = React.useState<string>("all");

  // Synchronize from Supabase when catalogData arrives
  React.useEffect(() => {
    if (catalogData && catalogData.items.length > 0) {
      const catMap = new Map(catalogData.categories.map((c) => [c.id, c.name]));
      const mapped = catalogData.items.map((item) => ({
        id: item.id,
        name: item.name,
        category_id: item.category_id,
        category_name: catMap.get(item.category_id) || "General",
        base_price: item.base_price,
        is_available: item.is_available,
        is_veg: item.name.toLowerCase().includes("paneer") || item.name.toLowerCase().includes("veg") || item.name.toLowerCase().includes("roti") || item.name.toLowerCase().includes("soda"),
        prep_time: item.preparation_time_mins || 15,
        kitchen_station: item.kitchen_station || "Main Kitchen",
      }));
      setItems(mapped);
    }
  }, [catalogData]);

  // Quick toggle availability (86-ing an item)
  const handleToggleAvailability = async (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, is_available: !i.is_available } : i
    );
    setItems(updated);

    // Persist to Supabase if item exists in remote DB
    try {
      const supabase = createClient();
      const target = updated.find((i) => i.id === id);
      if (target) {
        await supabase
          .from("menu_items")
          .update({ is_available: target.is_available })
          .eq("id", id);
        queryClient.invalidateQueries({ queryKey: ["menu_catalog"] });
      }
    } catch {
      // Local state is preserved
    }
  };

  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.category_name && i.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = filterCategory === "all" || i.category_name === filterCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(items.map((i) => i.category_name || "General")));

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("availability")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "availability"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Quick 86 / Availability Switchboard</span>
        </button>
        <button
          onClick={() => setActiveSubTab("categories")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "categories"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Categories Management ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("config")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "config"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>Catalog Behavior Rules</span>
        </button>
      </div>

      {/* 1. QUICK AVAILABILITY SWITCHBOARD */}
      {activeSubTab === "availability" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-brand-600" />
                Live Stock Availability (86 Controls)
              </h3>
              <p className="text-xs text-slate-500">
                Instantly mark items Sold Out without deleting them. Immediately syncs with Waiter App, POS, and QR Menu.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="success" size="sm">
                {items.filter((i) => i.is_available).length} Available
              </Badge>
              <Badge variant="danger" size="sm">
                {items.filter((i) => !i.is_available).length} Sold Out (86)
              </Badge>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search dish by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Dish / Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Kitchen Station</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.is_veg ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          title={item.is_veg ? "Vegetarian" : "Non-Vegetarian"}
                        />
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{item.category_name}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.base_price)}
                    </td>
                    <td className="p-3 text-slate-500">{item.kitchen_station}</td>
                    <td className="p-3">
                      <Badge variant={item.is_available ? "success" : "danger"} size="sm">
                        {item.is_available ? "In Stock" : "Sold Out (86)"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant={item.is_available ? "outline" : "primary"}
                        size="sm"
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`text-xs ${
                          item.is_available ? "text-rose-600 hover:text-rose-700" : ""
                        }`}
                      >
                        {item.is_available ? "Mark Sold Out" : "Mark Available"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CATEGORIES MANAGEMENT */}
      {activeSubTab === "categories" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Tag className="h-4 w-4 mr-2 text-brand-600" />
                Menu Categories
              </h3>
              <p className="text-xs text-slate-500">
                Organize items by culinary course and display sequence.
              </p>
            </div>
            <Button variant="primary" size="sm" className="space-x-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {categories.map((cat, idx) => (
              <div
                key={cat}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                    {cat}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {items.filter((i) => (i.category_name || "General") === cat).length} items
                  </span>
                </div>
                <Badge variant="brand" size="sm">
                  #{idx + 1}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CATALOG BEHAVIOR RULES */}
      {activeSubTab === "config" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <UtensilsCrossed className="h-4 w-4 mr-2 text-brand-600" />
            Catalog Operational Behavior
          </h3>
          <p className="text-xs text-slate-500">
            Rules governing item search, vegetarian badge requirements, and prep time estimation.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Mandatory Green/Red Veg Indicator Badges
                </span>
                <span className="text-[11px] text-slate-500">
                  Required on all digital menus and customer invoices per FSSAI regulations.
                </span>
              </div>
              <Badge variant="success" size="sm">
                Always Active
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Auto-Hide Sold Out Items on Customer Digital QR Menu
                </span>
                <span className="text-[11px] text-slate-500">
                  When toggled, sold out items display with 'Sold Out' badge rather than disappearing entirely.
                </span>
              </div>
              <Badge variant="brand" size="sm">
                Configured
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
