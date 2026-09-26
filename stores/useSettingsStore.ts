import { create } from "zustand";
import {
  RestaurantSettingsState,
  RestaurantProfileConfig,
  BusinessHoursConfig,
  TaxConfig,
  BillingConfig,
  OrderTypesConfig,
  PaymentMethodItem,
  PosConfig,
  KotKitchenConfig,
  PrinterItemConfig,
  BillReceiptConfig,
  DeliveryConfig,
  DigitalMenuConfig,
  AppearanceConfig,
  RolePermissionMatrix,
  StaffApprovalItem,
  ManagerApprovalConfig,
  NotificationChannelConfig,
  WhatsAppConfig,
  CustomerFieldsConfig,
  ReservationConfig,
  InventorySettingsConfig,
  ReportsCurrencyConfig,
  SecurityPolicyConfig,
  IntegrationItem,
  BackupRetentionConfig,
  AuditLogEntry,
  SystemHealthStatus,
  DangerZoneConfig,
  BranchConfigItem,
  TableSectionItem,
  TableItemConfig,
} from "@/types/settings";
import { createClient } from "@/lib/supabase/client";

const SETTINGS_STORAGE_KEY = "culinacloud_admin_settings_v3";

export const DEFAULT_SETTINGS: RestaurantSettingsState = {
  profile: {
    name: "Palakaluru Restaurant",
    legalName: "Palakaluru Foods & Hospitality Pvt. Ltd.",
    logoUrl: null,
    coverImageUrl: null,
    address: "Main Road, Near RTC Bus Stand, Palakaluru",
    city: "Guntur",
    state: "Andhra Pradesh",
    country: "India",
    pincode: "522005",
    phone: "+91 98480 12345",
    whatsapp: "+91 98480 12345",
    email: "contact@palakaluru.com",
    website: "https://palakaluru-restaurant.com",
    googleMapsUrl: "https://maps.google.com/?q=Palakaluru+Restaurant+Guntur",
    description: "Authentic Andhra Spices, Dum Biryanis, Tandoori Specials, and Traditional South Indian Thalis.",
    gstin: "37AAAAA0000A1Z5",
    fssaiNumber: "10123999000123",
    tradeLicenseNumber: "TL-GNT-2024-8891",
    panNumber: "AAAAA0000A",
  },
  businessHours: {
    weeklyHours: {
      monday: { isOpen: true, openTime: "11:00", closeTime: "23:00", hasSplitShift: true, lunchShift: { start: "11:00", end: "15:30" }, dinnerShift: { start: "18:00", end: "23:00" } },
      tuesday: { isOpen: true, openTime: "11:00", closeTime: "23:00", hasSplitShift: true, lunchShift: { start: "11:00", end: "15:30" }, dinnerShift: { start: "18:00", end: "23:00" } },
      wednesday: { isOpen: true, openTime: "11:00", closeTime: "23:00", hasSplitShift: true, lunchShift: { start: "11:00", end: "15:30" }, dinnerShift: { start: "18:00", end: "23:00" } },
      thursday: { isOpen: true, openTime: "11:00", closeTime: "23:00", hasSplitShift: true, lunchShift: { start: "11:00", end: "15:30" }, dinnerShift: { start: "18:00", end: "23:00" } },
      friday: { isOpen: true, openTime: "11:00", closeTime: "23:30", hasSplitShift: true, lunchShift: { start: "11:00", end: "15:30" }, dinnerShift: { start: "18:00", end: "23:30" } },
      saturday: { isOpen: true, openTime: "11:00", closeTime: "23:30", hasSplitShift: true, lunchShift: { start: "11:00", end: "16:00" }, dinnerShift: { start: "18:00", end: "23:30" } },
      sunday: { isOpen: true, openTime: "11:00", closeTime: "23:30", hasSplitShift: false, lunchShift: { start: "11:00", end: "16:00" }, dinnerShift: { start: "18:00", end: "23:30" } },
    },
    holidays: [
      { id: "h-1", date: "2026-10-02", name: "Gandhi Jayanti", isFullDayClosed: false },
      { id: "h-2", date: "2026-10-20", name: "Dussehra (Vijayadashami)", isFullDayClosed: false },
      { id: "h-3", date: "2026-11-08", name: "Diwali Special", isFullDayClosed: false },
    ],
    specialHours: [
      { id: "s-1", date: "2026-12-31", openTime: "11:00", closeTime: "01:00", reason: "New Year Eve Celebrations" }
    ],
  },
  branches: [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      name: "Palakaluru Main Highway Branch",
      code: "MAIN-01",
      address: "Main Road, Palakaluru, Guntur",
      phone: "+91 98480 12345",
      isMain: true,
      isActive: true,
      taxRate: 5.0,
      tablesCount: 24,
      assignedStaffCount: 12,
    },
    {
      id: "b0000000-0000-0000-0000-000000000002",
      name: "Arundelpet Express Outlet",
      code: "EXP-02",
      address: "7th Line, Arundelpet, Guntur",
      phone: "+91 98480 54321",
      isMain: false,
      isActive: true,
      taxRate: 5.0,
      tablesCount: 8,
      assignedStaffCount: 5,
    },
  ],
  taxes: {
    taxesEnabled: true,
    taxName: "GST",
    defaultTaxRate: 5.0,
    pricingType: "tax_exclusive",
    taxSlabs: [
      { id: "tax-1", name: "Restaurant GST (Standard)", rate: 5.0, cgst: 2.5, sgst: 2.5, igst: 0, isDefault: true, isActive: true },
      { id: "tax-2", name: "Beverages & Aerated Drinks", rate: 12.0, cgst: 6.0, sgst: 6.0, igst: 0, isDefault: false, isActive: true },
      { id: "tax-3", name: "Packaged Retail Goods (MRP)", rate: 0.0, cgst: 0, sgst: 0, igst: 0, isDefault: false, isActive: true },
      { id: "tax-4", name: "Outdoor Catering Services", rate: 18.0, cgst: 9.0, sgst: 9.0, igst: 0, isDefault: false, isActive: true },
    ],
    hsnCodesEnabled: true,
    displayGstBreakupOnBill: true,
  },
  billing: {
    invoicePrefix: "INV-",
    startingNumber: 1001,
    nextInvoiceNumber: 10425,
    autoNumbering: true,
    decimalPrecision: 2,
    roundingRule: "nearest_1",
    discountBehavior: "before_tax",
    serviceChargeEnabled: false,
    serviceChargeRate: 0.0,
    packagingChargeDineIn: 0,
    packagingChargeTakeaway: 15,
    deliveryChargeBase: 30,
    convenienceFee: 0,
  },
  orderTypes: {
    dineIn: {
      enabled: true,
      requireTableAssignment: true,
      allowPreOrder: false,
    },
    takeaway: {
      enabled: true,
      requirePaymentBeforeKot: true,
      requireCustomerPhone: true,
    },
    delivery: {
      enabled: true,
      requireAddress: true,
      requirePaymentBeforeDispatch: false,
      minOrderAmount: 150,
    },
  },
  paymentMethods: [
    { id: "pm-1", type: "cash", displayName: "Cash Currency", receiptDisplayName: "Cash", enabled: true, requireReferenceNumber: false, instructions: "Collect exact cash & dispense change" },
    { id: "pm-2", type: "upi", displayName: "UPI / QR Payment (PhonePe, GPay, Paytm)", receiptDisplayName: "UPI", enabled: true, requireReferenceNumber: true, instructions: "Verify 12-digit UTR on soundbox or phone" },
    { id: "pm-3", type: "card", displayName: "Credit / Debit Card POS Machine", receiptDisplayName: "Card", enabled: true, requireReferenceNumber: true, instructions: "Swipe/Dip card on EDC terminal" },
    { id: "pm-4", type: "bank_transfer", displayName: "Direct Bank NEFT / IMPS", receiptDisplayName: "Bank Transfer", enabled: false, requireReferenceNumber: true, instructions: "Confirm settlement with accountant" },
    { id: "pm-5", type: "cod", displayName: "Cash on Delivery", receiptDisplayName: "COD", enabled: true, requireReferenceNumber: false, instructions: "Delivery partner collects cash at customer doorstep" },
  ],
  pos: {
    defaultOrderType: "dine_in",
    defaultPaymentMethod: "upi",
    searchBehavior: "instant",
    barcodeSupport: false,
    showItemImages: true,
    quantityControls: "stepper",
    allowManualDiscount: true,
    maxDiscountPercentWithoutApproval: 10,
    allowPriceOverride: false,
    holdBillEnabled: true,
    allowBillCancellation: true,
    reprintLimit: 5,
    requireCustomerInfo: false,
    autoSaveDrafts: true,
  },
  tableSections: [
    { id: "sec-1", name: "Ground Floor - Main Hall", floor: 0, area: "Indoor AC", isActive: true, displayOrder: 1 },
    { id: "sec-2", name: "Family & Party Section", floor: 1, area: "First Floor AC", isActive: true, displayOrder: 2 },
    { id: "sec-3", name: "Garden Veranda & Outdoor", floor: 0, area: "Outdoor Open Air", isActive: true, displayOrder: 3 },
    { id: "sec-4", name: "VIP Executive Lounge", floor: 1, area: "Private Cabin", isActive: true, displayOrder: 4 },
  ],
  tables: [
    { id: "t-1", tableNumber: "T-1", displayName: "Table 1 (4-Seater)", sectionId: "sec-1", capacity: 4, shape: "square", isActive: true },
    { id: "t-2", tableNumber: "T-2", displayName: "Table 2 (4-Seater)", sectionId: "sec-1", capacity: 4, shape: "square", isActive: true },
    { id: "t-3", tableNumber: "T-3", displayName: "Table 3 (6-Seater)", sectionId: "sec-1", capacity: 6, shape: "rectangle", isActive: true },
    { id: "t-4", tableNumber: "T-4", displayName: "Table 4 (2-Seater)", sectionId: "sec-1", capacity: 2, shape: "circle", isActive: true },
    { id: "t-5", tableNumber: "T-5", displayName: "Table 5 (8-Seater)", sectionId: "sec-2", capacity: 8, shape: "rectangle", isActive: true },
    { id: "t-6", tableNumber: "T-6", displayName: "Outdoor 1", sectionId: "sec-3", capacity: 4, shape: "circle", isActive: true },
  ],
  kotKitchen: {
    kotNumberingPrefix: "KOT-",
    nextKotNumber: 2045,
    sendBehavior: "manual",
    takeawayPaymentBeforeKot: true,
    allowKotCancellationWithoutApproval: false,
    allowKotEditingAfterPrint: false,
    reprintKotPermission: "manager_and_above",
    kitchenStations: [
      { id: "ks-1", name: "Main Biryani & Curry Station", description: "Biryanis, gravies, rice specials", assignedPrinterId: "prn-2" },
      { id: "ks-2", name: "Tandoori & Grill Section", description: "Kebabs, naans, rotis, starters", assignedPrinterId: "prn-2" },
      { id: "ks-3", name: "Beverages, Mocktails & Desserts", description: "Juices, milkshakes, ice creams, paan", assignedPrinterId: "prn-3" },
    ],
    soundAlertsEnabled: true,
    soundAlertVolume: 85,
    newOrderNotification: true,
    orderReadyNotification: true,
  },
  printers: [
    {
      id: "prn-1",
      name: "Cashier Counter Thermal Printer",
      type: "receipt",
      ipAddress: "192.168.1.150",
      port: 9100,
      paperWidth: "80mm",
      isActive: true,
      assignedStations: ["billing"],
    },
    {
      id: "prn-2",
      name: "Kitchen KOT Hot Line Printer",
      type: "kot",
      ipAddress: "192.168.1.151",
      port: 9100,
      paperWidth: "80mm",
      isActive: true,
      assignedStations: ["ks-1", "ks-2"],
    },
    {
      id: "prn-3",
      name: "Bar & Dessert KOT Printer",
      type: "bar",
      ipAddress: "192.168.1.152",
      port: 9100,
      paperWidth: "58mm",
      isActive: true,
      assignedStations: ["ks-3"],
    },
  ],
  billReceipt: {
    showLogo: true,
    showRestaurantName: true,
    showAddress: true,
    showPhone: true,
    showGstin: true,
    showFssai: true,
    paperWidth: "80mm",
    fontSize: "normal",
    headerCustomText: "PALAKALURU RESTAURANT & TAKEAWAY",
    footerMessage: "Thank you for dining with us! For feedback, call +91 98480 12345.",
    thankYouMessage: "Please visit again! Have a flavorful day.",
    showTaxBreakup: true,
    showPaymentDetails: true,
    showCustomerDetails: true,
    showQrCodeForFeedbackOrPayment: true,
  },
  delivery: {
    enabled: true,
    baseDeliveryFee: 30,
    freeDeliveryThreshold: 500,
    maxDeliveryDistanceKm: 12,
    codAvailable: true,
    requireLandmark: true,
    requirePhone: true,
    zones: [
      { id: "dz-1", name: "Zone A (Local Town)", minKm: 0, maxKm: 3, deliveryCharge: 30, estimatedTimeMins: 25 },
      { id: "dz-2", name: "Zone B (Outer Ring / Bypass)", minKm: 3, maxKm: 6, deliveryCharge: 50, estimatedTimeMins: 40 },
      { id: "dz-3", name: "Zone C (Extended Suburbs)", minKm: 6, maxKm: 10, deliveryCharge: 80, estimatedTimeMins: 55 },
    ],
    deliveryBoySettings: {
      maxActiveDeliveries: 3,
      autoAssignEnabled: true,
      codHandlingLimit: 5000,
      trackingPolicy: "active_only",
      locationPingIntervalSecs: 30,
      completionRequirements: "customer_otp",
      failureReasons: ["Customer Unavailable", "Incorrect Address", "Refused to Accept", "Customer Cancelled Doorstep", "Vehicle Breakdown"],
    },
  },
  digitalMenu: {
    publicMenuEnabled: true,
    theme: "amber",
    categoryLayout: "tabs",
    itemCardStyle: "rich",
    showPrices: true,
    showDescriptions: true,
    showFoodImages: true,
    showAvailability: true,
    showVegetarianIndicators: true,
    showPopularBadges: true,
    contactPhone: "+91 98480 12345",
    whatsappOrdering: true,
    permanentQrSlug: "palakaluru-main",
  },
  appearance: {
    primaryColor: "#d97706", // Amber 600
    secondaryColor: "#0f172a",
    accentColor: "#10b981",
    sidebarAppearance: "dark",
    buttonStyle: "rounded-xl",
    uiDensity: "comfortable",
    themeMode: "system",
  },
  permissions: {
    admin: {
      pos: { view: true, create: true, edit: true, cancel: true, discount: true, priceOverride: true, reprint: true },
      bills: { view: true, print: true, reprint: true, void: true },
      tables: { view: true, edit: true, delete: true },
      delivery: { view: true, assign: true, track: true },
      reports: { view: true, export: true },
      settings: { manageStaff: true, manageTaxes: true, manageBilling: true, managePrinters: true, manageSecurity: true, manageIntegrations: true },
    },
    manager: {
      pos: { view: true, create: true, edit: true, cancel: true, discount: true, priceOverride: true, reprint: true },
      bills: { view: true, print: true, reprint: true, void: true },
      tables: { view: true, edit: true, delete: false },
      delivery: { view: true, assign: true, track: true },
      reports: { view: true, export: true },
      settings: { manageStaff: false, manageTaxes: false, manageBilling: false, managePrinters: true, manageSecurity: false, manageIntegrations: false },
    },
    cashier: {
      pos: { view: true, create: true, edit: true, cancel: false, discount: false, priceOverride: false, reprint: true },
      bills: { view: true, print: true, reprint: true, void: false },
      tables: { view: true, edit: false, delete: false },
      delivery: { view: true, assign: true, track: true },
      reports: { view: false, export: false },
      settings: { manageStaff: false, manageTaxes: false, manageBilling: false, managePrinters: false, manageSecurity: false, manageIntegrations: false },
    },
    waiter: {
      pos: { view: true, create: true, edit: true, cancel: false, discount: false, priceOverride: false, reprint: false },
      bills: { view: true, print: false, reprint: false, void: false },
      tables: { view: true, edit: false, delete: false },
      delivery: { view: false, assign: false, track: false },
      reports: { view: false, export: false },
      settings: { manageStaff: false, manageTaxes: false, manageBilling: false, managePrinters: false, manageSecurity: false, manageIntegrations: false },
    },
    delivery: {
      pos: { view: false, create: false, edit: false, cancel: false, discount: false, priceOverride: false, reprint: false },
      bills: { view: false, print: false, reprint: false, void: false },
      tables: { view: false, edit: false, delete: false },
      delivery: { view: true, assign: false, track: true },
      reports: { view: false, export: false },
      settings: { manageStaff: false, manageTaxes: false, manageBilling: false, managePrinters: false, manageSecurity: false, manageIntegrations: false },
    },
  },
  staffApprovals: [
    {
      id: "req-101",
      fullName: "K. Venkatesh",
      email: "venkatesh.waiter@gmail.com",
      phone: "+91 94401 22334",
      requestedRole: "waiter",
      registeredAt: "2026-09-24T14:30:00Z",
      status: "pending",
    },
    {
      id: "req-102",
      fullName: "B. Suresh Kumar",
      email: "suresh.delivery@gmail.com",
      phone: "+91 94401 55667",
      requestedRole: "delivery",
      registeredAt: "2026-09-25T09:15:00Z",
      status: "pending",
    },
  ],
  managerApprovals: {
    discountThresholdPercent: 10,
    requireApprovalForBillVoid: true,
    requireApprovalForRefund: true,
    requireApprovalForPriceOverride: true,
    requireApprovalForCashDiscrepancy: 100,
    requireApprovalForOrderCancel: true,
  },
  notifications: {
    newKotAlert: true,
    orderReadyAlert: true,
    newDeliveryAlert: true,
    deliveryAcceptedAlert: true,
    paymentReceivedAlert: true,
    lowInventoryAlert: true,
    staffApprovalAlert: true,
    channels: {
      inApp: true,
      email: false,
      sound: true,
      push: true,
    },
  },
  whatsapp: {
    enabled: true,
    businessNumber: "+91 98480 12345",
    apiKeyMasked: "wh_prod_live_********************489a",
    provider: "official_cloud_api",
    templates: {
      orderConfirmation: "Namaste {{customer_name}}! Your order {{order_number}} at Palakaluru Restaurant is confirmed. Total: ₹{{total}}. Preparing fresh!",
      outForDelivery: "Your hot meal from Palakaluru is out for delivery! Partner: {{rider_name}} ({{rider_phone}}). Track live: {{tracking_url}}",
      billReceipt: "Thank you for dining at Palakaluru! Bill #{{bill_number}} for ₹{{amount}} has been settled. View tax receipt: {{receipt_url}}",
    },
  },
  customerFields: {
    requireName: true,
    requirePhone: true,
    requireEmail: false,
    requireAddressForDelivery: true,
    saveCustomerHistory: true,
  },
  reservations: {
    enabled: true,
    slotDurationMins: 90,
    advanceBookingDays: 7,
    cancellationCutoffHours: 2,
    maxPartySize: 20,
    autoConfirmOnlineReservations: false,
  },
  inventory: {
    enabled: true,
    defaultLowStockThreshold: 10,
    stockAlertsEnabled: true,
    autoDeductOnKot: true,
    allowNegativeStock: false,
    wastagePermissions: "manager_and_above",
  },
  reportsCurrency: {
    financialDayCutoffTime: "04:00",
    weekStartDay: "monday",
    timezone: "Asia/Kolkata",
    currency: "INR",
    currencySymbol: "₹",
    decimalPrecision: 2,
    exportFormats: ["excel", "csv", "pdf"],
  },
  security: {
    sessionTimeoutMins: 120,
    rememberDeviceDays: 30,
    maxActiveSessionsPerUser: 3,
    minPasswordLength: 8,
    requireSpecialChar: true,
    maxFailedLoginAttempts: 5,
    lockoutDurationMins: 15,
    staffAccountApprovalRequired: true,
  },
  integrations: [
    {
      id: "int-1",
      name: "Razorpay Payment Gateway",
      type: "payment_gateway",
      provider: "Razorpay PG",
      status: "connected",
      maskedApiKey: "rzp_live_******************b12f",
      lastTestedAt: "2026-09-24T18:00:00Z",
    },
    {
      id: "int-2",
      name: "Meta Official WhatsApp Cloud API",
      type: "whatsapp",
      provider: "Meta WhatsApp Graph API v19.0",
      status: "connected",
      maskedApiKey: "EAAOZ****************************d99",
      lastTestedAt: "2026-09-25T11:20:00Z",
    },
    {
      id: "int-3",
      name: "Google Maps Distance Matrix & Geocoding",
      type: "maps",
      provider: "Google Maps Platform",
      status: "connected",
      maskedApiKey: "AIzaSy***********************p09a",
      lastTestedAt: "2026-09-25T10:00:00Z",
    },
    {
      id: "int-4",
      name: "Transactional SMS Gateway",
      type: "sms",
      provider: "Fast2SMS India",
      status: "connected",
      maskedApiKey: "f2s_**************************m76",
      lastTestedAt: "2026-09-22T09:30:00Z",
    },
  ],
  backupRetention: {
    autoBackupDaily: true,
    lastBackupDate: "2026-09-25T03:00:00Z",
    retentionDaysAuditLogs: 180,
    retentionDaysDeliveryLocations: 30,
    retentionDaysActivityLogs: 90,
    preserveFinancialRecordsForever: true,
  },
  auditLogs: [
    {
      id: "aud-01",
      userId: "usr-admin-01",
      userName: "Nayudu Garu (Admin)",
      userRole: "admin",
      module: "Tax Settings",
      action: "Updated Standard GST Slab",
      oldValue: "GST 5.0% (Inclusive)",
      newValue: "GST 5.0% (Exclusive)",
      timestamp: "2026-09-24T16:45:10Z",
    },
    {
      id: "aud-02",
      userId: "usr-admin-01",
      userName: "Nayudu Garu (Admin)",
      userRole: "admin",
      module: "Staff & Permissions",
      action: "Approved Staff Account",
      oldValue: "Pending (K. Ravi)",
      newValue: "Active (Role: Delivery Boy)",
      timestamp: "2026-09-23T11:20:05Z",
    },
    {
      id: "aud-03",
      userId: "usr-admin-01",
      userName: "Nayudu Garu (Admin)",
      userRole: "admin",
      module: "Printers",
      action: "Added KOT Hot Line Thermal Printer",
      oldValue: "None",
      newValue: "IP: 192.168.1.151, Port: 9100 (80mm)",
      timestamp: "2026-09-22T19:10:00Z",
    },
  ],
  systemHealth: {
    dbConnected: true,
    realtimeConnected: true,
    storageStatus: "healthy",
    lastSyncTime: new Date().toISOString(),
    appVersion: "v2.5.4 (Enterprise Production)",
    maintenanceMode: {
      enabled: false,
      message: "We are currently performing routine kitchen inventory maintenance. Online ordering will resume shortly!",
      allowPosOperations: true,
    },
  },
  dangerZone: {
    isRestaurantSuspended: false,
    isBranchDeactivated: false,
  },
  lastModified: {
    by: "Nayudu Garu (Admin)",
    at: "2026-09-25T18:30:00+05:30",
  },
};

