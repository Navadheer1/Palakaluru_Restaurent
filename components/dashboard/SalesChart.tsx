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
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { createClient } from "@/lib/supabase/client";
import { BarChart3 } from "lucide-react";

interface HourlyPoint {
  time: string;
  sales: number;
  orders: number;
}

export function SalesChart() {
  const [mounted, setMounted] = React.useState(false);
  const { profile } = useAuthProfile();
  const [chartData, setChartData] = React.useState<HourlyPoint[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!profile?.restaurant_id) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    const fetchTodaySales = async () => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("total_amount, created_at, status")
          .eq("restaurant_id", profile.restaurant_id)
          .gte("created_at", startOfDay.toISOString());

        if (!error && data && isSubscribed) {
          if (data.length === 0) {
            setChartData([]);
          } else {
            // Group orders by hour
            const hoursMap: Record<number, { sales: number; count: number }> = {};
            data.forEach((ord) => {
              const date = new Date(ord.created_at);
              const hour = date.getHours();
              if (!hoursMap[hour]) hoursMap[hour] = { sales: 0, count: 0 };
              hoursMap[hour].sales += Number(ord.total_amount || 0);
              hoursMap[hour].count += 1;
            });

            // Convert to array sorted by hour
            const points: HourlyPoint[] = Object.keys(hoursMap)
              .map(Number)
              .sort((a, b) => a - b)
              .map((hour) => {
                const ampm = hour >= 12 ? "PM" : "AM";
                const displayHour = hour % 12 || 12;
                return {
                  time: `${displayHour} ${ampm}`,
                  sales: hoursMap[hour].sales,
                  orders: hoursMap[hour].count,
                };
              });

            setChartData(points);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchTodaySales();
    return () => {
      isSubscribed = false;
    };
  }, [profile?.restaurant_id]);

  if (!mounted || loading) {
    return <div className="h-[280px] w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center p-6">
        <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No sales recorded today</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Today&apos;s hourly sales will plot here as bills are settled.</p>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
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
            tickFormatter={(val) => `₹${val}`}
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
