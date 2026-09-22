"use client";

import * as React from "react";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const expenses = [
  { id: "EXP-101", category: "Electricity", desc: "Main Dining & Kitchen Power Bill", amount: 14200, date: "20 Sep 2026", method: "UPI" },
  { id: "EXP-102", category: "Gas", desc: "Commercial LPG Cylinders (4x)", amount: 7600, date: "18 Sep 2026", method: "Cash" },
  { id: "EXP-103", category: "Supplies", desc: "Takeaway Containers & Kraft Bags", amount: 3400, date: "15 Sep 2026", method: "UPI" },
  { id: "EXP-104", category: "Maintenance", desc: "AC Deep Cleaning & Filter Service", amount: 2500, date: "12 Sep 2026", method: "Cash" },
];

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-brand-600" />
            Restaurant Expense Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Log operational overheads (Rent, Electricity, Gas, Supplies, Maintenance)
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Expense
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Expense ID</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Method</th>
              <th className="p-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-brand-600">{e.id}</td>
                <td className="p-3.5">
                  <Badge variant="secondary">{e.category}</Badge>
                </td>
                <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{e.desc}</td>
                <td className="p-3.5 font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                <td className="p-3.5 uppercase text-slate-500">{e.method}</td>
                <td className="p-3.5 text-slate-400">{e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