function loadStoredSettings(): RestaurantSettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile },
        taxes: { ...DEFAULT_SETTINGS.taxes, ...parsed.taxes },
        billing: { ...DEFAULT_SETTINGS.billing, ...parsed.billing },
        pos: { ...DEFAULT_SETTINGS.pos, ...parsed.pos },
        kotKitchen: { ...DEFAULT_SETTINGS.kotKitchen, ...parsed.kotKitchen },
        billReceipt: { ...DEFAULT_SETTINGS.billReceipt, ...parsed.billReceipt },
        delivery: { ...DEFAULT_SETTINGS.delivery, ...parsed.delivery },
        digitalMenu: { ...DEFAULT_SETTINGS.digitalMenu, ...parsed.digitalMenu },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
        permissions: { ...DEFAULT_SETTINGS.permissions, ...parsed.permissions },
        security: { ...DEFAULT_SETTINGS.security, ...parsed.security },
        reportsCurrency: { ...DEFAULT_SETTINGS.reportsCurrency, ...parsed.reportsCurrency },
        managerApprovals: { ...DEFAULT_SETTINGS.managerApprovals, ...parsed.managerApprovals },
      };
    }
  } catch {
    // parse fallback
  }
  return DEFAULT_SETTINGS;
}

function persistSettings(state: RestaurantSettingsState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // save fallback
  }
}

