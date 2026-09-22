"use client";

import * as React from "react";
import { BookOpen, Plus, Search, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const menuItems = [
  { id: "1", name: "Special Dum Chicken Biryani", category: "Biryani & Rice", price: 280, time: "20m", station: "Biryani Counter", available: true },
  { id: "2", name: "Mutton Ghee Roast Biryani", category: "Biryani & Rice", price: 420, time: "25m", station: "Biryani Counter", available: true },
  { id: "3", name: "Guntur Chilli Chicken", category: "Starters & Tandoor", price: 260, time: "15m", station: "Tandoor", available: true },
  { id: "4", name: "Paneer Tikka Angara", category: "Starters & Tandoor", price: 240, time: "15m", station: "Tandoor", available: true },
  { id: "5", name: "Butter Chicken Delhi Style", category: "Curries & Gravies", price: 310, time: "15m", station: "Curry Line", available: true },
  { id: "6", name: "Garlic Butter Naan", category: "Breads & Naan", price: 60, time: "8m", station: "Tandoor", available: true },
  { id: "7", name: "Mango Malai Lassi", category: "Beverages", price: 90, time: "5m", station: "Drinks Counter", available: true },
];

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-brand-600" />
            Menu Catalog & Pricing
          </h1>
          <p className="text-xs text-slate-500">
            Organize dishes, categories, variants, addons, and kitchen station routing
          </p>
        </div>
        <Button variant="primary" size="sm" className="space-x-1.5">
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Dish Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Prep Time</th>
                <th className="p-3.5">Station</th>
                <th className="p-3.5">Availability</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {menuItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.category}</td>
                  <td className="p-3.5 font-bold text-brand-600">{formatCurrency(item.price)}</td>
                  <td className="p-3.5 text-slate-500">{item.time}</td>
                  <td className="p-3.5 text-slate-500">{item.station}</td>
                  <td className="p-3.5">
                    <Badge variant="success">Available</Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <button className="text-slate-400 hover:text-brand-600 transition-colors">
                      <Edit2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
