"use client";

import * as React from "react";
import {
  Grid,
  Plus,
  Users,
  Utensils,
  CheckCircle2,
  Clock,
  CreditCard,
  ChefHat,
  Filter,
  BellRing,
  AlertTriangle,
  Edit2,
  Trash2,
  Power,
  Table as TableIcon,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Building2,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn, formatCurrency } from "@/lib/utils";
import { TableStatus, UserRole } from "@/lib/constants";
import { useRestaurantContext } from "@/lib/context/RestaurantContext";
import { useTables, RestaurantTableItem, TableSectionItem, AddTableInput, UpdateTableInput } from "@/lib/hooks/useTables";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { useDineInStore } from "@/stores/useDineInStore";

interface TableCardInfo extends RestaurantTableItem {
  tableNumber: string;
  section: string;
  amount?: number;
  timeSpent?: string;
  kotCount?: number;
  guestCount?: number;
  waiterName?: string;
  billRequested?: boolean;
  billNumber?: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; border: string; text: string; badgeVariant: "success" | "warning" | "secondary" | "default" | "danger" }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    badgeVariant: "success",
  },
  occupied: {
    label: "Occupied",
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/60 hover:border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    badgeVariant: "secondary",
  },
  waiting_for_food: {
    label: "Cooking",
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-800 hover:border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    badgeVariant: "warning",
  },
  food_ready: {
    label: "Ready to Serve",
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-300 dark:border-blue-800 hover:border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    badgeVariant: "success",
  },
  bill_requested: {
    label: "Bill Requested",
    bg: "bg-amber-500/15 dark:bg-amber-950/40",
    border: "border-amber-400 dark:border-amber-600 hover:border-amber-500 ring-2 ring-amber-400/30",
    text: "text-amber-800 dark:text-amber-200 font-extrabold",
    badgeVariant: "warning",
  },
  billing: {
    label: "Bill Pending",
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-300 dark:border-amber-800 hover:border-amber-400",
    text: "text-amber-700 dark:text-amber-300",
    badgeVariant: "warning",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    badgeVariant: "default",
  },
};

