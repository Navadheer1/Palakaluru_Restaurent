"use client";

import * as React from "react";
import { ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";

interface PurchaseOrderRecord {
  id: string;
  po_number?: string;
  total_amount: number;
  status: string;
  created_at: string;
  supplier?: { name: string } | null;
}

export function PurchasesView() {
  const { profile } = useAuthProfile();
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrderRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchPOs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("purchase_orders")
          .select("id, po_number, total_amount, status, created_at, suppliers(name)")
          .eq("restaurant_id", profile.restaurant_id)
          .order("created_at", { ascending: false });

        if (!error && data && isSubscribed) {
          const formatted = data.map((po: any) => ({
            id: po.id,
            po_number: po.po_number || `PO-${po.id.slice(0, 6)}`,
            total_amount: po.total_amount || 0,
            status: po.status || "draft",
            created_at: po.created_at,
            supplier: po.suppliers,
          }));
          setPurchaseOrders(formatted);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchPOs();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2 text-brand-600" />
            Purchase Orders & Stock Procurement
          </h1>
          <p className="text-xs text-slate-500">
            Create vendor orders, receive stock, and automatically sync inventory levels
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create PO
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading purchase orders...</div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No purchase orders found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create purchase orders to order raw materials and restock kitchen inventory.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Total Cost</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-brand-600">{po.po_number}</td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {po.supplier?.name || "Direct Vendor"}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(po.total_amount)}</td>
                  <td className="p-3.5">
                    <Badge variant={po.status === "received" ? "success" : po.status === "ordered" ? "info" : "secondary"}>
                      {po.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {po.created_at ? new Date(po.created_at).toLocaleDateString() : "—"}
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
