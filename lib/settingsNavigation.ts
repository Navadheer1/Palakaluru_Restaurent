import {
  Store,
  FileText,
  CreditCard,
  Grid,
  UtensilsCrossed,
  Flame,
  Users,
  Truck,
  QrCode,
  Printer,
  Bell,
  Palette,
  BarChart3,
  Plug,
  ShieldCheck,
  Database,
  History,
  Activity,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";

export interface SettingsCategoryDef {
  id: string;
  name: string;
  shortDesc: string;
  icon: LucideIcon;
  subsections: {
    id: string;
    name: string;
    description: string;
  }[];
  keywords: string[];
}

export const SETTINGS_CATEGORIES: SettingsCategoryDef[] = [
  {
    id: "restaurant",
    name: "Restaurant",
    shortDesc: "Manage restaurant information, branches and operating details",
    icon: Store,
    keywords: ["name", "logo", "fssai", "gstin", "address", "phone", "hours", "split shift", "branches", "profile"],
    subsections: [
      { id: "profile", name: "Profile", description: "Identity, FSSAI, GSTIN, contacts and address" },
      { id: "hours", name: "Business Hours", description: "Weekly operating hours, split shifts, and holidays" },
      { id: "branches", name: "Branches", description: "Multi-branch outlets, code and local settings" },
    ],
  },
  {
    id: "business_legal",
    name: "Business & Legal",
    shortDesc: "GST, tax, invoices and business information",
    icon: FileText,
    keywords: ["gst", "tax", "cgst", "sgst", "igst", "inclusive", "exclusive", "invoice prefix", "rounding", "currency"],
    subsections: [
      { id: "tax", name: "Tax Settings", description: "GST percentages, slabs, inclusive/exclusive pricing" },
      { id: "invoice", name: "Invoice & Billing", description: "Bill prefix, sequential numbering and round-off rules" },
      { id: "currency", name: "Currency & Dates", description: "INR, symbols, decimal precision and timezone" },
    ],
  },
  {
    id: "pos_billing",
    name: "POS & Billing",
    shortDesc: "Configure billing, payments and receipt behavior",
    icon: CreditCard,
    keywords: ["pos", "cashier", "order types", "dine-in", "takeaway", "delivery", "upi", "card", "cash", "discounts", "overrides"],
    subsections: [
      { id: "pos_core", name: "POS Behavior", description: "Default order type, cashier permissions, quick controls" },
      { id: "order_types", name: "Order Types", description: "Enable/disable Dine-In, Takeaway, and Delivery" },
      { id: "payments", name: "Payment Methods", description: "Cash, UPI QR, Card EDC and Bank transfer setup" },
      { id: "discounts", name: "Discounts & Approvals", description: "Manager approval limits and cashier discount rules" },
    ],
  },
  {
    id: "tables_floor",
    name: "Tables & Floor",
    shortDesc: "Manage tables, sections and floor layout",
    icon: Grid,
    keywords: ["tables", "floor", "section", "seating", "hall", "ac", "outdoor", "vip", "capacity"],
    subsections: [
      { id: "tables", name: "Tables Management", description: "Table numbers, capacities, shapes and active states" },
      { id: "sections", name: "Floor Sections", description: "Ground floor, 1st floor, outdoor garden, VIP hall" },
      { id: "statuses", name: "Table Statuses", description: "Available, Occupied, Reserved, Cleaning rules" },
    ],
  },
  {
    id: "menu",
    name: "Menu",
    shortDesc: "Manage menu behavior, categories and item settings",
    icon: UtensilsCrossed,
    keywords: ["menu", "categories", "items", "pricing", "veg", "non-veg", "availability", "prep time", "stock"],
    subsections: [
      { id: "catalog", name: "Categories & Items", description: "Item management, prices, descriptions and images" },
      { id: "availability", name: "Quick Availability", description: "Toggle in-stock / 86 out-of-stock without deleting" },
      { id: "behavior", name: "Menu Configuration", description: "Recommended tags, prep times, veg/non-veg flags" },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen & KOT",
    shortDesc: "Configure kitchen workflow and KOT behavior",
    icon: Flame,
    keywords: ["kot", "kitchen", "chef", "stations", "routing", "auto-send", "sound alert", "prep status"],
    subsections: [
      { id: "kot", name: "KOT Configuration", description: "KOT prefix, auto-send vs manual, reprint rules" },
      { id: "stations", name: "Kitchen Stations", description: "Biryani station, grill, tandoor, dessert & beverage" },
      { id: "alerts", name: "Kitchen Alerts", description: "Audio chime notifications and ready banners" },
    ],
  },
  {
    id: "staff_roles",
    name: "Staff & Roles",
    shortDesc: "Manage users, roles and permissions",
    icon: Users,
    keywords: ["staff", "users", "roles", "permissions", "manager", "waiter", "cashier", "delivery boy", "approvals"],
    subsections: [
      { id: "staff", name: "Staff Directory", description: "Active users, emails, contact details, assigned roles" },
      { id: "roles", name: "Role Matrix", description: "Admin, Manager, Waiter, Cashier, Delivery permissions" },
      { id: "approvals", name: "Pending Registrations", description: "Admin review workflow for newly registered accounts" },
    ],
  },
  {
    id: "delivery",
    name: "Delivery",
    shortDesc: "Configure delivery operations",
    icon: Truck,
    keywords: ["delivery", "zones", "charges", "distance", "km", "delivery boy", "tracking", "cod"],
    subsections: [
      { id: "delivery_ops", name: "Delivery Settings", description: "Base charges, free delivery threshold, COD rules" },
      { id: "zones", name: "Delivery Zones", description: "Zone A (0-3km), Zone B (3-6km), Zone C (6-10km)" },
      { id: "riders", name: "Delivery Boys", description: "Max active deliveries, auto-assign, GPS tracking policy" },
    ],
  },
  {
    id: "digital_menu",
    name: "Digital Menu",
    shortDesc: "Configure public QR menu",
    icon: QrCode,
    keywords: ["qr", "digital menu", "public menu", "theme", "mobile view", "scan", "whatsapp order"],
    subsections: [
      { id: "public_menu", name: "Public QR Menu", description: "Enable online viewing, banner, contact WhatsApp" },
      { id: "appearance", name: "Menu Styling", description: "Theme colors, card layout, veg badges, price display" },
      { id: "qr_code", name: "Permanent QR Code", description: "Permanent branch QR, download SVG/PNG and print flyer" },
    ],
  },
  {
    id: "printers",
    name: "Printers",
    shortDesc: "Manage receipt/KOT printers",
    icon: Printer,
    keywords: ["printer", "thermal", "80mm", "58mm", "ip", "port", "esc/pos", "routing", "test print"],
    subsections: [
      { id: "hardware", name: "Printer Manager", description: "Cashier, KOT, and Bar network thermal printers" },
      { id: "routing", name: "Category Routing", description: "Route Biryani to Kitchen, Drinks to Bar printer" },
    ],
  },
  {
    id: "bill_receipt",
    name: "Receipt & Bill Print",
    shortDesc: "Customize thermal bill layout and live preview",
    icon: FileText,
    keywords: ["receipt", "bill", "thermal print", "logo", "header", "footer", "tax breakup", "preview"],
    subsections: [
      { id: "layout", name: "Bill Customization", description: "Logo, header text, GSTIN, footer message" },
      { id: "preview", name: "Live Thermal Preview", description: "Real-time 80mm & 58mm thermal receipt rendering" },
    ],
  },
  {
    id: "notifications",
    name: "Notifications",
    shortDesc: "Configure alerts and notifications",
    icon: Bell,
    keywords: ["notifications", "whatsapp", "sms", "email", "sound", "alerts", "templates"],
    subsections: [
      { id: "alerts", name: "Operational Alerts", description: "New KOT, bill settlement, low inventory chimes" },
      { id: "whatsapp", name: "WhatsApp Templates", description: "Order confirmation, out-for-delivery, tax receipt" },
    ],
  },
  {
    id: "appearance",
    name: "Appearance",
    shortDesc: "Customize the restaurant interface",
    icon: Palette,
    keywords: ["theme", "branding", "colors", "dark mode", "accent", "density", "border radius"],
    subsections: [
      { id: "branding", name: "Branding & Palette", description: "Primary brand color, accents, buttons and radius" },
      { id: "theme", name: "Theme & Density", description: "Light / Dark mode, compact UI for POS touchscreens" },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    shortDesc: "Configure reporting behavior",
    icon: BarChart3,
    keywords: ["reports", "financial day", "cutoff", "04:00", "week start", "excel", "csv", "exports"],
    subsections: [
      { id: "financial_day", name: "Financial Day Cutoff", description: "Business day rollover hour (e.g. 04:00 AM)" },
      { id: "export_rules", name: "Export Defaults", description: "Allowed export formats, precision and weekly cycle" },
    ],
  },
  {
    id: "integrations",
    name: "Integrations",
    shortDesc: "External services and integrations",
    icon: Plug,
    keywords: ["integrations", "razorpay", "stripe", "maps", "whatsapp api", "sms", "zoho", "tally"],
    subsections: [
      { id: "connected", name: "Connected Services", description: "Payment gateway, Meta WhatsApp, Google Maps API" },
      { id: "keys", name: "API Credentials", description: "Secure credential management and connection tests" },
    ],
  },
  {
    id: "security",
    name: "Security",
    shortDesc: "Authentication, sessions and security controls",
    icon: ShieldCheck,
    keywords: ["security", "passwords", "lockout", "sessions", "timeout", "devices", "staff approval"],
    subsections: [
      { id: "session", name: "Session & Devices", description: "Auto-logout timeout and concurrent device limits" },
      { id: "passwords", name: "Authentication Policies", description: "Password complexity, failed attempt lockout" },
    ],
  },
  {
    id: "backup_data",
    name: "Backup & Data",
    shortDesc: "Data management and exports",
    icon: Database,
    keywords: ["backup", "export", "retention", "sales dump", "menu json", "financial protection"],
    subsections: [
      { id: "exports", name: "Data Exports", description: "Export sales, bills, customer list, and menu items" },
      { id: "retention", name: "Retention Policies", description: "Audit logs retention while keeping financial ledgers safe" },
    ],
  },
  {
    id: "audit_logs",
    name: "Audit Logs",
    shortDesc: "Track configuration changes and admin actions",
    icon: History,
    keywords: ["audit", "logs", "history", "who changed", "timestamp", "diff", "action"],
    subsections: [
      { id: "trail", name: "Audit Trail", description: "User, timestamp, module, old value, and new value logs" },
    ],
  },
  {
    id: "system",
    name: "System & Health",
    shortDesc: "Advanced system configuration and maintenance",
    icon: Activity,
    keywords: ["system", "health", "database", "realtime", "maintenance mode", "version"],
    subsections: [
      { id: "health", name: "System Health", description: "Supabase connection, Realtime websocket, storage status" },
      { id: "maintenance", name: "Maintenance Mode", description: "Graceful public maintenance banner without halting POS" },
    ],
  },
  {
    id: "danger_zone",
    name: "Danger Zone",
    shortDesc: "Critical restaurant suspension and reset actions",
    icon: AlertTriangle,
    keywords: ["danger", "suspend", "reset", "deactivate", "archive", "destructive"],
    subsections: [
      { id: "critical", name: "Destructive Controls", description: "Deactivate branch, reset settings with typing verification" },
    ],
  },
];

export interface SearchResultItem {
  categoryId: string;
  categoryName: string;
  subsectionId: string;
  subsectionName: string;
  matchedOn: string;
}

export function searchSettings(query: string): SearchResultItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const results: SearchResultItem[] = [];

  for (const cat of SETTINGS_CATEGORIES) {
    let catMatched = false;
    if (cat.name.toLowerCase().includes(clean) || cat.shortDesc.toLowerCase().includes(clean)) {
      catMatched = true;
    }
    if (cat.keywords.some((k) => k.toLowerCase().includes(clean))) {
      catMatched = true;
    }

    for (const sub of cat.subsections) {
      if (
        catMatched ||
        sub.name.toLowerCase().includes(clean) ||
        sub.description.toLowerCase().includes(clean)
      ) {
        results.push({
          categoryId: cat.id,
          categoryName: cat.name,
          subsectionId: sub.id,
          subsectionName: sub.name,
          matchedOn: sub.name,
        });
      }
    }
  }

  return results.slice(0, 12);
}