export function TablesManagementView({ role = "admin" }: { role?: UserRole }) {
  const { restaurant, branch, restaurantId, branchId, isLoading: isContextLoading, error: contextError } =
    useRestaurantContext();
  const { activeRole } = useRolePermissions();

  const {
    allTables,
    tables: activeDbTables,
    sections,
    sectionsList,
    isLoading: isTablesLoading,
    error: tablesError,
    refetch,
    addTableAsync,
    isAddingTable,
    updateTableAsync,
    isUpdatingTable,
    deleteTableAsync,
    isDeletingTable,
    toggleActiveAsync,
    isTogglingActive,
    isSchemaMissing,
  } = useTables(restaurantId, branchId);

  const { sessions } = useDineInStore();

  // Mode: "floor" (Visual Dine-In Cards organized by Floor/Section) vs "management" (Admin Table CRUD List)
  const [viewMode, setViewMode] = React.useState<"floor" | "management">("floor");

  // Filters
  const [selectedSection, setSelectedSection] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals state
  const [selectedTableForOrder, setSelectedTableForOrder] = React.useState<TableCardInfo | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = React.useState(false);
  const [editingTable, setEditingTable] = React.useState<RestaurantTableItem | null>(null);

  // Form State for Add / Edit
  const [formTableNumber, setFormTableNumber] = React.useState("");
  const [formDisplayName, setFormDisplayName] = React.useState("");
  const [formCapacity, setFormCapacity] = React.useState<number>(4);
  const [formSectionId, setFormSectionId] = React.useState<string>("");
  const [formStatus, setFormStatus] = React.useState<TableStatus>("available");
  const [formDescription, setFormDescription] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Deletion Modal state
  const [tableToDelete, setTableToDelete] = React.useState<RestaurantTableItem | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Map floor tables with live dining sessions
  const floorTables = React.useMemo<TableCardInfo[]>(() => {
    return allTables.map((tbl) => {
      const liveSession = sessions[tbl.id];
      const base: TableCardInfo = {
        ...tbl,
        tableNumber: tbl.table_number,
        section: tbl.section_name || "Main Hall",
      };

      if (!tbl.is_active) {
        return {
          ...base,
          status: "inactive" as TableStatus,
        };
      }

      if (liveSession && liveSession.status !== "closed" && liveSession.status !== "completed") {
        const subtotal =
          liveSession.sentItems.reduce((s, i) => s + (i.total_price || 0), 0) +
          liveSession.unsentItems.reduce((s, i) => s + (i.totalPrice || 0), 0);

        let derivedStatus: TableStatus = "occupied";
        if (liveSession.billRequested) {
          derivedStatus = "bill_requested";
        } else if (liveSession.kots.some((k) => k.status === "ready")) {
          derivedStatus = "food_ready";
        } else if (liveSession.kots.some((k) => k.status === "preparing")) {
          derivedStatus = "waiting_for_food";
        } else if (liveSession.kots.length > 0) {
          derivedStatus = "occupied";
        }

        return {
          ...base,
          status: derivedStatus,
          amount: liveSession.bill?.final_total || (subtotal > 0 ? Math.round(subtotal * 1.05) : undefined),
          kotCount: liveSession.kots.length,
          guestCount: liveSession.guestCount,
          waiterName: liveSession.waiterName,
          billRequested: liveSession.billRequested,
          billNumber: liveSession.bill?.bill_number,
        };
      }
      return base;
    });
  }, [allTables, sessions]);

  // Section list for filtering strictly derived from database sections
  const sectionFilterOptions = React.useMemo(() => {
    const list = sectionsList.map((s) => s.name);
    return ["all", ...Array.from(new Set(list))];
  }, [sectionsList]);

  // Filtered floor tables
  const filteredFloorTables = React.useMemo(() => {
    return floorTables.filter((t) => {
      if (selectedSection !== "all" && t.section !== selectedSection) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesNum = t.tableNumber.toLowerCase().includes(q);
        const matchesName = (t.display_name || "").toLowerCase().includes(q);
        if (!matchesNum && !matchesName) return false;
      }
      return true;
    });
  }, [floorTables, selectedSection, searchQuery]);

  // Filtered management tables
  const filteredManagementTables = React.useMemo(() => {
    return allTables.filter((t) => {
      if (selectedSection !== "all" && t.section_name !== selectedSection) return false;
      if (statusFilter === "active" && !t.is_active) return false;
      if (statusFilter === "inactive" && t.is_active) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesNum = t.table_number.toLowerCase().includes(q);
        const matchesName = (t.display_name || "").toLowerCase().includes(q);
        if (!matchesNum && !matchesName) return false;
      }
      return true;
    });
  }, [allTables, selectedSection, statusFilter, searchQuery]);

  // Group tables by floor and section for Floor View
  const groupedFloorStructure = React.useMemo(() => {
    // 1. Group sections by floor
    const floorsMap = new Map<number, TableSectionItem[]>();

    sectionsList.forEach((sec) => {
      const fl = sec.floor || 1;
      if (!floorsMap.has(fl)) {
        floorsMap.set(fl, []);
      }
      floorsMap.get(fl)!.push(sec);
    });

    const sortedFloors = Array.from(floorsMap.keys()).sort((a, b) => a - b);

    return sortedFloors.map((floorNum) => {
      const floorSections = floorsMap.get(floorNum) || [];
      const sectionsWithTables = floorSections
        .filter((sec) => selectedSection === "all" || sec.name === selectedSection)
        .map((sec) => {
          const tablesForSection = filteredFloorTables.filter((t) => {
            if (t.section_id) return t.section_id === sec.id;
            return t.section === sec.name;
          });
          return {
            section: sec,
            tables: tablesForSection,
          };
        });

      return {
        floor: floorNum,
        sections: sectionsWithTables,
      };
    });
  }, [sectionsList, filteredFloorTables, selectedSection]);

  // Counters strictly calculated from database state
  const stats = React.useMemo(() => {
    const activeTablesList = allTables.filter((t) => t.is_active !== false);
    const inactiveTablesList = allTables.filter((t) => t.is_active === false);

    return {
      totalConfigured: activeTablesList.length,
      available: floorTables.filter((t) => t.is_active !== false && t.status === "available").length,
      occupied: floorTables.filter(
        (t) =>
          t.is_active !== false &&
          (t.status === "occupied" || t.status === "waiting_for_food" || t.status === "food_ready")
      ).length,
      billRequested: floorTables.filter((t) => t.is_active !== false && t.status === "bill_requested").length,
      inactive: inactiveTablesList.length,
    };
  }, [allTables, floorTables]);

  // Handlers for Add / Edit Modal
  const handleOpenAddModal = () => {
    setEditingTable(null);
    setFormTableNumber("");
    setFormDisplayName("");
    setFormCapacity(4);
    setFormStatus("available");
    setFormSectionId(sectionsList[0]?.id || "");
    setFormDescription("");
    setFormIsActive(true);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (tbl: RestaurantTableItem) => {
    setEditingTable(tbl);
    setFormTableNumber(tbl.table_number);
    setFormDisplayName(tbl.display_name || "");
    setFormCapacity(tbl.capacity || 4);
    setFormStatus(tbl.status || "available");
    const matchedSecId =
      tbl.section_id || sectionsList.find((s) => s.name === tbl.section_name)?.id || sectionsList[0]?.id || "";
    setFormSectionId(matchedSecId);
    setFormDescription(tbl.description || "");
    setFormIsActive(tbl.is_active);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedNumber = formTableNumber.trim();
    if (!trimmedNumber) {
      setFormError("Table number / identifier is required (e.g. T1, VIP-01).");
      return;
    }

    const capacityNum = Number(formCapacity);
    if (!capacityNum || isNaN(capacityNum) || capacityNum < 1) {
      setFormError("Seating capacity must be at least 1 person.");
      return;
    }

    if (!restaurantId) {
      setFormError("Restaurant context not found. Please verify your Supabase database connection.");
      return;
    }

    if (!branchId) {
      setFormError("Branch context not found. Please select an active branch.");
      return;
    }

    // Check duplicate table number locally
    const duplicate = allTables.some(
      (t) =>
        (!editingTable || t.id !== editingTable.id) &&
        t.table_number.toLowerCase() === trimmedNumber.toLowerCase()
    );
    if (duplicate) {
      setFormError(`Table ${trimmedNumber} already exists.`);
      return;
    }

    const selectedSec = sectionsList.find((s) => s.id === formSectionId);
    const chosenSectionId = selectedSec ? selectedSec.id : sectionsList[0]?.id || null;
    const chosenSectionName = selectedSec ? selectedSec.name : "Main Hall";

    try {
      if (editingTable) {
        await updateTableAsync({
          id: editingTable.id,
          restaurant_id: restaurantId,
          branch_id: branchId,
          table_number: trimmedNumber,
          display_name: formDisplayName.trim() || trimmedNumber,
          capacity: capacityNum,
          section_id: chosenSectionId,
          section_name: chosenSectionName,
          status: formStatus,
          description: formDescription.trim() || undefined,
          is_active: formIsActive,
        });
        showToast(`Table "${trimmedNumber}" updated successfully!`);
      } else {
        await addTableAsync({
          restaurant_id: restaurantId,
          branch_id: branchId,
          table_number: trimmedNumber,
          display_name: formDisplayName.trim() || trimmedNumber,
          capacity: capacityNum,
          section_id: chosenSectionId,
          section_name: chosenSectionName,
          status: formStatus,
          description: formDescription.trim() || undefined,
          is_active: formIsActive,
        });
        showToast(`Table "${trimmedNumber}" created successfully!`);
      }
      setIsAddEditModalOpen(false);
    } catch (err: any) {
      console.error("CREATE TABLE ERROR:", err);
      setFormError(err.message || "Failed to save table in database.");
    }
  };

  // Handler for Deletion
  const handleInitiateDelete = (tbl: RestaurantTableItem) => {
    setDeleteErrorMessage(null);
    setTableToDelete(tbl);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    try {
      await deleteTableAsync(tableToDelete.id);
      showToast(`Table "${tableToDelete.table_number}" removed successfully.`);
      setTableToDelete(null);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || "Could not delete table.");
    }
  };

  const handleToggleActive = async (tbl: RestaurantTableItem) => {
    try {
      await toggleActiveAsync({ tableId: tbl.id, isActive: !tbl.is_active });
      showToast(`Table "${tbl.table_number}" is now ${!tbl.is_active ? "Active" : "Inactive"}.`);
    } catch (err: any) {
      showToast(err.message || "Failed to update table availability", "error");
    }
  };

  const isManagerOrAdmin = role === "admin" || role === "manager" || activeRole === "admin" || activeRole === "manager";
  const isLoading = isContextLoading || isTablesLoading;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            "fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold text-white animate-in fade-in slide-in-from-top-4",
            toastMessage.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          )}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <Grid className="h-6 w-6 mr-2 text-brand-600" />
              Tables & Floor Management
            </h1>
            <Badge variant="primary">{viewMode === "floor" ? "Floor View" : "Table Management"}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Realtime dining floor overview, status lifecycle, and restaurant table layout configuration.</span>
            {branch && (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                • {branch.name} ({branch.code})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("floor")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer",
                viewMode === "floor"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Floor Layout</span>
            </button>
            <button
              onClick={() => setViewMode("management")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer",
                viewMode === "management"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table Management</span>
            </button>
          </div>

          {/* Add Table Button for Admin / Manager */}
          {isManagerOrAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              className="space-x-1.5 font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Table</span>
            </Button>
          )}
        </div>
      </div>

      {/* Database Error Banner if query failed */}
      {tablesError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="text-sm font-bold">Unable to load tables</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                {(tablesError as Error).message || "A database communication error occurred while querying Supabase."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs font-bold">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Floor Overview Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Configured</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{stats.totalConfigured}</p>
          </div>
          <Grid className="h-5 w-5 text-slate-400" />
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Available</p>
            <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{stats.available}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Occupied</p>
            <p className="text-base font-extrabold text-blue-700 dark:text-blue-300">{stats.occupied}</p>
          </div>
          <Utensils className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Bill Requested</p>
            <p className="text-base font-extrabold text-amber-800 dark:text-amber-200">{stats.billRequested}</p>
          </div>
          <BellRing className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Inactive Tables</p>
            <p className="text-base font-extrabold text-slate-600 dark:text-slate-400">{stats.inactive}</p>
          </div>
          <Power className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Section Filter Populated Strictly from Database */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1">
            <span className="text-xs text-slate-400 font-semibold mr-1">Section:</span>
            {sectionFilterOptions.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer shrink-0",
                  selectedSection === sec
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {sec === "all" ? "All Sections" : sec}
              </button>
            ))}
          </div>

          {/* Status Filter (in management view) */}
          {viewMode === "management" && (
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 font-semibold mr-1">Status:</span>
              {["all", "active", "inactive"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer",
                    statusFilter === st
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search table number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: VISUAL FLOOR LAYOUT (Organized by Floor & Section)               */}
      {/* ========================================================================= */}
      {viewMode === "floor" && (
        <div className="space-y-8">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-brand-600 mb-2" />
              Loading tables...
            </div>
          ) : allTables.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4 shadow-xs">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center">
                <Grid className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No tables created yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Configure dining tables for this branch to start taking dine-in orders and organizing floor seating.
                </p>
              </div>
              {isManagerOrAdmin && (
                <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="space-x-1.5 font-bold">
                  <Plus className="h-4 w-4" />
                  <span>+ Add Table</span>
                </Button>
              )}
            </div>
          ) : filteredFloorTables.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No tables match your filter</p>
              <p className="text-xs text-slate-400">Try selecting a different section or clearing the search box.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSection("all");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            groupedFloorStructure.map((floorGroup) => {
              const hasVisibleSections = floorGroup.sections.some((s) => s.tables.length > 0);
              if (!hasVisibleSections) return null;

              return (
                <div key={floorGroup.floor} className="space-y-6">
                  {/* Floor Header Badge */}
                  <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Layers className="h-4 w-4 text-brand-600" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      FLOOR {floorGroup.floor}
                    </h2>
                  </div>

                  {/* Sections on this Floor */}
                  <div className="space-y-6">
                    {floorGroup.sections.map(({ section, tables }) => {
                      if (tables.length === 0) return null;

                      return (
                        <div key={section.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mr-2" />
                              {section.name}
                              <span className="ml-2 text-[11px] font-semibold text-slate-400">
                                ({tables.length} table{tables.length > 1 ? "s" : ""})
                              </span>
                            </h3>
                          </div>

                          {/* Table Cards Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {tables.map((tbl) => {
                              const conf =
                                statusConfig[tbl.status] || (tbl.is_active ? statusConfig.available : statusConfig.inactive);
                              const isOccupied =
                                tbl.status !== "available" && tbl.is_active;

                              return (
                                <div
                                  key={tbl.id}
                                  onClick={() => setSelectedTableForOrder(tbl)}
                                  className={cn(
                                    "relative rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md",
                                    conf.bg,
                                    conf.border
                                  )}
                                >
                                  <div>
                                    {/* Top Bar: Table Identifier & Status Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="flex items-baseline space-x-1.5">
                                          <span className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                                            {tbl.tableNumber}
                                          </span>
                                          {tbl.display_name && tbl.display_name !== tbl.tableNumber && (
                                            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[90px]">
                                              ({tbl.display_name})
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                          {tbl.section}
                                        </span>
                                      </div>

                                      <Badge
                                        variant={conf.badgeVariant}
                                        className="font-extrabold text-[10px] uppercase shrink-0"
                                      >
                                        {conf.label}
                                      </Badge>
                                    </div>

                                    {/* Middle Details: Capacity, Waiter, Active Items */}
                                    <div className="mt-3.5 space-y-1.5">
                                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                        <span className="flex items-center text-[11px] text-slate-500 font-medium">
                                          <Users className="h-3 w-3 mr-1 text-slate-400" />
                                          {tbl.capacity} Seats
                                        </span>

                                        {tbl.timeSpent && (
                                          <span className="flex items-center text-[10px] text-slate-400 font-semibold">
                                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                                            {tbl.timeSpent}
                                          </span>
                                        )}
                                      </div>

                                      {tbl.waiterName && (
                                        <div className="text-[10px] text-slate-500 font-medium truncate">
                                          Waiter: <span className="font-bold text-slate-700 dark:text-slate-300">{tbl.waiterName}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom Status / Tap Action */}
                                  <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                                    {isOccupied && tbl.amount !== undefined ? (
                                      <div className="w-full flex items-center justify-between">
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          {tbl.kotCount ? `${tbl.kotCount} KOTs` : "Running"}
                                        </span>
                                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                          {formatCurrency(tbl.amount)}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-full flex items-center justify-between text-[11px] text-slate-400">
                                        <span>{tbl.status === "available" ? "Tap to seat & order" : "Tap for details"}</span>
                                        <span>→</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: TABLE MANAGEMENT VIEW (ADMIN / MANAGER CRUD LIST)                 */}
      {/* ========================================================================= */}
      {viewMode === "management" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Floor Configuration Directory
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage identifiers, seating capacity, sections, and active availability for all dining tables.
              </p>
            </div>
            {isManagerOrAdmin && (
              <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="space-x-1.5 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Table</span>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading tables from database...</div>
          ) : filteredManagementTables.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <TableIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No tables found
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No physical tables match the current filter or exist in database. Add your first table now.
              </p>
              {isManagerOrAdmin && (
                <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="space-x-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add Table</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Table Number / ID</th>
                    <th className="p-3.5">Display Name</th>
                    <th className="p-3.5 text-center">Capacity</th>
                    <th className="p-3.5">Section / Floor</th>
                    <th className="p-3.5">Live Status</th>
                    <th className="p-3.5 text-center">Availability</th>
                    <th className="p-3.5 text-center">Created At</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredManagementTables.map((tbl) => {
                    const isAvailable = tbl.is_active;

                    return (
                      <tr
                        key={tbl.id}
                        className={cn(
                          "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                          !tbl.is_active && "opacity-60 bg-slate-50/50 dark:bg-slate-900/30"
                        )}
                      >
                        {/* Table Number */}
                        <td className="p-3.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {tbl.table_number}
                          </span>
                          {tbl.description && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                              {tbl.description}
                            </span>
                          )}
                        </td>

                        {/* Display Name */}
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {tbl.display_name || "—"}
                        </td>

                        {/* Capacity */}
                        <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            <Users className="h-3 w-3 mr-1 text-slate-400" />
                            {tbl.capacity} Seats
                          </span>
                        </td>

                        {/* Section */}
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {tbl.section_name || "Main Hall"}
                          </span>
                        </td>

                        {/* Live Status */}
                        <td className="p-3.5">
                          <Badge
                            variant={
                              tbl.status === "available"
                                ? "success"
                                : tbl.status === "bill_requested"
                                ? "warning"
                                : tbl.status === "occupied"
                                ? "secondary"
                                : "default"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {tbl.status.replace(/_/g, " ")}
                          </Badge>
                        </td>

                        {/* Active / Inactive Status */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(tbl)}
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
                              isAvailable
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300"
                            )}
                            title={isAvailable ? "Click to deactivate" : "Click to activate"}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full mr-1.5",
                                isAvailable ? "bg-emerald-500" : "bg-slate-400"
                              )}
                            />
                            {isAvailable ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* Created At */}
                        <td className="p-3.5 text-center text-[11px] text-slate-400 font-mono">
                          {tbl.created_at ? new Date(tbl.created_at).toLocaleDateString() : "—"}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(tbl)}
                            className="h-7 text-xs px-2.5"
                            title="Edit Table"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            <span>Edit</span>
                          </Button>

                          {isManagerOrAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInitiateDelete(tbl)}
                              className="h-7 text-xs px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                              title="Delete Table"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span>Delete</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT TABLE FORM MODAL                                      */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2">
                <TableIcon className="h-4 w-4 text-brand-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {editingTable ? `Edit Table: ${editingTable.table_number}` : "Add New Table"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTable} className="p-5 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold space-y-1">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <span className="leading-snug">{formError}</span>
                  </div>
                </div>
              )}

              {/* Table Number / Identifier (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Table Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. T1, VIP-01, Family-01"
                  value={formTableNumber}
                  onChange={(e) => setFormTableNumber(e.target.value)}
                  required
                  className="text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique table identifier used across orders, KOT tickets, and billing.
                </p>
              </div>

              {/* Display Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="e.g. Table 1, Window Table, Garden Corner"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Capacity & Section in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Seating Capacity (Required) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Capacity <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    required
                    className="text-xs font-bold"
                  />
                </div>

                {/* Section / Floor Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {sectionsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Floor {s.floor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TableStatus)}
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="bill_requested">Bill Requested</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Description / Location Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Location <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="e.g. Near window, AC vent, power outlet"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Active / Inactive Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Active Availability
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {formIsActive
                      ? "Table is active and visible on the dining floor."
                      : "Table is inactive and hidden from dining operations."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formIsActive ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      formIsActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isAddingTable || isUpdatingTable}
                  className="text-xs font-bold px-4"
                >
                  {isAddingTable || isUpdatingTable ? "Saving..." : editingTable ? "Save Changes" : "Create Table"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE TABLE CONFIRMATION & BUSINESS VALIDATION DIALOG           */}
      {/* ========================================================================= */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            {deleteErrorMessage ? (
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Cannot Delete Table
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {deleteErrorMessage}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteErrorMessage(null);
                    setTableToDelete(null);
                  }}
                  className="w-full text-xs font-bold"
                >
                  Dismiss
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Delete Table {tableToDelete.table_number}?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to permanently delete table{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {tableToDelete.table_number} ({tableToDelete.section_name || "Main Hall"})
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTableToDelete(null)}
                    className="w-1/2 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmDelete}
                    disabled={isDeletingTable}
                    className="w-1/2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isDeletingTable ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TABLE ORDER POPUP (DINE-IN ORDER MANAGEMENT)                     */}
      {/* ========================================================================= */}
      {selectedTableForOrder && (
        <TableOrderModal
          isOpen={!!selectedTableForOrder}
          onClose={() => {
            setSelectedTableForOrder(null);
            refetch();
          }}
          tableId={selectedTableForOrder.id}
          tableNumber={selectedTableForOrder.tableNumber}
          capacity={selectedTableForOrder.capacity}
          sectionName={selectedTableForOrder.section}
          onTableStatusChanged={() => refetch()}
          role={role}
        />
      )}
    </div>
  );
}
