"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "sbc-superadmin-theme";

type SuperadminTheme = "light" | "dark";

type ThemeContextValue = {
  theme: SuperadminTheme;
  isDark: boolean;
  toggleTheme: () => void;
  ready: boolean;
};

const SuperadminThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): SuperadminTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function SuperadminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SuperadminTheme>("light");
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
    <SuperadminThemeContext.Provider
      value={{ theme, isDark: theme === "dark", toggleTheme, ready }}
    >
      <div className={`min-h-screen ${theme === "dark" ? "sa-dark" : ""}`}>
        {children}
      </div>
    </SuperadminThemeContext.Provider>
  );
}

export function useSuperadminTheme() {
  const value = useContext(SuperadminThemeContext);
  if (!value) {
    throw new Error("useSuperadminTheme must be used within SuperadminThemeProvider");
  }
  return value;
}

export function SuperadminThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme, ready } = useSuperadminTheme();

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
