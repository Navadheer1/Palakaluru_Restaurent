import { create } from "zustand";

export interface WaiterNotification {
  id: string;
  type: "kot_ready" | "kot_preparing" | "bill_ready" | "bill_requested" | "payment_completed" | "system";
  title: string;
  message: string;
  tableNumber?: string;
  kotNumber?: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: WaiterNotification[];
  addNotification: (notification: Omit<WaiterNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

const STORAGE_KEY = "culinacloud_waiter_notifications_v1";

const initialSampleNotifications: WaiterNotification[] = [
  {
    id: "notif-1",
    type: "kot_ready",
    title: "Table T-01 Food Ready",
    message: "Special Dum Chicken Biryani is prepared and ready to serve.",
    tableNumber: "T-01",
    kotNumber: "KOT #101",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    read: false,
  },
  {
    id: "notif-2",
    type: "bill_ready",
    title: "Bill Ready for Table T-04",
    message: "Admin has generated Bill #BILL-1045 for ₹784. Ready for guest.",
    tableNumber: "T-04",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
  },
];

function loadSavedNotifications(): WaiterNotification[] {
  if (typeof window === "undefined") return initialSampleNotifications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse errors
  }
  return initialSampleNotifications;
}

function saveNotifications(notifications: WaiterNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Ignore storage errors
  }
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: loadSavedNotifications(),

  addNotification: (item) => {
    const newNotif: WaiterNotification = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...get().notifications].slice(0, 50); // Keep latest 50
    saveNotifications(updated);
    set({ notifications: updated });
  },

  markAsRead: (id) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
    set({ notifications: updated });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    set({ notifications: updated });
  },

  clearAll: () => {
    saveNotifications([]);
    set({ notifications: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
