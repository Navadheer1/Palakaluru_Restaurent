import { create } from "zustand";

interface UiState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  isMobileNavOpen: false,
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  activeBranchId: "b0000000-0000-0000-0000-000000000001",
  setActiveBranchId: (id) => set({ activeBranchId: id }),
}));
