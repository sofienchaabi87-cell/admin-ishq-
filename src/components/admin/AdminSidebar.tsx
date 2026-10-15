import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  Bell,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { logoutUser } from "@/lib/api";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { useAdminNotifications } from "@/context/AdminNotificationsContext";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Commandes", icon: ShoppingBag },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/notifications", label: "Notifications", icon: Bell, hasBadge: true },
  { to: "/settings", label: "Paramètres", icon: Settings },
];

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function AdminSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const { unreadCount } = useAdminNotifications();

  const bg = isDark
    ? "bg-stone-900 border-stone-800"
    : "bg-beige-50 border-beige-300";
  const textMuted = isDark ? "text-stone-500" : "text-beige-600";
  const logoText = "text-amber-500";
  const activeClass = isDark
    ? "bg-amber-500/10 text-amber-400 border-r-2 border-amber-500"
    : "bg-beige-200/90 text-amber-700 font-semibold border-r-2 border-amber-500 shadow-xs";
  const inactiveClass = isDark
    ? "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
    : "text-beige-800 hover:bg-beige-200/60 hover:text-beige-950";

  function handleLogout() {
    logoutUser();
    localStorage.removeItem("ishq_user");
    navigate("/login");
  }

  const SidebarContent = () => (
    <div className={`flex flex-col h-full ${bg} border-r transition-all duration-300`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b ${isDark ? "border-stone-800" : "border-beige-300"}`}>
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        {!collapsed && (
          <div>
            <span className={`font-serif font-bold text-base ${logoText}`}>ISHQ</span>
            <span className={`block text-[10px] uppercase tracking-widest ${textMuted}`}>
              Administration
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, icon: Icon, end, hasBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl mb-1 transition-all duration-200 text-sm font-medium ${
                isActive ? activeClass : inactiveClass
              }`
            }
          >
            <div className="relative flex items-center justify-center">
              <Icon className="w-4 h-4 flex-shrink-0" />
              {hasBadge && unreadCount > 0 && collapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>{label}</span>
                {hasBadge && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className={`p-4 border-t ${isDark ? "border-stone-800" : "border-beige-300"}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
            isDark
              ? "text-red-400 hover:bg-red-500/10"
              : "text-red-600 hover:bg-red-500/10"
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full absolute -right-3 top-20 border shadow-md z-10 transition-colors ${
          isDark
            ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-amber-400"
            : "bg-beige-50 border-beige-300 text-beige-700 hover:text-amber-600"
        }`}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden lg:block relative flex-shrink-0 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="fixed top-0 left-0 h-screen" style={{ width: collapsed ? 64 : 240 }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

