import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { useAdminNotifications, NotificationSettings } from "@/context/AdminNotificationsContext";
import { Save, Sun, Moon, User, Bell, Shield, ExternalLink, Check } from "lucide-react";

export default function AdminSettings() {
  const { isDark, toggleTheme } = useAdminTheme();
  const { settings, toggleSetting, unreadCount } = useAdminNotifications();

  let userData: { name?: string; email?: string } = {};
  try {
    userData = JSON.parse(localStorage.getItem("ishq_user") || "{}") || {};
  } catch {
    userData = {};
  }

  const [name, setName] = useState(userData.name || "");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const current = JSON.parse(localStorage.getItem("ishq_user") || "{}");
      localStorage.setItem("ishq_user", JSON.stringify({ ...current, name }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      /* ignore */
    }
  }

  const sectionBg = isDark ? "bg-stone-900 border-stone-800" : "bg-beige-50 border-beige-300 shadow-sm";
  const inputBg = isDark
    ? "bg-stone-800 border-stone-700 text-stone-200 focus:border-amber-500"
    : "bg-beige-200/80 border-beige-300 text-beige-900 focus:border-amber-500 focus:bg-beige-50";
  const labelColor = isDark ? "text-stone-400" : "text-beige-800 font-medium";
  const textMain = isDark ? "text-stone-100" : "text-beige-900";
  const textMuted = isDark ? "text-stone-500" : "text-beige-600";
  const sectionTitle = isDark ? "text-stone-300" : "text-beige-900 font-bold";
  const divider = isDark ? "border-stone-800" : "border-beige-200";

  const notificationItems: {
    key: keyof NotificationSettings;
    label: string;
    desc: string;
  }[] = [
    {
      key: "orderAlerts",
      label: "Nouvelle commande",
      desc: "Recevoir une alerte immédiate Ã  chaque nouvelle commande client",
    },
    {
      key: "pendingAlerts",
      label: "Commande en attente > 24h",
      desc: "Rappel automatique si une commande n'est pas traitée",
    },
    {
      key: "stockAlerts",
      label: "Alerte de stock critique",
      desc: "Notifier lorsque le stock d'un parfum passe sous le seuil de 5 flacons",
    },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile */}
      <div className={`rounded-2xl border p-6 ${sectionBg}`}>
        <div className="flex items-center gap-2 mb-5">
          <User className={`w-4 h-4 ${textMuted}`} />
          <h3 className={`font-semibold ${sectionTitle}`}>Profil administrateur</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={`block text-sm mb-1.5 ${labelColor}`}>Nom affiché</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className={`w-full px-4 py-2.5 text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${inputBg}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1.5 ${labelColor}`}>Email (lecture seule)</label>
            <input
              type="email"
              value={userData.email || ""}
              readOnly
              className={`w-full px-4 py-2.5 text-sm rounded-xl border opacity-60 cursor-not-allowed ${inputBg}`}
            />
          </div>
          <button
            type="submit"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              saved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500 hover:bg-amber-400 text-stone-950"
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? "Enregistré !" : "Enregistrer"}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className={`rounded-2xl border p-6 ${sectionBg}`}>
        <div className="flex items-center gap-2 mb-5">
          <Sun className={`w-4 h-4 ${textMuted}`} />
          <h3 className={`font-semibold ${sectionTitle}`}>Apparence</h3>
        </div>
        <div className={`flex items-center justify-between py-3 border-b ${divider}`}>
          <div>
            <p className={`text-sm font-medium ${textMain}`}>Mode sombre</p>
            <p className={`text-xs mt-0.5 ${textMuted}`}>
              Interface adaptée aux environnements peu lumineux
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDark ? "bg-amber-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isDark ? "translate-x-5" : "translate-x-0.5"
              }`}
            >
              {isDark ? (
                <Moon className="w-2.5 h-2.5 text-amber-500" />
              ) : (
                <Sun className="w-2.5 h-2.5 text-stone-400" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className={`rounded-2xl border p-6 ${sectionBg}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${textMuted}`} />
            <h3 className={`font-semibold ${sectionTitle}`}>Préférences de notifications</h3>
          </div>
          <Link
            to="/notifications"
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition"
          >
            <span>Ouvrir le centre ({unreadCount} non lue{unreadCount > 1 ? "s" : ""})</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-1">
          {notificationItems.map((item) => {
            const isChecked = !!settings[item.key];
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between py-3.5 border-b last:border-b-0 ${divider}`}
              >
                <div className="pr-4">
                  <p className={`text-sm font-medium ${textMain}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isChecked}
                  onClick={() => toggleSetting(item.key)}
                  className={`h-6 w-11 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${
                    isChecked ? "bg-amber-500" : isDark ? "bg-stone-700" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 mt-0.5 ${
                      isChecked ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security */}
      <div className={`rounded-2xl border p-6 ${sectionBg}`}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className={`w-4 h-4 ${textMuted}`} />
          <h3 className={`font-semibold ${sectionTitle}`}>Sécurité</h3>
        </div>
        <p className={`text-sm ${textMuted}`}>
          La modification du mot de passe s'effectue via votre interface de gestion backend.
        </p>
      </div>
    </div>
  );
}

