"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rolePrefix = segments[0] || "admin";
  const homeHref = rolePrefix === "cashier" ? "/cashier/pos" : `/${rolePrefix}/dashboard`;

  if (segments.length <= 1) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Home className="h-3.5 w-3.5 text-slate-400" />
        <span>/</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {segments[0] ? segments[0].toUpperCase() : "Dashboard"}
        </span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
      <Link
        href={homeHref}
        className="flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, idx) => {
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const formatted =
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

        return (
          <React.Fragment key={segment}>
            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatted}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-slate-700 dark:hover:text-slate-300"
              >
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
