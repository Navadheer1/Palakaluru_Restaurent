export interface RestaurantProfileConfig {
  name: string;
  legalName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  googleMapsUrl: string;
  description: string;
  gstin: string;
  fssaiNumber: string;
  tradeLicenseNumber: string;
  panNumber: string;
}

export interface DayHours {
  isOpen: boolean;
  openTime: string; // "11:00"
  closeTime: string; // "23:00"
  hasSplitShift: boolean;
  lunchShift?: { start: string; end: string };
  dinnerShift?: { start: string; end: string };
}

export interface HolidayEntry {
  id: string;
  date: string;
  name: string;
  isFullDayClosed: boolean;
}

export interface SpecialHoursEntry {
  id: string;
  date: string;
  openTime: string;
  closeTime: string;
  reason: string;
}

export interface BusinessHoursConfig {
  weeklyHours: Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", DayHours>;
  holidays: HolidayEntry[];
  specialHours: SpecialHoursEntry[];
}

export interface BranchConfigItem {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
  isActive: boolean;
  taxRate: number;
  tablesCount: number;
  assignedStaffCount: number;
}

export interface TaxSlab {
  id: string;
  name: string;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface TaxConfig {
  taxesEnabled: boolean;
  taxName: string;
  defaultTaxRate: number;
  pricingType: "tax_inclusive" | "tax_exclusive";
  taxSlabs: TaxSlab[];
  hsnCodesEnabled: boolean;
  displayGstBreakupOnBill: boolean;
}

export interface BillingConfig {
  invoicePrefix: string;
  startingNumber: number;
  nextInvoiceNumber: number;
  autoNumbering: boolean;
  decimalPrecision: number;
  roundingRule: "none" | "nearest_1" | "nearest_5" | "round_up";
  discountBehavior: "before_tax" | "after_tax";
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  packagingChargeDineIn: number;
  packagingChargeTakeaway: number;
  deliveryChargeBase: number;
  convenienceFee: number;
}

export interface OrderTypesConfig {
  dineIn: {
    enabled: boolean;
    requireTableAssignment: boolean;
    allowPreOrder: boolean;
  };
  takeaway: {
    enabled: boolean;
    requirePaymentBeforeKot: boolean;
    requireCustomerPhone: boolean;
  };
  delivery: {
    enabled: boolean;
    requireAddress: boolean;
    requirePaymentBeforeDispatch: boolean;
    minOrderAmount: number;
  };
}

export interface PaymentMethodItem {
  id: string;
  type: "cash" | "upi" | "card" | "bank_transfer" | "wallet" | "cod";
  displayName: string;
  receiptDisplayName: string;
  enabled: boolean;
  requireReferenceNumber: boolean;
  instructions: string;
}

export interface PosConfig {
  defaultOrderType: "dine_in" | "takeaway" | "delivery";
  defaultPaymentMethod: "cash" | "upi" | "card";
  searchBehavior: "instant" | "debounce";
  barcodeSupport: boolean;
  showItemImages: boolean;
  quantityControls: "stepper" | "numpad";
  allowManualDiscount: boolean;
  maxDiscountPercentWithoutApproval: number;
  allowPriceOverride: boolean;
  holdBillEnabled: boolean;
  allowBillCancellation: boolean;
  reprintLimit: number;
  requireCustomerInfo: boolean;
  autoSaveDrafts: boolean;
}

export interface TableSectionItem {
  id: string;
  name: string;
  floor: number;
  area: string;
  isActive: boolean;
  displayOrder: number;
}

export interface TableItemConfig {
  id: string;
  tableNumber: string;
  displayName: string;
  sectionId: string;
  capacity: number;
  shape: "square" | "circle" | "rectangle";
  isActive: boolean;
}

export interface KotKitchenConfig {
  kotNumberingPrefix: string;
  nextKotNumber: number;
  sendBehavior: "manual" | "automatic";
  takeawayPaymentBeforeKot: boolean;
  allowKotCancellationWithoutApproval: boolean;
  allowKotEditingAfterPrint: boolean;
  reprintKotPermission: "admin_only" | "manager_and_above" | "all_staff";
  kitchenStations: {
    id: string;
    name: string;
    description: string;
    assignedPrinterId: string | null;
  }[];
  soundAlertsEnabled: boolean;
  soundAlertVolume: number; // 0 to 100
  newOrderNotification: boolean;
  orderReadyNotification: boolean;
}

export interface PrinterItemConfig {
  id: string;
  name: string;
  type: "receipt" | "kot" | "kitchen" | "bar";
  ipAddress: string;
  port: number;
  paperWidth: "80mm" | "58mm";
  isActive: boolean;
  assignedStations: string[];
}

export interface BillReceiptConfig {
  showLogo: boolean;
  showRestaurantName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showGstin: boolean;
  showFssai: boolean;
  paperWidth: "80mm" | "58mm";
  fontSize: "compact" | "normal" | "large";
  headerCustomText: string;
  footerMessage: string;
  thankYouMessage: string;
  showTaxBreakup: boolean;
  showPaymentDetails: boolean;
  showCustomerDetails: boolean;
  showQrCodeForFeedbackOrPayment: boolean;
}

export interface DeliveryZoneItem {
  id: string;
  name: string;
  minKm: number;
  maxKm: number;
  deliveryCharge: number;
  estimatedTimeMins: number;
}

export interface DeliveryConfig {
  enabled: boolean;
  baseDeliveryFee: number;
  freeDeliveryThreshold: number;
  maxDeliveryDistanceKm: number;
  codAvailable: boolean;
  requireLandmark: boolean;
  requirePhone: boolean;
  zones: DeliveryZoneItem[];
  deliveryBoySettings: {
    maxActiveDeliveries: number;
    autoAssignEnabled: boolean;
    codHandlingLimit: number;
    trackingPolicy: "active_only" | "interval";
    locationPingIntervalSecs: number;
    completionRequirements: "none" | "customer_otp" | "signature";
    failureReasons: string[];
  };
}

export interface DigitalMenuConfig {
  publicMenuEnabled: boolean;
  theme: "amber" | "emerald" | "slate" | "crimson";
  categoryLayout: "tabs" | "sidebar" | "grid";
  itemCardStyle: "rich" | "compact" | "minimal";
  showPrices: boolean;
  showDescriptions: boolean;
  showFoodImages: boolean;
  showAvailability: boolean;
  showVegetarianIndicators: boolean;
  showPopularBadges: boolean;
  contactPhone: string;
  whatsappOrdering: boolean;
  permanentQrSlug: string;
}

export interface AppearanceConfig {
  primaryColor: string; // hex
  secondaryColor: string;
  accentColor: string;
  sidebarAppearance: "dark" | "light" | "colored";
  buttonStyle: "rounded-lg" | "rounded-xl" | "rounded-full" | "square";
  uiDensity: "comfortable" | "compact";
  themeMode: "light" | "dark" | "system";
}

export interface RolePermissionMatrix {
  [role: string]: {
    pos: {
      view: boolean;
      create: boolean;
      edit: boolean;
      cancel: boolean;
      discount: boolean;
      priceOverride: boolean;
      reprint: boolean;
    };
    bills: {
      view: boolean;
      print: boolean;
      reprint: boolean;
      void: boolean;
    };
    tables: {
      view: boolean;
      edit: boolean;
      delete: boolean;
    };
    delivery: {
      view: boolean;
      assign: boolean;
      track: boolean;
    };
    reports: {
      view: boolean;
      export: boolean;
    };
    settings: {
      manageStaff: boolean;
      manageTaxes: boolean;
      manageBilling: boolean;
      managePrinters: boolean;
      manageSecurity: boolean;
      manageIntegrations: boolean;
    };
  };
}

export interface StaffApprovalItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  requestedRole: string;
  registeredAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface ManagerApprovalConfig {
  discountThresholdPercent: number; // e.g. 10%
  requireApprovalForBillVoid: boolean;
  requireApprovalForRefund: boolean;
  requireApprovalForPriceOverride: boolean;
  requireApprovalForCashDiscrepancy: number; // ₹100
  requireApprovalForOrderCancel: boolean;
}

export interface NotificationChannelConfig {
  newKotAlert: boolean;
  orderReadyAlert: boolean;
  newDeliveryAlert: boolean;
  deliveryAcceptedAlert: boolean;
  paymentReceivedAlert: boolean;
  lowInventoryAlert: boolean;
  staffApprovalAlert: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    sound: boolean;
    push: boolean;
  };
}

