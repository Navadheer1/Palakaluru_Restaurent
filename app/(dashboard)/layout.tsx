"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUiStore } from "@/stores/useUiStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed } = useUiStore();
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute default stale time
            gcTime: 1000 * 60 * 10, // 10 minutes cache retention
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950">
        <Sidebar />
        <div
          className={cn(
            "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          )}
        >
          <Topbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
