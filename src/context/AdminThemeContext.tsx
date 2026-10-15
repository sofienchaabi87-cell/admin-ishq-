import { createContext, useContext, useEffect, useState } from "react";

interface AdminThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("ishq_admin_theme");
    return stored !== "light";
  });

  useEffect(() => {
    localStorage.setItem("ishq_admin_theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light-beige");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light-beige");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <AdminThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