export interface WhatsAppConfig {
  enabled: boolean;
  businessNumber: string;
  apiKeyMasked: string;
  provider: "official_cloud_api" | "sandbox";
  templates: {
    orderConfirmation: string;
    outForDelivery: string;
    billReceipt: string;
  };
}

export interface CustomerFieldsConfig {
  requireName: boolean;
  requirePhone: boolean;
  requireEmail: boolean;
  requireAddressForDelivery: boolean;
  saveCustomerHistory: boolean;
}

export interface ReservationConfig {
  enabled: boolean;
  slotDurationMins: number;
  advanceBookingDays: number;
  cancellationCutoffHours: number;
  maxPartySize: number;
  autoConfirmOnlineReservations: boolean;
}

export interface InventorySettingsConfig {
  enabled: boolean;
  defaultLowStockThreshold: number;
  stockAlertsEnabled: boolean;
  autoDeductOnKot: boolean;
  allowNegativeStock: boolean;
  wastagePermissions: "admin_only" | "manager_and_above";
}

export interface ReportsCurrencyConfig {
  financialDayCutoffTime: string; // "04:00"
  weekStartDay: "monday" | "sunday";
  timezone: string; // "Asia/Kolkata"
  currency: string; // "INR"
  currencySymbol: string; // "₹"
  decimalPrecision: number;
  exportFormats: ("excel" | "csv" | "pdf")[];
}

