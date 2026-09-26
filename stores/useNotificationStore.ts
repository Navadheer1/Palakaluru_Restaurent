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

function loadSavedNotifications(): WaiterNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Purge any legacy sample mock notifications if present in browser localStorage
        return parsed.filter((n) => n && n.id !== "notif-1" && n.id !== "notif-2");
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
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
