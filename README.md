# CulinaCloud RMS — Palakaluru Restaurant Management System

An enterprise-grade, modern restaurant operations web platform engineered for high-density, high-speed POS billing, visual floor & table seating, Kitchen Display System (KDS) order routing, multi-branch inventory tracking, customer CRM, staff role-based access control, and financial reporting.

---

## 1. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript 5 (Strict type-checking)
- **Styling & UI**: Tailwind CSS, Lucide Icons, Custom accessible UI primitives
- **Database & Auth**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Client & Remote State**: TanStack React Query v5 & Zustand (POS Cart & UI Stores)
- **Analytics & Visualizations**: Recharts Area & Pie visualizations
- **Realtime**: Supabase Realtime WebSocket subscriptions for KOT and table status

---

## 2. Directory Structure

```
Palakaluru_Restaurent/
|-- .env.example
|-- .env.local
|-- .gitignore
|-- package.json
|-- tsconfig.json
|-- tailwind.config.ts
|-- postcss.config.js
|-- README.md
|-- app/
|   |-- (auth)/
|   |   |-- layout.tsx
|   |   |-- login/page.tsx
|   |-- (dashboard)/
|   |   |-- layout.tsx
|   |   |-- page.tsx            (Admin / Operations Hub)
|   |   |-- pos/page.tsx        (Fast POS Terminal & Cart)
|   |   |-- orders/page.tsx     (Orders & Ticket lifecycle)
|   |   |-- tables/page.tsx     (Floor Plan & Seating)
|   |   |-- kitchen/page.tsx    (Kitchen Display System KDS)
|   |   |-- delivery/page.tsx   (Delivery dispatch & riders)
|   |   |-- menu/page.tsx       (Menu catalog, variants, addons)
|   |   |-- inventory/page.tsx  (Stock ledger & low-stock alerts)
|   |   |-- purchases/page.tsx  (Purchase orders & vendor restocking)
|   |   |-- suppliers/page.tsx  (Supplier directory & GSTIN)
|   |   |-- customers/page.tsx  (Customer CRM & loyalty history)
|   |   |-- staff/page.tsx      (Staff accounts & RBAC)
|   |   |-- expenses/page.tsx   (Overhead expense tracking)
|   |   |-- reports/page.tsx    (Sales velocity & analytics)
|   |   |-- settings/page.tsx   (Restaurant & branch settings)
|   |-- globals.css
|   |-- layout.tsx
|-- components/
|   |-- ui/                     (Button, Card, Badge, Input, Dialog, Tabs, Skeleton)
|   |-- layout/                 (Sidebar, Topbar, Breadcrumbs, NotificationMenu, UserDropdown)
|   |-- dashboard/              (MetricCard, SalesChart, LiveTableStatusWidget, RecentOrdersWidget, LowStockWidget)
|-- lib/
|   |-- supabase/
|   |   |-- client.ts           (Browser client)
|   |   |-- server.ts           (Server client with cookie handling)
|   |   |-- admin.ts            (Service role client)
|   |-- utils.ts                (cn, formatCurrency, formatDate)
|   |-- constants.ts            (Roles, order types, statuses)
|-- stores/
|   |-- usePosStore.ts          (Cart, variants, discounts, taxes, service charges)
|   |-- useUiStore.ts           (Sidebar toggle, active branch)
|-- types/
|   |-- database.ts             (Full PostgreSQL entities typings)
|-- supabase/
|   |-- migrations/
|       |-- 001_initial_schema.sql (30 normalized tables, foreign keys, indexes)
|       |-- 002_rls_policies.sql   (Multi-tenant RLS, isolation helper functions, signup trigger)
|       |-- 003_seed_data.sql      (Sample restaurant, branches, tables, menu, inventory)
```

---

## 3. Database Schema & RLS Architecture

The database is designed with normalized tables:
- `restaurants`, `branches`, `profiles`
- `roles`, `permissions`, `role_permissions`
- `table_sections`, `restaurant_tables`
- `menu_categories`, `menu_items`, `menu_variants`, `menu_addons`, `menu_item_addons`
- `customers`, `customer_addresses`
- `orders`, `order_items`, `order_item_modifiers`
- `kot`, `kot_items`
- `payments`, `delivery_orders`
- `inventory_items`, `inventory_movements`, `recipes`, `recipe_items`
- `suppliers`, `purchase_orders`, `purchase_order_items`
- `expenses`, `notifications`, `restaurant_settings`

### Multi-Tenant Isolation
All tables are linked directly or indirectly to `restaurant_id`.
RLS policies invoke `get_user_restaurant_id()` to enforce that users can only view and manipulate records belonging to their restaurant.

---

## 4. Role-Based Access Control (RBAC)

1. **Admin**: Complete system control (settings, financial reports, staff privileges).
2. **Manager**: Floor supervision, inventory management, purchase orders, menu adjustments, expense records.
3. **Waiter**: Table occupancy management, quick order creation, KOT dispatch, bill requests.
4. **Kitchen**: High-contrast Kitchen Display System (KDS), line preparation, KOT status advancement.
5. **Delivery**: Doorstep delivery dispatch, order status tracking, customer delivery address details.

---

## 5. Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Verify your `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://reiivaotuxiksairoizk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
