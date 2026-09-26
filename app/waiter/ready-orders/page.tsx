"use client";

import { KotStatusView } from "@/components/kot/KotStatusView";

export default function WaiterReadyOrdersPage() {
  return <KotStatusView role="waiter" initialStatusFilter="ready" />;
}
