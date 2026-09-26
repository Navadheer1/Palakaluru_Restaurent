"use client";

import * as React from "react";
import { DollarSign, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";
import { Expense } from "@/types/database";

export function ExpensesView() {
  const { profile } = useAuthProfile();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchExpenses = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("restaurant_id", profile.restaurant_id)
          .order("expense_date", { ascending: false });

        if (!error && data && isSubscribed) {
          setExpenses(data as Expense[]);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchExpenses();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

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
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading expense records...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No expenses recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Track operational costs, utility bills, and supply purchases by adding expenses.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
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
                  <td className="p-3.5">
                    <Badge variant="secondary">{e.category.toUpperCase()}</Badge>
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{e.description}</td>
                  <td className="p-3.5 font-bold text-rose-600">{formatCurrency(e.amount)}</td>
                  <td className="p-3.5 uppercase text-slate-500">{e.payment_method}</td>
                  <td className="p-3.5 text-slate-400">
                    {e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
