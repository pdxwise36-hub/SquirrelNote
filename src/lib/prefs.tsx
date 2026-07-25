"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type FontChoice = "sans" | "serif" | "mono";
export type Density = "comfortable" | "compact";
export type ViewMode = "list" | "grid";
export type SortMode = "updated" | "created" | "title";

export interface Preferences {
  theme: ThemeMode;
  accent: string; // hex
  font: FontChoice;
  density: Density;
  view: ViewMode;
  sort: SortMode;
  sidebarCollapsed: boolean;
}

export const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: "Acorn", value: "#b3743a" },
  { name: "Ember", value: "#e0533d" },
  { name: "Rose", value: "#e11d48" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Ocean", value: "#2563eb" },
  { name: "Teal", value: "#0d9488" },
  { name: "Forest", value: "#16a34a" },
  { name: "Slate", value: "#475569" },
];

const DEFAULTS: Preferences = {
  theme: "system",
  accent: "#b3743a",
  font: "sans",
  density: "comfortable",
  view: "list",
  sort: "updated",
  sidebarCollapsed: false,
};

const STORAGE_KEY = "squirrelnote.prefs";

interface Ctx {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
}

const PrefsContext = createContext<Ctx | null>(null);

/** Pick readable text color (black/white) for a given hex background. */
function contrastFor(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#ffffff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1a1a1a" : "#ffffff";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  // Persist + apply to <html> whenever prefs change.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    root.dataset.theme = resolveTheme(prefs.theme);
    root.dataset.font = prefs.font;
    root.dataset.density = prefs.density;
    root.style.setProperty("--accent", prefs.accent);
    root.style.setProperty("--accent-contrast", contrastFor(prefs.accent));
  }, [prefs, loaded]);

  // React to OS theme changes when in "system" mode.
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs.theme]);

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      setPref: (key, val) => setPrefs((p) => ({ ...p, [key]: val })),
      reset: () => setPrefs(DEFAULTS),
    }),
    [prefs],
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PreferencesProvider");
  return ctx;
}
