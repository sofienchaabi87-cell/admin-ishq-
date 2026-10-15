import React, { createContext, useContext, useState, useEffect } from "react";

export type NotificationType = "order" | "stock" | "system" | "warning";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO date or formatted
  read: boolean;
  link?: string;
  metadata?: {
    orderId?: string;
    productId?: string;
    amount?: number;
    customerName?: string;
  };
}

export interface NotificationSettings {
  orderAlerts: boolean;
  pendingAlerts: boolean;
  stockAlerts: boolean;
}

interface AdminNotificationsContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<AdminNotification, "id" | "timestamp" | "read">) => void;
  toggleSetting: (key: keyof NotificationSettings) => void;
  refreshNotifications: () => Promise<void>;
}

const STORAGE_KEY = "ishq_admin_notifications_v1";
const SETTINGS_KEY = "ishq_admin_notification_settings";
const API_BASE = import.meta.env.VITE_API_URL || "/api";
import { ensureAdminToken } from "@/lib/api";

const DEFAULT_SETTINGS: NotificationSettings = {
  orderAlerts: true,
  pendingAlerts: true,
  stockAlerts: true,
};

// Realistic initial notifications showcasing ISHQ store activity
const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "Nouvelle commande #CMD-8492",
    message: "Yasmine Trabelsi a passé une commande de 178.00 TND (2 articles).",
    type: "order",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    read: false,
    link: "/orders",
    metadata: { orderId: "CMD-8492", amount: 178, customerName: "Yasmine Trabelsi" },
  },
  {
    id: "notif-2",
    title: "Alerte Stock Faible",
    message: "Le parfum « ISHQ Signature (10 ml) » n'a plus que 3 flacons en réserve.",
    type: "stock",
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // ~1 hr ago
    read: false,
    link: "/products",
    metadata: { productId: "ishq-signature" },
  },
  {
    id: "notif-3",
    title: "Commande en attente > 24h",
    message: "La commande #CMD-8480 de Mehdi Gharbi est toujours en attente de confirmation.",
    type: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hrs ago
    read: false,
    link: "/orders",
    metadata: { orderId: "CMD-8480" },
  },
  {
    id: "notif-4",
    title: "Sauvegarde & Sécurité",
    message: "Synchronisation de la base de données et session administrateur active.",
    type: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    read: true,
    link: "/settings",
  },
  {
    id: "notif-5",
    title: "Nouvelle commande #CMD-8475",
    message: "Amine Ben Salem a validé son panier ISHQ Nuit Intense (89.00 TND).",
    type: "order",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: true,
    link: "/orders",
    metadata: { orderId: "CMD-8475", amount: 89, customerName: "Amine Ben Salem" },
  },
];

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

export function AdminNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Optional sync with backend orders & stock
  async function refreshNotifications() {
    try {
      let token = localStorage.getItem("ishq_token");
      if (!token || token === "null" || token === "undefined" || token === "demo_token_ishq_admin") {
        token = await ensureAdminToken();
      }
      if (!token) return;

      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const orders = Array.isArray(data?.data) ? data.data : [];
        
        // Find recent pending orders
        const newOrderNotifs: AdminNotification[] = [];
        orders.slice(0, 5).forEach((order: any) => {
          const id = `order-${order.id || order.orderNumber}`;
          if (!notifications.some((n) => n.id === id || n.metadata?.orderId === (order.orderNumber || order.id))) {
            newOrderNotifs.push({
              id,
              title: `Nouvelle commande #${order.orderNumber || order.id}`,
              message: `${order.customerName || "Client"} a passé une commande de ${(order.grandTotal || 0).toFixed(2)} TND.`,
              type: "order",
              timestamp: order.createdAt || new Date().toISOString(),
              read: false,
              link: "/orders",
              metadata: {
                orderId: order.orderNumber || order.id,
                amount: order.grandTotal,
                customerName: order.customerName,
              },
            });
          }
        });

        if (newOrderNotifs.length > 0) {
          setNotifications((prev) => [...newOrderNotifs, ...prev]);
        }
      }
    } catch {
      // ignore error when backend is offline
    }
  }

  // Check on mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAll() {
    setNotifications([]);
  }

  function addNotification(notif: Omit<AdminNotification, "id" | "timestamp" | "read">) {
    const newNotif: AdminNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }

  function toggleSetting(key: keyof NotificationSettings) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AdminNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        settings,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        toggleSetting,
        refreshNotifications,
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within an AdminNotificationsProvider");
  }
  return context;
}