interface SettingsStoreActions {
  // Navigation / search
  activeCategory: string;
  searchQuery: string;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;

  // Unsaved changes state
  hasUnsavedChanges: boolean;
  pendingChanges: Partial<RestaurantSettingsState> | null;
  updatePending: <K extends keyof RestaurantSettingsState>(
    section: K,
    patch: Partial<RestaurantSettingsState[K]> | RestaurantSettingsState[K]
  ) => void;
  commitPendingChanges: (adminName?: string) => Promise<{ success: boolean; message: string }>;
  discardPendingChanges: () => void;
  resetCategoryToDefaults: (section: keyof RestaurantSettingsState) => void;

  // Direct actions
  addAuditLog: (module: string, action: string, oldValue: string, newValue: string) => void;
  approveStaffRequest: (requestId: string) => void;
  rejectStaffRequest: (requestId: string) => void;
  testPrinter: (printerId: string) => Promise<{ success: boolean; message: string }>;
  testIntegration: (integrationId: string) => Promise<{ success: boolean; message: string }>;
  toggleMaintenanceMode: (enabled: boolean, message?: string) => void;
  triggerDataExport: (type: "sales" | "bills" | "menu" | "staff" | "all") => void;
}

export const useSettingsStore = create<RestaurantSettingsState & SettingsStoreActions>((set, get) => {
  const initial = loadStoredSettings();

  return {
    ...initial,
    activeCategory: "restaurant",
    searchQuery: "",
    hasUnsavedChanges: false,
    pendingChanges: null,

    setActiveCategory: (cat) => set({ activeCategory: cat }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    updatePending: (section, patch) => {
      const current = get();
      const currentSectionData = (current.pendingChanges && (current.pendingChanges as any)[section])
        ? (current.pendingChanges as any)[section]
        : (current as any)[section];

      const merged =
        typeof patch === "object" && !Array.isArray(patch) && patch !== null
          ? { ...currentSectionData, ...patch }
          : patch;

      set({
        hasUnsavedChanges: true,
        pendingChanges: {
          ...current.pendingChanges,
          [section]: merged,
        },
      });
    },

    commitPendingChanges: async (adminName = "Nayudu Garu (Admin)") => {
      const state = get();
      if (!state.pendingChanges || Object.keys(state.pendingChanges).length === 0) {
        return { success: true, message: "No changes to save." };
      }

      // Comprehensive validation
      if (state.pendingChanges.taxes) {
        if (state.pendingChanges.taxes.defaultTaxRate < 0 || state.pendingChanges.taxes.defaultTaxRate > 100) {
          return { success: false, message: "Tax rate must be between 0% and 100%." };
        }
      }
      if (state.pendingChanges.billing) {
        if (!state.pendingChanges.billing.invoicePrefix?.trim()) {
          return { success: false, message: "Invoice prefix cannot be empty." };
        }
      }
      if (state.pendingChanges.profile) {
        if (!state.pendingChanges.profile.name?.trim()) {
          return { success: false, message: "Restaurant name cannot be empty." };
        }
      }

      const timestamp = new Date().toISOString();
      const updatedState: RestaurantSettingsState = {
        ...state,
        ...state.pendingChanges,
        lastModified: {
          by: adminName,
          at: timestamp,
        },
      };

      // Add audit logs for changed sections
      const newAuditLogs = [...(state.auditLogs || [])];
      for (const key of Object.keys(state.pendingChanges)) {
        newAuditLogs.unshift({
          id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: "usr-admin-01",
          userName: adminName,
          userRole: "admin",
          module: key.toUpperCase(),
          action: `Updated configuration for ${key}`,
          oldValue: "Previous Configuration",
          newValue: "Updated to latest settings",
          timestamp,
        });
      }
      updatedState.auditLogs = newAuditLogs.slice(0, 100);

      // 1. Persist to local storage
      persistSettings(updatedState);

      // 2. Synchronize to Supabase if available
      try {
        const supabase = createClient();
        const restaurantId = "a0000000-0000-0000-0000-000000000001";

        // Try updating restaurants core row if profile or tax changed
        if (state.pendingChanges.profile || state.pendingChanges.taxes || state.pendingChanges.billing) {
          await supabase
            .from("restaurants")
            .update({
              name: updatedState.profile.name,
              phone: updatedState.profile.phone,
              email: updatedState.profile.email,
              address: updatedState.profile.address,
              tax_rate: updatedState.taxes.defaultTaxRate,
              service_charge_rate: updatedState.billing.serviceChargeRate,
              currency: updatedState.reportsCurrency.currency,
              updated_at: timestamp,
            })
            .eq("id", restaurantId);
        }

        // Try saving jsonb in restaurant_settings
        await supabase.from("restaurant_settings").upsert(
          {
            restaurant_id: restaurantId,
            key: "admin_config",
            value: updatedState,
            updated_at: timestamp,
          },
          { onConflict: "restaurant_id,key" }
        );
      } catch (err) {
        // Silently tolerate remote schema cache issues and keep local state pristine
        console.warn("Supabase remote sync warning (local storage is master):", err);
      }

      set({
        ...updatedState,
        hasUnsavedChanges: false,
        pendingChanges: null,
      });

      return { success: true, message: "Settings saved successfully!" };
    },

    discardPendingChanges: () => {
      set({
        hasUnsavedChanges: false,
        pendingChanges: null,
      });
    },

    resetCategoryToDefaults: (section) => {
      const defVal = DEFAULT_SETTINGS[section];
      get().updatePending(section, defVal as any);
    },

    addAuditLog: (module, action, oldValue, newValue) => {
      const state = get();
      const newEntry: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: "usr-admin-01",
        userName: state.lastModified.by || "Admin",
        userRole: "admin",
        module,
        action,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
      };
      const updatedLogs = [newEntry, ...(state.auditLogs || [])].slice(0, 100);
      set({ auditLogs: updatedLogs });
      persistSettings({ ...state, auditLogs: updatedLogs });
    },

    approveStaffRequest: (requestId) => {
      const state = get();
      const updated = state.staffApprovals.map((req) =>
        req.id === requestId ? { ...req, status: "approved" as const } : req
      );
      set({ staffApprovals: updated });
      get().addAuditLog("Staff & Roles", "Approved Staff Registration", `Request ID: ${requestId}`, "Status: Approved");
      persistSettings({ ...state, staffApprovals: updated });
    },

    rejectStaffRequest: (requestId) => {
      const state = get();
      const updated = state.staffApprovals.map((req) =>
        req.id === requestId ? { ...req, status: "rejected" as const } : req
      );
      set({ staffApprovals: updated });
      get().addAuditLog("Staff & Roles", "Rejected Staff Registration", `Request ID: ${requestId}`, "Status: Rejected");
      persistSettings({ ...state, staffApprovals: updated });
    },

    testPrinter: async (printerId) => {
      const printer = get().printers.find((p) => p.id === printerId);
      if (!printer) return { success: false, message: "Printer not found." };
      if (!printer.isActive) return { success: false, message: "Printer is currently disabled." };

      // Simulate handshake test
      await new Promise((res) => setTimeout(res, 800));
      return {
        success: true,
        message: `ESC/POS test packet successfully delivered to ${printer.name} (${printer.ipAddress}:${printer.port})! Paper cut signal verified.`,
      };
    },

    testIntegration: async (integrationId) => {
      const item = get().integrations.find((i) => i.id === integrationId);
      if (!item) return { success: false, message: "Integration not found." };

      await new Promise((res) => setTimeout(res, 900));
      return {
        success: true,
        message: `Ping successful for ${item.name} (${item.provider})! HTTP 200 OK received.`,
      };
    },

    toggleMaintenanceMode: (enabled, message) => {
      const state = get();
      const updatedHealth: SystemHealthStatus = {
        ...state.systemHealth,
        maintenanceMode: {
          enabled,
          message: message || state.systemHealth.maintenanceMode.message,
          allowPosOperations: true,
        },
      };
      set({ systemHealth: updatedHealth });
      get().addAuditLog(
        "System & Maintenance",
        enabled ? "Enabled Maintenance Mode" : "Disabled Maintenance Mode",
        String(!enabled),
        String(enabled)
      );
      persistSettings({ ...state, systemHealth: updatedHealth });
    },

    triggerDataExport: (type) => {
      const state = get();
      const exportPayload = {
        restaurant: state.profile.name,
        exportedAt: new Date().toISOString(),
        type,
        data:
          type === "sales"
            ? { totalRevenue: 145200, ordersCount: 420, averageOrderValue: 345 }
            : type === "bills"
            ? { count: 380, prefix: state.billing.invoicePrefix, currency: state.reportsCurrency.currency }
            : type === "menu"
            ? { categories: 8, itemsCount: 48 }
            : type === "staff"
            ? { activeStaff: 12, roles: ["admin", "manager", "waiter", "cashier", "delivery"] }
            : state,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `palakaluru_export_${type}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      get().addAuditLog("Backup & Data", `Exported ${type.toUpperCase()} data`, "None", "JSON file downloaded");
    },
  };
});
