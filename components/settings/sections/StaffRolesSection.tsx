"use client";

import * as React from "react";
import { Users, Shield, UserCheck, Check, X, Clock, Plus, Trash2, KeyRound } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RolePermissionMatrix } from "@/types/settings";

const ROLES_LIST = [
  { id: "admin", label: "Admin (Owner)", desc: "Unrestricted operational & financial control" },
  { id: "manager", label: "Restaurant Manager", desc: "Supervises POS, voids, refunds, and cashier shifts" },
  { id: "cashier", label: "Cashier", desc: "Settles invoices, tenders cash/UPI, manages register" },
  { id: "waiter", label: "Captain / Waiter", desc: "Takes table orders, punches KOTs, service requests" },
  { id: "delivery", label: "Delivery Boy", desc: "Doorstep drop-offs, COD collection, live GPS tracking" },
];

export function StaffRolesSection() {
  const {
    permissions,
    staffApprovals,
    pendingChanges,
    updatePending,
    approveStaffRequest,
    rejectStaffRequest,
  } = useSettingsStore();

  const currentPermissions = pendingChanges?.permissions || permissions;
  const currentApprovals = pendingChanges?.staffApprovals || staffApprovals;

  const [activeSubTab, setActiveSubTab] = React.useState<"permissions" | "approvals">("permissions");
  const [selectedRole, setSelectedRole] = React.useState<string>("cashier");

  const handleTogglePermission = (
    module: keyof RolePermissionMatrix[string],
    perm: string
  ) => {
    const roleObj = currentPermissions[selectedRole] || ({} as any);
    const moduleObj = ((roleObj as any)[module] || {}) as Record<string, boolean>;
    const updated = {
      ...currentPermissions,
      [selectedRole]: {
        ...roleObj,
        [module]: {
          ...moduleObj,
          [perm]: !moduleObj[perm],
        },
      },
    };
    updatePending("permissions", updated);
  };

  const pendingCount = currentApprovals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("permissions")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "permissions"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Granular Role Permissions Matrix</span>
        </button>
        <button
          onClick={() => setActiveSubTab("approvals")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "approvals"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Staff Registration Approvals</span>
          {pendingCount > 0 && (
            <Badge variant="warning" size="sm" className="ml-1 text-[10px]">
              {pendingCount} Pending
            </Badge>
          )}
        </button>
      </div>

      {/* 1. PERMISSIONS MATRIX */}
      {activeSubTab === "permissions" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-brand-600" />
              Role-Based Access Control (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Customize precise feature capabilities for each operational tier.
            </p>

            {/* Role Selector Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              {ROLES_LIST.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-2 border ${
                    selectedRole === r.id
                      ? "border-brand-600 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {/* Permissions Checkbox Grid for Selected Role */}
            {currentPermissions[selectedRole] && (
              <div className="space-y-4 pt-2">
                {/* POS Module */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Point of Sale (POS) Module
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(currentPermissions[selectedRole].pos || {}).map(([perm, val]) => (
                      <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val}
                          disabled={selectedRole === "admin"}
                          onChange={() => handleTogglePermission("pos", perm)}
                          className="rounded text-brand-600 h-4 w-4"
                        />
                        <span className="capitalize text-slate-700 dark:text-slate-300">
                          {perm.replace(/([A-Z])/g, " $1")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bills Module */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Bills & Invoices Module
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(currentPermissions[selectedRole].bills || {}).map(([perm, val]) => (
                      <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val}
                          disabled={selectedRole === "admin"}
                          onChange={() => handleTogglePermission("bills", perm)}
                          className="rounded text-brand-600 h-4 w-4"
                        />
                        <span className="capitalize text-slate-700 dark:text-slate-300">
                          {perm.replace(/([A-Z])/g, " $1")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tables & Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Floor Tables Module
                    </span>
                    <div className="space-y-2 text-xs">
                      {Object.entries(currentPermissions[selectedRole].tables || {}).map(([perm, val]) => (
                        <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={val}
                            disabled={selectedRole === "admin"}
                            onChange={() => handleTogglePermission("tables", perm)}
                            className="rounded text-brand-600 h-4 w-4"
                          />
                          <span className="capitalize text-slate-700 dark:text-slate-300">
                            {perm} Tables
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Delivery Operations Module
                    </span>
                    <div className="space-y-2 text-xs">
                      {Object.entries(currentPermissions[selectedRole].delivery || {}).map(([perm, val]) => (
                        <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={val}
                            disabled={selectedRole === "admin"}
                            onChange={() => handleTogglePermission("delivery", perm)}
                            className="rounded text-brand-600 h-4 w-4"
                          />
                          <span className="capitalize text-slate-700 dark:text-slate-300">
                            {perm} Deliveries
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. STAFF APPROVALS WORKFLOW */}
      {activeSubTab === "approvals" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-brand-600" />
                Staff Registration Security Review
              </h3>
              <p className="text-xs text-slate-500">
                New staff registrations remain in 'Pending' status and cannot access the system until an Admin approves them.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {currentApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No pending registration requests.
              </div>
            ) : (
              currentApprovals.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {req.fullName}
                      </span>
                      <Badge variant="brand" size="sm" className="capitalize text-[10px]">
                        Requested: {req.requestedRole}
                      </Badge>
                      <Badge
                        variant={
                          req.status === "approved"
                            ? "success"
                            : req.status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                        className="capitalize text-[10px]"
                      >
                        {req.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 space-x-3">
                      <span>{req.email}</span>
                      <span>{req.phone}</span>
                      <span>Registered: {new Date(req.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => approveStaffRequest(req.id)}
                        className="h-8 text-xs space-x-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve Account</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => rejectStaffRequest(req.id)}
                        className="h-8 text-xs space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
