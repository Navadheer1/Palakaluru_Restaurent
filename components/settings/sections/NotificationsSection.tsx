"use client";

import * as React from "react";
import { Bell, MessageSquare, Volume2, Mail, Smartphone, Check } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export function NotificationsSection() {
  const { notifications, whatsapp, pendingChanges, updatePending } = useSettingsStore();

  const currentNotifs = pendingChanges?.notifications || notifications;
  const currentWhatsApp = pendingChanges?.whatsapp || whatsapp;

  const [activeSubTab, setActiveSubTab] = React.useState<"alerts" | "whatsapp">("alerts");

  const handleNotifToggle = (field: keyof typeof currentNotifs) => {
    updatePending("notifications", { [field]: !currentNotifs[field] });
  };

  const handleWhatsAppChange = (field: keyof typeof currentWhatsApp, val: any) => {
    updatePending("whatsapp", { [field]: val });
  };

  const handleTemplateChange = (templateKey: keyof typeof currentWhatsApp.templates, val: string) => {
    updatePending("whatsapp", {
      templates: {
        ...currentWhatsApp.templates,
        [templateKey]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("alerts")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "alerts"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Operational Event Triggers</span>
        </button>
        <button
          onClick={() => setActiveSubTab("whatsapp")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "whatsapp"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>WhatsApp Business API Templates</span>
        </button>
      </div>

      {/* 1. OPERATIONAL ALERTS */}
      {activeSubTab === "alerts" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Bell className="h-4 w-4 mr-2 text-brand-600" />
            Kitchen, POS & Rider Real-Time Notifications
          </h3>
          <p className="text-xs text-slate-500">
            Control which operational milestones trigger sound chimes and screen toasts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentNotifs.newKotAlert}
                onChange={() => handleNotifToggle("newKotAlert")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  New KOT Ticket Dispatched
                </span>
                <span className="text-[11px] text-slate-500">Chime kitchen display tablets</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentNotifs.orderReadyAlert}
                onChange={() => handleNotifToggle("orderReadyAlert")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Food Ready for Serving
                </span>
                <span className="text-[11px] text-slate-500">Vibrate captain/waiter smartwatch & phone</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentNotifs.newDeliveryAlert}
                onChange={() => handleNotifToggle("newDeliveryAlert")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  New Online Delivery Order
                </span>
                <span className="text-[11px] text-slate-500">Audible siren on cashier POS screen</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentNotifs.paymentReceivedAlert}
                onChange={() => handleNotifToggle("paymentReceivedAlert")}
                className="rounded text-brand-600 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  UPI / Soundbox Payment Success
                </span>
                <span className="text-[11px] text-slate-500">Voice announcement of received amount</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 2. WHATSAPP TEMPLATES */}
      {activeSubTab === "whatsapp" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-emerald-600" />
                Official WhatsApp Cloud API Message Templates
              </h3>
              <p className="text-xs text-slate-500">
                Automated customer receipts and live rider tracking links sent via verified green-tick WhatsApp number.
              </p>
            </div>
            <Badge variant={currentWhatsApp.enabled ? "success" : "neutral"} size="sm">
              {currentWhatsApp.enabled ? "API Active" : "Disabled"}
            </Badge>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Order Confirmation Template
              </label>
              <textarea
                rows={2}
                value={currentWhatsApp.templates.orderConfirmation}
                onChange={(e) => handleTemplateChange("orderConfirmation", e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-2.5 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Out-For-Delivery & Live GPS Link Template
              </label>
              <textarea
                rows={2}
                value={currentWhatsApp.templates.outForDelivery}
                onChange={(e) => handleTemplateChange("outForDelivery", e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-2.5 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tax Invoice & Digital Receipt Template
              </label>
              <textarea
                rows={2}
                value={currentWhatsApp.templates.billReceipt}
                onChange={(e) => handleTemplateChange("billReceipt", e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-2.5 font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
