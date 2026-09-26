import React from "react";
import type { Metadata } from "next";
import { AdminDeliveryManagementView } from "@/components/delivery/AdminDeliveryManagementView";

export const metadata: Metadata = {
  title: "Delivery Live Tracking - Admin - Palakaluru RMS",
  description: "Production live fleet telemetry, map routing, and delivery tracking",
};

export const dynamic = "force-dynamic";

export default function AdminDeliveryPage() {
  return <AdminDeliveryManagementView />;
}
