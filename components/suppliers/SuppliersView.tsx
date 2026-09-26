"use client";

import * as React from "react";
import { Truck, Plus, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";
import { Supplier } from "@/types/database";

export function SuppliersView() {
  const { profile } = useAuthProfile();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchSuppliers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .eq("restaurant_id", profile.restaurant_id)
          .order("name", { ascending: true });

        if (!error && data && isSubscribed) {
          setSuppliers(data as Supplier[]);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchSuppliers();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <Truck className="h-6 w-6 mr-2 text-brand-600" />
            Supplier Directory & Contacts
          </h1>
          <p className="text-xs text-slate-500">
            Maintain ingredient vendors, GST records, and procurement terms
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Supplier
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading supplier directory...</div>
      ) : suppliers.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
          <Truck className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No suppliers registered</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add ingredient vendors, dairy providers, and spice distributors to your directory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{sup.name}</h3>
              <p className="text-xs text-slate-400 mb-3">{sup.company || "Direct Supplier"}</p>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span>{sup.phone || "No phone recorded"}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <span>{sup.email || "No email recorded"}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
                GSTIN: {sup.gst_number || "Unregistered"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
