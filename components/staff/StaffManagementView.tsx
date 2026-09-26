"use client";

import * as React from "react";
import { ShieldCheck, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";

interface StaffProfile {
  id: string;
  full_name: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  is_active?: boolean;
}

export function StaffManagementView() {
  const { profile } = useAuthProfile();
  const [staff, setStaff] = React.useState<StaffProfile[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchStaff = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role, email, phone, is_active")
          .eq("restaurant_id", profile.restaurant_id)
          .order("full_name", { ascending: true });

        if (!error && data && isSubscribed) {
          setStaff(data as StaffProfile[]);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchStaff();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

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
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading staff directory...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No staff members found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Staff accounts created for your restaurant will appear here with role permissions.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {s.full_name || "Staff Member"}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={s.role === "admin" ? "default" : s.role === "manager" ? "info" : s.role === "kitchen" ? "warning" : "secondary"}>
                      {(s.role || "staff").toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{s.email || "—"}</td>
                  <td className="p-3.5 font-mono text-slate-500">{s.phone || "—"}</td>
                  <td className="p-3.5">
                    <Badge variant={s.is_active !== false ? "success" : "secondary"}>
                      {s.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
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
