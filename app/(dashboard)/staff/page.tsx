"use client";

import * as React from "react";
import { ShieldCheck, Plus, Mail, Phone, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const staffList = [
  { id: "1", name: "Nayudu Garu", role: "admin", email: "admin@palakaluru.com", phone: "+91 98480 12345", status: "active", branch: "Palakaluru Main" },
  { id: "2", name: "K. Satish", role: "manager", email: "manager@palakaluru.com", phone: "+91 98480 23456", status: "active", branch: "Palakaluru Main" },
  { id: "3", name: "R. Naresh", role: "waiter", email: "waiter@palakaluru.com", phone: "+91 98480 34567", status: "active", branch: "Palakaluru Main" },
  { id: "4", name: "Chef Subba Rao", role: "kitchen", email: "kitchen@palakaluru.com", phone: "+91 98480 45678", status: "active", branch: "Palakaluru Main" },
  { id: "5", name: "Ramesh Rider", role: "delivery", email: "delivery@palakaluru.com", phone: "+91 98480 56789", status: "active", branch: "Palakaluru Main" },
];

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <ShieldCheck className="h-6 w-6 mr-2 text-brand-600" />
            Staff Members & Role Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Control restaurant roles (Admin, Manager, Waiter, Kitchen, Delivery) and terminal PINs
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Staff Member
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Branch</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {staffList.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                <td className="p-3.5">
                  <Badge variant={s.role === "admin" ? "default" : s.role === "manager" ? "info" : s.role === "kitchen" ? "warning" : "secondary"}>
                    {s.role.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-400">{s.email}</td>
                <td className="p-3.5 font-mono text-slate-500">{s.phone}</td>
                <td className="p-3.5 text-slate-500">{s.branch}</td>
                <td className="p-3.5">
                  <Badge variant="success">Active</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
