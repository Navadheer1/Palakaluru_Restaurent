"use client";

import * as React from "react";
import { Truck, Plus, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

const suppliers = [
  { id: "1", name: "Guntur Wholesale Spices", contact: "Venkat Rao", phone: "+91 98480 99887", email: "spices@guntur.in", gst: "37AAAAA0000A1Z5" },
  { id: "2", name: "Krishna Dairy Cooperative", contact: "S. Murthy", phone: "+91 98481 22334", email: "orders@krishnadairy.com", gst: "37BBBBB1111B2Z6" },
  { id: "3", name: "Royal Poultry Farms", contact: "Anil Kumar", phone: "+91 98482 44556", email: "royalpoultry@gmail.com", gst: "37CCCCC2222C3Z7" },
];

export default function SuppliersPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <div key={sup.id} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{sup.name}</h3>
            <p className="text-xs text-slate-400 mb-3">Contact: {sup.contact}</p>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center">
                <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <span>{sup.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <span>{sup.email}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
              GSTIN: {sup.gst}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
