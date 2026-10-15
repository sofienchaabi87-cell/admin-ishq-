import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminThemeProvider, useAdminTheme } from "@/context/AdminThemeContext";
import { AdminNotificationsProvider } from "@/context/AdminNotificationsContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

function AdminLayoutInner() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark } = useAdminTheme();

  const mainBg = isDark ? "bg-stone-950" : "bg-beige-100";
  const textBase = isDark ? "text-stone-100" : "text-beige-900";

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg} ${textBase}`}>
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminNotificationsProvider>
        <AdminLayoutInner />
      </AdminNotificationsProvider>
    </AdminThemeProvider>
  );
}

