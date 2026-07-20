"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "sbc-admin-theme";
const LEGACY_STORAGE_KEY = "sbc-superadmin-theme";

type AdminTheme = "light" | "dark";

type ThemeContextValue = {
  theme: AdminTheme;
  isDark: boolean;
  toggleTheme: () => void;
  ready: boolean;
};

const AdminThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  const stored =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, ready]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return (
    <AdminThemeContext.Provider
      value={{ theme, isDark: theme === "dark", toggleTheme, ready }}
    >
      <div className={`min-h-screen ${theme === "dark" ? "sbc-dark" : ""}`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const value = useContext(AdminThemeContext);
  if (!value) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return value;
}

export function AdminThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme, ready } = useAdminTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex h-9 items-center gap-2 rounded-md border border-sbc-gray-light bg-sbc-white px-3 text-[10px] font-semibold uppercase tracking-widest text-sbc-gray transition hover:border-sbc-gold/50 hover:text-sbc-gold-dark ${className}`}
    >
      {ready ? (isDark ? "Light" : "Dark") : "Theme"}
    </button>
  );
}