export interface SecurityPolicyConfig {
  sessionTimeoutMins: number;
  rememberDeviceDays: number;
  maxActiveSessionsPerUser: number;
  minPasswordLength: number;
  requireSpecialChar: boolean;
  maxFailedLoginAttempts: number;
  lockoutDurationMins: number;
  staffAccountApprovalRequired: boolean;
}

export interface IntegrationItem {
  id: string;
  name: string;
  type: "payment_gateway" | "whatsapp" | "email" | "sms" | "maps" | "accounting";
  provider: string;
  status: "connected" | "disconnected" | "error";
  maskedApiKey: string;
  lastTestedAt: string | null;
}

export interface BackupRetentionConfig {
  autoBackupDaily: boolean;
  lastBackupDate: string;
  retentionDaysAuditLogs: number;
  retentionDaysDeliveryLocations: number;
  retentionDaysActivityLogs: number;
  preserveFinancialRecordsForever: boolean;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface SystemHealthStatus {
  dbConnected: boolean;
  realtimeConnected: boolean;
  storageStatus: "healthy" | "warning" | "error";
  lastSyncTime: string;
  appVersion: string;
  maintenanceMode: {
    enabled: boolean;
    message: string;
    allowPosOperations: boolean;
  };
}

export interface DangerZoneConfig {
  isRestaurantSuspended: boolean;
  isBranchDeactivated: boolean;
}

export interface RestaurantSettingsState {
  profile: RestaurantProfileConfig;
  businessHours: BusinessHoursConfig;
  branches: BranchConfigItem[];
  taxes: TaxConfig;
  billing: BillingConfig;
  orderTypes: OrderTypesConfig;
  paymentMethods: PaymentMethodItem[];
  pos: PosConfig;
  tables: TableItemConfig[];
  tableSections: TableSectionItem[];
  kotKitchen: KotKitchenConfig;
  printers: PrinterItemConfig[];
  billReceipt: BillReceiptConfig;
  delivery: DeliveryConfig;
  digitalMenu: DigitalMenuConfig;
  appearance: AppearanceConfig;
  permissions: RolePermissionMatrix;
  staffApprovals: StaffApprovalItem[];
  managerApprovals: ManagerApprovalConfig;
  notifications: NotificationChannelConfig;
  whatsapp: WhatsAppConfig;
  customerFields: CustomerFieldsConfig;
  reservations: ReservationConfig;
  inventory: InventorySettingsConfig;
  reportsCurrency: ReportsCurrencyConfig;
  security: SecurityPolicyConfig;
  integrations: IntegrationItem[];
  backupRetention: BackupRetentionConfig;
  auditLogs: AuditLogEntry[];
  systemHealth: SystemHealthStatus;
  dangerZone: DangerZoneConfig;
  lastModified: {
    by: string;
    at: string;
  };
}
