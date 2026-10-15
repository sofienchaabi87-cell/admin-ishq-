import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Search,
  Menu,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { useAdminNotifications, AdminNotification } from "@/context/AdminNotificationsContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard", "/admin": "Dashboard",
  "/orders": "Commandes", "/admin/orders": "Commandes",
  "/products": "Produits", "/admin/products": "Produits",
  "/notifications": "Notifications", "/admin/notifications": "Notifications",
  "/settings": "Paramètres", "/admin/settings": "Paramètres",
};

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} j`;
  } catch {
    return "";
  }
}

interface AdminTopbarProps {
  onMobileMenuOpen: () => void;
}

export default function AdminTopbar({ onMobileMenuOpen }: AdminTopbarProps) {
  const { isDark, toggleTheme } = useAdminTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useAdminNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  let user: { name?: string; email?: string } = {};
  try {
    user = JSON.parse(localStorage.getItem("ishq_user") || "{}") || {};
  } catch {
    user = {};
  }

  const title = PAGE_TITLES[location.pathname] ?? "Admin";
  const initials = (user.name || user.email || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bg = isDark
    ? "bg-stone-900/90 border-stone-800"
    : "bg-beige-50/95 border-beige-300 backdrop-blur-md";
  const inputBg = isDark
    ? "bg-stone-800 border-stone-700 text-stone-300 placeholder-stone-600"
    : "bg-beige-200/80 border-beige-300 text-beige-900 placeholder-beige-600 focus:bg-beige-50";
  const textMain = isDark ? "text-stone-100" : "text-beige-900";
  const textMuted = isDark ? "text-stone-500" : "text-beige-600";
  const iconBtn = isDark
    ? "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
    : "text-beige-700 hover:text-beige-950 hover:bg-beige-200/80";

  const dropdownBg = isDark
    ? "bg-stone-900 border-stone-800 text-stone-200 shadow-2xl shadow-black/60"
    : "bg-beige-50 border-beige-300 text-beige-900 shadow-2xl shadow-stone-400/20";
  const dropdownDivider = isDark ? "border-stone-800" : "border-beige-200";

  const displayedNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="w-4 h-4 text-amber-500" />;
      case "stock":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "warning":
        return <Clock className="w-4 h-4 text-rose-500" />;
      case "system":
      default:
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getIconBg = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return isDark ? "bg-amber-500/10" : "bg-amber-50";
      case "stock":
        return isDark ? "bg-orange-500/10" : "bg-orange-50";
      case "warning":
        return isDark ? "bg-rose-500/10" : "bg-rose-50";
      case "system":
      default:
        return isDark ? "bg-emerald-500/10" : "bg-emerald-50";
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 py-3.5 border-b backdrop-blur-md transition-colors ${bg}`}
    >
      {/* Mobile burger */}
      <button
        onClick={onMobileMenuOpen}
        className={`lg:hidden p-2 rounded-lg transition ${iconBtn}`}
        aria-label="Ouvrir le menu mobile"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h2 className={`text-base font-semibold ${textMain} hidden md:block`}>
        {title}
      </h2>

      {/* Search */}
      <div className="flex-1 max-w-sm relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher..."
          className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${inputBg}`}
        />
      </div>

      <div className="ml-auto flex items-center gap-2 relative" ref={popoverRef}>
        {/* Notification bell */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition ${iconBtn} ${
            isOpen ? (isDark ? "bg-stone-800 text-amber-400" : "bg-stone-100 text-amber-600") : ""
          }`}
          title="Centre de notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center shadow-md animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown Popover */}
        {isOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border ${dropdownBg} transition-all z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150`}
          >
            {/* Header */}
            <div className={`p-4 border-b ${dropdownDivider} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 transition px-1.5 py-1 rounded hover:bg-amber-500/10"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tout lire</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1 rounded-lg ${textMuted} hover:text-stone-200 transition`}
                  title="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className={`flex border-b ${dropdownDivider} px-3 py-2 text-xs gap-2`}>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  filter === "all"
                    ? isDark
                      ? "bg-stone-800 text-amber-400 font-semibold"
                      : "bg-stone-100 text-amber-600 font-semibold"
                    : textMuted
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  filter === "unread"
                    ? isDark
                      ? "bg-stone-800 text-amber-400 font-semibold"
                      : "bg-stone-100 text-amber-600 font-semibold"
                    : textMuted
                }`}
              >
                Non lues ({unreadCount})
              </button>
            </div>

            {/* List of notifications */}
            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
              {displayedNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-2 text-stone-400">
                    <Bell className="w-5 h-5 opacity-40" />
                  </div>
                  <p className="text-xs font-medium text-stone-400">
                    {filter === "unread"
                      ? "Aucune notification non lue"
                      : "Aucune notification pour le moment"}
                  </p>
                </div>
              ) : (
                displayedNotifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex items-start gap-3 transition group relative ${
                      !notif.read
                        ? isDark
                          ? "bg-amber-500/5 hover:bg-stone-800/60"
                          : "bg-amber-50/40 hover:bg-stone-50"
                        : isDark
                        ? "hover:bg-stone-800/40"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(
                        notif.type
                      )}`}
                    >
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) {
                          navigate(notif.link);
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold truncate text-stone-800 dark:text-stone-200">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
                        <span>{formatTimeAgo(notif.timestamp)}</span>
                        {notif.link && (
                          <span className="flex items-center gap-0.5 text-amber-500/80 hover:text-amber-500">
                            <span>Voir</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-amber-500 transition"
                          title="Marquer comme lu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1 rounded text-stone-400 hover:text-rose-500 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t ${dropdownDivider} bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between`}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/notifications");
                }}
                className="w-full py-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline transition"
              >
                Voir toutes les notifications ({notifications.length}) →
              </button>
            </div>
          </div>
        )}

        {/* Dark / Light toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl transition ${iconBtn}`}
          title={isDark ? "Mode clair" : "Mode sombre"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className={`text-xs font-semibold leading-none ${textMain}`}>
              {user.name || "Admin"}
            </p>
            <p className={`text-[10px] mt-0.5 ${textMuted}`}>{user.email || ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

