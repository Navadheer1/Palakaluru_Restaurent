"use client";

import * as React from "react";
import { Users, Plus, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const customers = [
  { id: "1", name: "Srinivas Rao", phone: "+91 98480 11223", orders: 24, spend: 18400, fav: "Mutton Biryani" },
  { id: "2", name: "Dr. K. Ramesh", phone: "+91 98481 99881", orders: 18, spend: 14200, fav: "Dum Chicken Biryani" },
  { id: "3", name: "Mohan Krishna", phone: "+91 99882 33441", orders: 12, spend: 8900, fav: "Guntur Chilli Chicken" },
  { id: "4", name: "P. Lakshmi", phone: "+91 97771 55662", orders: 9, spend: 6450, fav: "Butter Chicken" },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <Users className="h-6 w-6 mr-2 text-brand-600" />
            Customer CRM & Loyalty
          </h1>
          <p className="text-xs text-slate-500">
            Track guest repeat visits, lifetime spend, order history, and favorite dishes
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Total Orders</th>
              <th className="p-3.5">Lifetime Spend</th>
              <th className="p-3.5">Favorite Item</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                <td className="p-3.5 font-mono text-slate-500">{c.phone}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{c.orders} orders</td>
                <td className="p-3.5 font-bold text-brand-600">{formatCurrency(c.spend)}</td>
                <td className="p-3.5 text-slate-600 dark:text-slate-300 flex items-center">
                  <Star className="h-3.5 w-3.5 text-amber-500 mr-1 fill-amber-500" />
                  {c.fav}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
