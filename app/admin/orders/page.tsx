import { OrdersView } from "@/components/orders/OrdersView";

export const metadata = {
  title: "Orders & Live Operations - Admin - Palakaluru RMS",
};

export default function AdminOrdersPage() {
  return <OrdersView role="admin" />;
}
