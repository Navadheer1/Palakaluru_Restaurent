import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ElementType;
  description?: string;
  subtext?: string;
  isLoading?: boolean;
  variant?: "brand" | "emerald" | "amber" | "sky" | "indigo" | "rose";
}

export function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  description,
  subtext,
  isLoading,
  variant = "brand",
}: MetricCardProps) {
  const iconVariants = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-transform",
            iconVariants[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {isLoading ? "..." : value}
        </h3>
        {change && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-semibold",
              isPositive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
            )}
            {change}
          </span>
        )}
      </div>

      {(description || subtext) && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {description || subtext}
        </p>
      )}
    </div>
  );
}
