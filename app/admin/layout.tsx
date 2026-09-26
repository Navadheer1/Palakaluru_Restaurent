"use client";

import * as React from "react";
import { AdminSidebar } from "@/components/layout/sidebars/AdminSidebar";
import { RoleTopbar } from "@/components/layout/headers/RoleTopbar";
import { useUiStore } from "@/stores/useUiStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

import { RestaurantProvider } from "@/lib/context/RestaurantContext";

export default function AdminLayout({
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
            staleTime: 1000 * 60,
            gcTime: 1000 * 60 * 10,
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RestaurantProvider>
        <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950">
          <AdminSidebar />
          <div
            className={cn(
              "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
            )}
          >
            <RoleTopbar role="admin" />
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </RestaurantProvider>
    </QueryClientProvider>
  );
}
