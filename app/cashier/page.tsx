import React from "react";
import type { Metadata } from "next";
import { CashierDashboardView } from "@/components/cashier/CashierDashboardView";

export const metadata: Metadata = {
  title: "Cashier Home - Palakaluru RMS",
  description: "Cashier billing home screen and shift operations",
};

export const dynamic = "force-dynamic";

export default function CashierHomePage() {
  return <CashierDashboardView />;
}
