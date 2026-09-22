"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";

export function UserDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { profile, invalidateAuthProfile } = useAuthProfile();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      invalidateAuthProfile();
      router.push("/login");
      router.refresh();
    } catch {
      invalidateAuthProfile();
      router.push("/login");
    }
  };

  const displayName = profile?.full_name || profile?.name || "Palakaluru Admin";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "PA";

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
            {profile?.role === "admin" ? "Super Admin" : profile?.role || "Admin"}
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
              {profile?.email || "admin@palakaluru.com"}
            </p>
            <div className="mt-1 flex items-center text-[10px] text-emerald-600 font-medium">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Role: Admin (Full Access)
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium"
            >
              <User className="mr-2 h-4 w-4 text-brand-600" />
              Admin Profile & Security
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Settings className="mr-2 h-4 w-4 text-slate-400" />
              Restaurant Settings
            </Link>
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium"
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
