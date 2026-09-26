import React from "react";
import type { Metadata } from "next";
import { CashierDashboardView } from "@/components/cashier/CashierDashboardView";

export const metadata: Metadata = {
  title: "Cashier Dashboard - Palakaluru RMS",
  description: "Cashier billing home screen and shift operations",
};

export const dynamic = "force-dynamic";

export default function CashierDashboardPage() {
  return <CashierDashboardView />;
}
