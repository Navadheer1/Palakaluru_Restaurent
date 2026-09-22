"use client";

import * as React from "react";
import { Settings, Save, Store, Receipt, Printer, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
          <Settings className="h-6 w-6 mr-2 text-brand-600" />
          Restaurant & Branch Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure restaurant identity, GST tax slabs, thermal receipt printing, and branch profiles
        </p>
      </div>

      <div className="space-y-6">
        {/* Restaurant Profile */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b pb-2 flex items-center">
            <Store className="h-4 w-4 mr-2 text-brand-600" />
            General Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Restaurant Name
              </label>
              <Input defaultValue="Palakaluru Grand Restaurant" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Branch Name
              </label>
              <Input defaultValue="Main Campus (PLK-01)" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Phone
              </label>
              <Input defaultValue="+91 98480 12345" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Email
              </label>
              <Input defaultValue="contact@palakalurugrand.com" />
            </div>
          </div>
        </div>

        {/* Taxes & Charges */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b pb-2 flex items-center">
            <Receipt className="h-4 w-4 mr-2 text-brand-600" />
            Taxes & Invoicing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                GST Rate (%)
              </label>
              <Input defaultValue="5.00" type="number" step="0.1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Service Charge (%)
              </label>
              <Input defaultValue="2.50" type="number" step="0.1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Currency Symbol
              </label>
              <Input defaultValue="INR (₹)" disabled />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="md" className="space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
