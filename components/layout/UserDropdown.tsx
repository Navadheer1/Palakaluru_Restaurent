"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";

export function UserDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { profile, clearAuthProfileCache } = useAuthProfile();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      // Clear cookies and session storage
      if (typeof window !== "undefined") {
        document.cookie = "rms_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "rms_staff_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        sessionStorage.clear();
      }
      clearAuthProfileCache();
      // Hard navigation to reset all client memory and unmount role layouts
      window.location.href = "/login";
    }
  };

  const userRole = profile?.role || "waiter";
  const displayName = profile?.full_name || profile?.name || (userRole === "admin" ? "Admin" : "Staff User");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "PL";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-xs dark:bg-brand-950 dark:text-brand-300">
          {initials}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[120px]">
            {displayName}
          </p>
          <p className="text-[10px] text-slate-400 leading-none mt-1 uppercase tracking-wide">
            {userRole}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {profile?.email || ""}
            </p>
            <div className="mt-1 flex items-center text-[10px] text-brand-600 font-bold uppercase">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Role: {userRole}
            </div>
          </div>

          <div className="py-1">
            <Link
              href={`/${userRole}/profile`}
              onClick={() => setIsOpen(false)}
              className="flex items-center rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium"
            >
              <User className="mr-2 h-4 w-4 text-brand-600" />
              My Profile
            </Link>

            {userRole === "admin" && (
              <Link
                href="/admin/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="mr-2 h-4 w-4 text-slate-400" />
                Restaurant Settings
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
