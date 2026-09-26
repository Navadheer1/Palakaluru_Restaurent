"use client";

import * as React from "react";
import { Plug, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck, Play } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { IntegrationItem } from "@/types/settings";

export function IntegrationsSection() {
  const { integrations, pendingChanges, updatePending, testIntegration } = useSettingsStore();

  const currentIntegrations = pendingChanges?.integrations || integrations;

  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<{ id: string; success: boolean; message: string } | null>(null);
  const [configureItem, setConfigureItem] = React.useState<IntegrationItem | null>(null);

  const handleTest = async (item: IntegrationItem) => {
    setTestingId(item.id);
    setTestResult(null);
    const res = await testIntegration(item.id);
    setTestingId(null);
    setTestResult({ id: item.id, ...res });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configureItem) return;

    const updated = currentIntegrations.map((i) =>
      i.id === configureItem.id ? configureItem : i
    );
    updatePending("integrations", updated);
    setConfigureItem(null);
  };

  const handleDisconnect = (id: string) => {
    const updated = currentIntegrations.map((i) =>
      i.id === id ? { ...i, status: "disconnected" as const } : i
    );
    updatePending("integrations", updated);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Plug className="h-4 w-4 mr-2 text-brand-600" />
              Connected Enterprise Cloud Services & APIs
            </h3>
            <p className="text-xs text-slate-500">
              Integrations with payment gateways, Google Maps distance matrix, SMS aggregators, and Meta WhatsApp.
            </p>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center space-x-2 ${
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {currentIntegrations.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </span>
                    <Badge
                      variant={item.status === "connected" ? "success" : "neutral"}
                      size="sm"
                    >
                      {item.status === "connected" ? "Connected ●" : "Disconnected"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">{item.provider}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate">{item.maskedApiKey}</span>
                <span className="text-[10px] text-emerald-600 font-bold shrink-0 ml-2">Masked Vault</span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(item)}
                  isLoading={testingId === item.id}
                  className="text-xs h-7 space-x-1"
                >
                  <Play className="h-3 w-3" />
                  <span>Test Connection</span>
                </Button>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfigureItem(item)}
                    className="text-xs h-7"
                  >
                    Configure
                  </Button>
                  {item.status === "connected" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(item.id)}
                      className="text-rose-500 hover:text-rose-600 text-xs h-7"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configure Modal */}
      <Dialog open={!!configureItem} onOpenChange={() => setConfigureItem(null)}>
        {configureItem && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Configure {configureItem.name}</DialogTitle>
              <DialogDescription>
                Provide production API credentials. Keys are encrypted at rest with pgcrypto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Provider Label</label>
                <Input value={configureItem.provider} readOnly className="bg-slate-50 dark:bg-slate-900" />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">API Key / Secret Token</label>
                <Input
                  type="password"
                  placeholder="Enter new API secret to update..."
                  value={configureItem.maskedApiKey.includes("*") ? "" : configureItem.maskedApiKey}
                  onChange={(e) =>
                    setConfigureItem({ ...configureItem, maskedApiKey: e.target.value, status: "connected" })
                  }
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Leave blank to retain existing secure production credentials.
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setConfigureItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save & Connect
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
}
