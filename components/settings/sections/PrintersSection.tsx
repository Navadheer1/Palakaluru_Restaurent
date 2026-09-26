"use client";

import * as React from "react";
import { Printer, Plus, Trash2, Edit2, Play, CheckCircle2, AlertCircle, Wifi } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { PrinterItemConfig } from "@/types/settings";

export function PrintersSection() {
  const { printers, pendingChanges, updatePending, testPrinter } = useSettingsStore();

  const currentPrinters = pendingChanges?.printers || printers;

  const [activeSubTab, setActiveSubTab] = React.useState<"hardware" | "routing">("hardware");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingPrinter, setEditingPrinter] = React.useState<PrinterItemConfig | null>(null);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<{ id: string; success: boolean; message: string } | null>(null);

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter) return;

    let updated: PrinterItemConfig[];
    if (currentPrinters.some((p) => p.id === editingPrinter.id)) {
      updated = currentPrinters.map((p) => (p.id === editingPrinter.id ? editingPrinter : p));
    } else {
      updated = [...currentPrinters, editingPrinter];
    }
    updatePending("printers", updated);
    setModalOpen(false);
    setEditingPrinter(null);
  };

  const handleDeletePrinter = (id: string) => {
    if (currentPrinters.length <= 1) {
      alert("At least one receipt printer is required.");
      return;
    }
    updatePending("printers", currentPrinters.filter((p) => p.id !== id));
  };

  const handleTestPrint = async (printer: PrinterItemConfig) => {
    setTestingId(printer.id);
    setTestResult(null);
    const res = await testPrinter(printer.id);
    setTestingId(null);
    setTestResult({ id: printer.id, ...res });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("hardware")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "hardware"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>Network Printers ({currentPrinters.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("routing")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "routing"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Wifi className="h-4 w-4" />
          <span>Category & Station Routing</span>
        </button>
      </div>

      {/* 1. NETWORK PRINTERS HARDWARE */}
      {activeSubTab === "hardware" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Printer className="h-4 w-4 mr-2 text-brand-600" />
                  Thermal Network Printers (ESC/POS)
                </h3>
                <p className="text-xs text-slate-500">
                  Manage IP-based Ethernet & WiFi thermal roll printers for cashier bills and kitchen tickets.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingPrinter({
                    id: `prn-${Date.now()}`,
                    name: "",
                    type: "kot",
                    ipAddress: "192.168.1.160",
                    port: 9100,
                    paperWidth: "80mm",
                    isActive: true,
                    assignedStations: [],
                  });
                  setModalOpen(true);
                }}
                className="space-x-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Network Printer</span>
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                  testResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {currentPrinters.map((prn) => (
                <div
                  key={prn.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                        {prn.name || "Untitled Printer"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {prn.ipAddress}:{prn.port}
                      </span>
                    </div>
                    <Badge variant={prn.type === "receipt" ? "brand" : "neutral"} size="sm" className="capitalize">
                      {prn.type}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                    <span>Paper: {prn.paperWidth}</span>
                    <Badge variant={prn.isActive ? "success" : "neutral"} size="sm">
                      {prn.isActive ? "Online" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestPrint(prn)}
                      isLoading={testingId === prn.id}
                      className="text-xs h-7 space-x-1"
                    >
                      <Play className="h-3 w-3" />
                      <span>Test Print</span>
                    </Button>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPrinter(prn);
                          setModalOpen(true);
                        }}
                        className="text-xs h-7"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrinter(prn.id)}
                        className="text-rose-500 hover:text-rose-600 h-7"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORY & STATION ROUTING */}
      {activeSubTab === "routing" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Wifi className="h-4 w-4 mr-2 text-brand-600" />
            Kitchen Order Routing Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Route tickets automatically by course to the respective station thermal printers.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Biryani, Curries & Rice Dishes
                </span>
                <span className="text-[11px] text-slate-500">
                  Routed to: Kitchen KOT Hot Line Printer (192.168.1.151)
                </span>
              </div>
              <Badge variant="brand" size="sm">
                Route Active
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Beverages, Soft Drinks & Mocktails
                </span>
                <span className="text-[11px] text-slate-500">
                  Routed to: Bar & Dessert KOT Printer (192.168.1.152)
                </span>
              </div>
              <Badge variant="brand" size="sm">
                Route Active
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                  Customer Settlement Bills & Invoices
                </span>
                <span className="text-[11px] text-slate-500">
                  Routed to: Cashier Counter Thermal Printer (192.168.1.150)
                </span>
              </div>
              <Badge variant="brand" size="sm">
                Route Active
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {editingPrinter && (
          <form onSubmit={handleSavePrinter} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingPrinter.name ? "Edit Printer" : "Add Network Printer"}</DialogTitle>
              <DialogDescription>
                Configure ESC/POS thermal printer IP, port, and paper width roll.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Printer Name</label>
                <Input
                  required
                  value={editingPrinter.name}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  placeholder="e.g. Kitchen KOT Hot Line"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Printer Type</label>
                  <select
                    value={editingPrinter.type}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, type: e.target.value as any })}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                  >
                    <option value="receipt">Customer Receipt</option>
                    <option value="kot">Kitchen KOT</option>
                    <option value="bar">Bar & Drinks</option>
                    <option value="kitchen">General Kitchen</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Paper Roll Width</label>
                  <select
                    value={editingPrinter.paperWidth}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, paperWidth: e.target.value as any })}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                  >
                    <option value="80mm">80mm (Standard POS)</option>
                    <option value="58mm">58mm (Mobile Roll)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">IP Address</label>
                  <Input
                    required
                    value={editingPrinter.ipAddress}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, ipAddress: e.target.value })}
                    placeholder="192.168.1.150"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Port</label>
                  <Input
                    type="number"
                    required
                    value={editingPrinter.port}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, port: parseInt(e.target.value) || 9100 })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Printer
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
}
