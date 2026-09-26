"use client";

import * as React from "react";
import {
  Search,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Shield,
  Menu as MenuIcon,
  X,
  ChevronRight,
} from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { SETTINGS_CATEGORIES, searchSettings, SearchResultItem } from "@/lib/settingsNavigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

// Modular Sections
import { RestaurantProfileSection } from "./sections/RestaurantProfileSection";
import { BusinessLegalSection } from "./sections/BusinessLegalSection";
import { PosBillingSection } from "./sections/PosBillingSection";
import { TableFloorSection } from "./sections/TableFloorSection";
import { MenuSettingsSection } from "./sections/MenuSettingsSection";
import { KotKitchenSection } from "./sections/KotKitchenSection";
import { PrintersSection } from "./sections/PrintersSection";
import { BillReceiptSection } from "./sections/BillReceiptSection";
import { DeliverySection } from "./sections/DeliverySection";
import { DigitalMenuSection } from "./sections/DigitalMenuSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { StaffRolesSection } from "./sections/StaffRolesSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { CustomerReservationInventorySection } from "./sections/CustomerReservationInventorySection";
import { ReportsCurrencySection } from "./sections/ReportsCurrencySection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { SecurityBackupSection } from "./sections/SecurityBackupSection";
import { AuditLogsSection } from "./sections/AuditLogsSection";
import { SystemHealthSection } from "./sections/SystemHealthSection";
import { DangerZoneSection } from "./sections/DangerZoneSection";

export function SettingsCenter() {
  const {
    activeCategory,
    setActiveCategory,
    hasUnsavedChanges,
    commitPendingChanges,
    discardPendingChanges,
    lastModified,
  } = useSettingsStore();

  const [searchQuery, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [unsavedNavModal, setUnsavedNavModal] = React.useState<{ targetCategory: string } | null>(null);

  // Search input handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSearchResults(searchSettings(val));
  };

  const handleSelectSearchResult = (result: SearchResultItem) => {
    if (hasUnsavedChanges && activeCategory !== result.categoryId) {
      setUnsavedNavModal({ targetCategory: result.categoryId });
    } else {
      setActiveCategory(result.categoryId);
    }
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Safe category navigation
  const handleCategoryClick = (catId: string) => {
    if (catId === activeCategory) return;
    if (hasUnsavedChanges) {
      setUnsavedNavModal({ targetCategory: catId });
    } else {
      setActiveCategory(catId);
      setMobileMenuOpen(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await commitPendingChanges("Nayudu Garu (Admin)");
    setIsSaving(false);
    if (res.success) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      alert(`Error saving settings: ${res.message}`);
    }
  };

  const currentCategoryDef = SETTINGS_CATEGORIES.find((c) => c.id === activeCategory) || SETTINGS_CATEGORIES[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-24">
      {/* Top Header & Global Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Settings & Configuration Center
                </span>
                <Badge variant="brand" size="sm" className="hidden sm:inline-flex">
                  Enterprise Production
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Central operating system configuration for taxes, printers, delivery, KOT, and permissions.
              </p>
            </div>

            {/* Mobile Category Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>

          {/* Global Search Input */}
          <div className="relative w-full md:w-80 lg:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search settings (e.g. GST, Printer, Table, Delivery, QR)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              className="pl-10 h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white"
            />

            {/* Search Autocomplete Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Quick Navigation Results ({searchResults.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((res, i) => (
                    <button
                      key={`${res.categoryId}-${res.subsectionId}-${i}`}
                      type="button"
                      onMouseDown={() => handleSelectSearchResult(res)}
                      className="w-full text-left p-3 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {res.subsectionName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {res.categoryName} → {res.matchedOn}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Versioning Line */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Last saved by: </span>
            <strong className="text-slate-700 dark:text-slate-300">{lastModified.by}</strong>
            <span>({new Date(lastModified.at).toLocaleString()})</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Zero-Downtime Hot Reload</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Navigation: Categories Sidebar (Desktop) or Drawer (Mobile) */}
        <div
          className={`md:col-span-4 lg:col-span-3 space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs ${
            mobileMenuOpen ? "block" : "hidden md:block"
          }`}
        >
          <div className="px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Configuration Modules
          </div>

          <div className="space-y-0.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {SETTINGS_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const isDanger = cat.id === "danger_zone";

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-start space-x-3 cursor-pointer ${
                    isActive
                      ? isDanger
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                        : "bg-brand-50/70 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 shadow-2xs"
                      : isDanger
                      ? "text-rose-600 hover:bg-rose-50/50"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "text-brand-600 dark:text-brand-400" : isDanger ? "text-rose-500" : "text-slate-400"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{cat.name}</span>
                    <span className="block text-[10px] font-normal text-slate-400 truncate">
                      {cat.shortDesc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area: Active Section */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Active Section Header Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/60">
                <currentCategoryDef.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currentCategoryDef.name} Settings
                </h2>
                <p className="text-xs text-slate-500">
                  {currentCategoryDef.shortDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="neutral" size="sm">
                Live Supabase Sync
              </Badge>
            </div>
          </div>

          {/* Active Section Component Switcher */}
          {activeCategory === "restaurant" && <RestaurantProfileSection />}
          {activeCategory === "business_legal" && <BusinessLegalSection />}
          {activeCategory === "pos_billing" && <PosBillingSection />}
          {activeCategory === "tables_floor" && <TableFloorSection />}
          {activeCategory === "menu" && <MenuSettingsSection />}
          {activeCategory === "kitchen" && <KotKitchenSection />}
          {activeCategory === "printers" && <PrintersSection />}
          {activeCategory === "bill_receipt" && <BillReceiptSection />}
          {activeCategory === "delivery" && <DeliverySection />}
          {activeCategory === "digital_menu" && <DigitalMenuSection />}
          {activeCategory === "appearance" && <AppearanceSection />}
          {activeCategory === "staff_roles" && <StaffRolesSection />}
          {activeCategory === "notifications" && <NotificationsSection />}
          {activeCategory === "reports" && <ReportsCurrencySection />}
          {activeCategory === "integrations" && <IntegrationsSection />}
          {activeCategory === "security" && <SecurityBackupSection />}
          {activeCategory === "backup_data" && <SecurityBackupSection />}
          {activeCategory === "audit_logs" && <AuditLogsSection />}
          {activeCategory === "system" && <SystemHealthSection />}
          {activeCategory === "danger_zone" && <DangerZoneSection />}
        </div>
      </div>

      {/* Sticky Bottom Bar for Unsaved Changes (Prompt Point 45) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 md:right-8 z-40 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold">
              You have unsaved changes in your settings.
            </span>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={discardPendingChanges}
              disabled={isSaving}
              className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="text-xs font-bold space-x-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom duration-150">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unsaved Changes Navigation Guard Modal */}
      <Dialog open={!!unsavedNavModal} onOpenChange={() => setUnsavedNavModal(null)}>
        {unsavedNavModal && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <DialogTitle>Unsaved Changes Detected</DialogTitle>
              </div>
              <DialogDescription>
                You have unsaved configuration adjustments. If you navigate to another category without saving, your pending modifications will be discarded.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  discardPendingChanges();
                  setActiveCategory(unsavedNavModal.targetCategory);
                  setUnsavedNavModal(null);
                }}
              >
                Discard & Navigate
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await handleSave();
                  setActiveCategory(unsavedNavModal.targetCategory);
                  setUnsavedNavModal(null);
                }}
              >
                Save & Continue
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
