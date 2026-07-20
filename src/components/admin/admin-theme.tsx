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

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M12.1 2a9.9 9.9 0 0 0-1.2.07 8 8 0 1 0 11.03 11.03A10 10 0 0 1 12.1 2z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5h1v3h-2V2h1zm0 17h1v3h-2v-3h1zM2 11h3v2H2v-2zm17 0h3v2h-3v-2zM4.9 4.2l2.1 2.1-1.4 1.4-2.1-2.1 1.4-1.4zm12.5 12.5 2.1 2.1-1.4 1.4-2.1-2.1 1.4-1.4zM19.1 4.2l1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1zM6.4 16.7l1.4 1.4-2.1 2.1-1.4-1.4 2.1-2.1z" />
    </svg>
  );
}

export function AdminThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme, ready } = useAdminTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-sbc-gray transition-colors hover:bg-sbc-gold/10 hover:text-sbc-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/30 ${className}`}
    >
      <span className="text-[20px] leading-none">
        {ready && isDark ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}
