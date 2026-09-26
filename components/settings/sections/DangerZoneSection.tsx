"use client";

import * as React from "react";
import { AlertTriangle, ShieldAlert, RotateCcw, Building2, Store, Lock } from "lucide-react";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/stores/useSettingsStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

export function DangerZoneSection() {
  const { dangerZone, updatePending, commitPendingChanges, addAuditLog } = useSettingsStore();

  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    type: "reset_config" | "suspend_restaurant" | "deactivate_branch";
    requiredPhrase: string;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: "reset_config",
    requiredPhrase: "",
    title: "",
    description: "",
  });

  const [inputPhrase, setInputPhrase] = React.useState("");

  const handleOpenConfirm = (
    type: "reset_config" | "suspend_restaurant" | "deactivate_branch",
    phrase: string,
    title: string,
    description: string
  ) => {
    setInputPhrase("");
    setConfirmDialog({
      isOpen: true,
      type,
      requiredPhrase: phrase,
      title,
      description,
    });
  };

  const handleExecuteDestructive = async () => {
    if (inputPhrase !== confirmDialog.requiredPhrase) {
      alert("Verification phrase did not match.");
      return;
    }

    if (confirmDialog.type === "reset_config") {
      localStorage.removeItem("culinacloud_admin_settings_v3");
      addAuditLog("Danger Zone", "Reset Restaurant Settings to Factory Defaults", "Custom Config", "Default Config");
      window.location.reload();
    } else if (confirmDialog.type === "suspend_restaurant") {
      updatePending("dangerZone", { isRestaurantSuspended: true });
      await commitPendingChanges();
      addAuditLog("Danger Zone", "Suspended Restaurant Operations", "Active", "Suspended");
      alert("Restaurant operations have been suspended.");
    } else if (confirmDialog.type === "deactivate_branch") {
      updatePending("dangerZone", { isBranchDeactivated: true });
      await commitPendingChanges();
      addAuditLog("Danger Zone", "Deactivated Branch", "Active", "Deactivated");
      alert("Secondary branch deactivated.");
    }

    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 border-b border-rose-200/80 dark:border-rose-900/60 pb-3">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Restricted Destruction & Critical Overrides
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              Actions in this section carry permanent consequences. Exact phrase verification and audit trails are enforced.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Action 1: Reset Configuration */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                Reset All Configuration to Factory Defaults
              </span>
              <p className="text-[11px] text-slate-500">
                Reverts tax rates, billing prefixes, printer setups, and appearance to default Palakaluru parameters. Does not delete sales or bills.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleOpenConfirm(
                  "reset_config",
                  "RESET CONFIG",
                  "Reset All Settings to Factory Defaults?",
                  "This will reset all your custom taxes, printer definitions, and themes back to factory baseline."
                )
              }
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs shrink-0"
            >
              Reset Configuration
            </Button>
          </div>

          {/* Action 2: Deactivate Outlet Branch */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                Emergency Suspension of Secondary Branch
              </span>
              <p className="text-[11px] text-slate-500">
                Temporarily shuts down order taking and POS billing at Arundelpet Express.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleOpenConfirm(
                  "deactivate_branch",
                  "DEACTIVATE BRANCH",
                  "Deactivate Arundelpet Express Branch?",
                  "Staff assigned to this branch will be unable to open cashier shifts or take orders until reactivated."
                )
              }
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs shrink-0"
            >
              Deactivate Branch
            </Button>
          </div>

          {/* Action 3: Suspend Restaurant Operations */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <Store className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                Emergency Full Restaurant Suspension
              </span>
              <p className="text-[11px] text-slate-500">
                Blocks public digital menus and flags entire restaurant as temporarily closed for emergency sanitization or statutory audits.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                handleOpenConfirm(
                  "suspend_restaurant",
                  "SUSPEND RESTAURANT",
                  "Emergency Suspend Entire Restaurant?",
                  "This places the entire establishment in an emergency lockdown status. Waiters and riders will see an administrative halt notice."
                )
              }
              className="text-xs shrink-0"
            >
              Suspend Restaurant
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}>
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>{confirmDialog.title}</DialogTitle>
            </div>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
            <p className="text-rose-900 dark:text-rose-300">
              To proceed, please type <strong className="font-mono underline">{confirmDialog.requiredPhrase}</strong> below:
            </p>
            <Input
              value={inputPhrase}
              onChange={(e) => setInputPhrase(e.target.value)}
              placeholder={`Type "${confirmDialog.requiredPhrase}"`}
              className="bg-white dark:bg-slate-900 font-mono text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={inputPhrase !== confirmDialog.requiredPhrase}
              onClick={handleExecuteDestructive}
            >
              Verify & Execute
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
