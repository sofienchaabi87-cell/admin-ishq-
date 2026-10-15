import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Package,
} from "lucide-react";
import { useAdminTheme } from "@/context/AdminThemeContext";
import {
  useAdminNotifications,
  AdminNotification,
  NotificationType,
} from "@/context/AdminNotificationsContext";

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} jours`;
  } catch {
    return "";
  }
}

export default function AdminNotifications() {
  const { isDark } = useAdminTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,
    refreshNotifications,
  } = useAdminNotifications();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | NotificationType>("ALL");
  const [readFilter, setReadFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Styles
  const cardBg = isDark ? "bg-stone-900 border-stone-800" : "bg-beige-50 border-beige-300 shadow-sm";
  const textMain = isDark ? "text-stone-100" : "text-beige-900";
  const textMuted = isDark ? "text-stone-500" : "text-beige-600";
  const inputBg = isDark
    ? "bg-stone-800 border-stone-700 text-stone-300 placeholder-stone-600"
    : "bg-beige-200/80 border-beige-300 text-beige-900 placeholder-beige-500 focus:bg-beige-50";
  const divider = isDark ? "border-stone-800" : "border-beige-200";

  // Filtered notifications
  const filtered = notifications.filter((notif) => {
    if (typeFilter !== "ALL" && notif.type !== typeFilter) return false;
    if (readFilter === "UNREAD" && notif.read) return false;
    if (readFilter === "READ" && !notif.read) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = notif.title.toLowerCase().includes(q);
      const matchMsg = notif.message.toLowerCase().includes(q);
      const matchCustomer = notif.metadata?.customerName?.toLowerCase().includes(q);
      const matchOrder = notif.metadata?.orderId?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchCustomer || matchOrder;
    }
    return true;
  });

  const orderCount = notifications.filter((n) => n.type === "order").length;
  const stockCount = notifications.filter((n) => n.type === "stock").length;

  async function handleRefresh() {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  }

  function handleCreateSampleNotification() {
    const demoOptions = [
      {
        title: "Nouvelle commande #CMD-" + Math.floor(1000 + Math.random() * 9000),
        message: "Nouveau panier validé pour Huile de Parfum ISHQ Rose Impériale (89.00 TND).",
        type: "order" as NotificationType,
        link: "/orders",
      },
      {
        title: "Alerte Réapprovisionnement",
        message: "Le stock de « ISHQ Nuit Intense » est critique (seulement 2 unités restantes).",
        type: "stock" as NotificationType,
        link: "/products",
      },
      {
        title: "Paiement Ã  vérifier",
        message: "Commande #CMD-8501 en attente de validation bancaire / livraison.",
        type: "warning" as NotificationType,
        link: "/orders",
      },
    ];
    const pick = demoOptions[Math.floor(Math.random() * demoOptions.length)];
    addNotification(pick);
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="w-5 h-5 text-amber-500" />;
      case "stock":
        return <Package className="w-5 h-5 text-orange-500" />;
      case "warning":
        return <Clock className="w-5 h-5 text-rose-500" />;
      case "system":
      default:
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case "order":
        return isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600";
      case "stock":
        return isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600";
      case "warning":
        return isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600";
      case "system":
      default:
        return isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600";
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case "order":
        return "Commande";
      case "stock":
        return "Stock";
      case "warning":
        return "Action requise";
      case "system":
        return "Système";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-2xl font-serif font-bold ${textMain}`}>
              Centre de Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Surveillez en temps réel les commandes reçues, niveaux de stock et alertes de la boutique.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition ${
              isDark
                ? "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
            title="Rafraîchir les notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-500" : ""}`} />
            <span>Actualiser</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition border border-amber-500/30"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer comme lu</span>
            </button>
          )}

          <button
            onClick={handleCreateSampleNotification}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition ${
              isDark
                ? "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                : "bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
            title="Générer une notification de test"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Tester une alerte</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Êtes-vous sûr de vouloir effacer toutes les notifications ?")) {
                  clearAll();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-500 hover:bg-rose-500/10 transition`}
              title="Supprimer toutes les notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${cardBg} transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${textMuted}`}>Total alertes</span>
            <div className="p-2 rounded-xl bg-stone-500/10 text-stone-400">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${textMain}`}>{notifications.length}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg} transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${textMuted}`}>Non lues</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-500">{unreadCount}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg} transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${textMuted}`}>Commandes</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${textMain}`}>{orderCount}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg} transition-all`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${textMuted}`}>Alertes stock</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${textMain}`}>{stockCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="w-full md:flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, client, commande, produit..."
              className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${inputBg}`}
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {(
              [
                { key: "ALL", label: "Toutes" },
                { key: "order", label: "Commandes" },
                { key: "stock", label: "Stock" },
                { key: "warning", label: "Rappels" },
                { key: "system", label: "Système" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium transition ${
                  typeFilter === tab.key
                    ? "bg-amber-500 text-stone-950 font-bold"
                    : isDark
                    ? "bg-stone-800 text-stone-400 hover:text-stone-200"
                    : "bg-stone-100 text-stone-600 hover:text-stone-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Read status filter */}
          <div className="flex items-center gap-1 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0">
            <button
              onClick={() => setReadFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-lg transition ${
                readFilter === "ALL"
                  ? "bg-amber-500/10 text-amber-500 font-semibold"
                  : textMuted
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setReadFilter("UNREAD")}
              className={`px-2.5 py-1 text-xs rounded-lg transition ${
                readFilter === "UNREAD"
                  ? "bg-amber-500/10 text-amber-500 font-semibold"
                  : textMuted
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setReadFilter("READ")}
              className={`px-2.5 py-1 text-xs rounded-lg transition ${
                readFilter === "READ"
                  ? "bg-amber-500/10 text-amber-500 font-semibold"
                  : textMuted
              }`}
            >
              Lues
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className={`rounded-2xl border ${cardBg} overflow-hidden divide-y ${divider}`}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
              <Bell className="w-6 h-6 opacity-30" />
            </div>
            <h3 className={`text-base font-semibold ${textMain}`}>
              Aucune notification trouvée
            </h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${textMuted}`}>
              {search || typeFilter !== "ALL" || readFilter !== "ALL"
                ? "Aucun résultat ne correspond Ã  vos filtres actuels."
                : "Vous n'avez actuellement aucune notification dans votre tableau de bord."}
            </p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition group ${
                !notif.read
                  ? isDark
                    ? "bg-amber-500/5 hover:bg-stone-800/40"
                    : "bg-amber-50/30 hover:bg-stone-50"
                  : isDark
                  ? "hover:bg-stone-800/30"
                  : "hover:bg-stone-50"
              }`}
            >
              {/* Left: Icon + Content */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(
                    notif.type
                  )}`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`text-sm font-semibold ${textMain}`}>
                      {notif.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getIconBg(
                        notif.type
                      )}`}
                    >
                      {getTypeLabel(notif.type)}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Non lue" />
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? "text-stone-300" : "text-stone-600"}`}>
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
                    <span>{formatRelativeTime(notif.timestamp)}</span>
                    <span>â€¢</span>
                    <span>{formatDateTime(notif.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:self-center justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                {notif.link && (
                  <button
                    onClick={() => navigate(notif.link!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow-sm"
                  >
                    <span>Voir</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => markAsRead(notif.id)}
                  className={`p-2 rounded-xl border transition ${
                    notif.read
                      ? isDark
                        ? "border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800"
                        : "border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  }`}
                  title={notif.read ? "Déjà lu" : "Marquer comme lu"}
                >
                  <Check className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteNotification(notif.id)}
                  className={`p-2 rounded-xl border transition ${
                    isDark
                      ? "border-stone-800 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10"
                      : "border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                  title="Supprimer la notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

