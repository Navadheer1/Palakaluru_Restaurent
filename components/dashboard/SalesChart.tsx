"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const hourlyData = [
  { time: "11 AM", sales: 2400, orders: 8 },
  { time: "12 PM", sales: 8500, orders: 22 },
  { time: "1 PM", sales: 14200, orders: 36 },
  { time: "2 PM", sales: 18900, orders: 48 },
  { time: "3 PM", sales: 7400, orders: 18 },
  { time: "4 PM", sales: 4300, orders: 12 },
  { time: "5 PM", sales: 6100, orders: 15 },
  { time: "6 PM", sales: 11200, orders: 28 },
  { time: "7 PM", sales: 19800, orders: 49 },
  { time: "8 PM", sales: 26400, orders: 62 },
  { time: "9 PM", sales: 22100, orders: 54 },
  { time: "10 PM", sales: 9800, orders: 24 },
];

export function SalesChart() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[280px] w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />;
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={hourlyData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(val) => `₹${val / 1000}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-brand-600">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Orders: {payload[0].payload.orders}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#ea580c"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#salesGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
