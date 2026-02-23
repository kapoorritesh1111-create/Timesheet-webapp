"use client";

import { useEffect, useMemo } from "react";
import { useProfile } from "../../lib/useProfile";

/**
 * This ThemeProvider is the single source of truth for applying per-user UI prefs.
 * It reads from:
 *  1) profile.ui_prefs (DB)  [preferred]
 *  2) localStorage fallback  (for instant UX + safety)
 *
 * Then it applies:
 *  - documentElement.dataset.accent / density / radius
 * which your globals.css maps into CSS vars.
 */

type Accent = "blue" | "indigo" | "emerald" | "rose" | "slate";
type Density = "comfortable" | "compact";
type Radius = "md" | "lg" | "xl";

type UiPrefs = {
  accent: Accent;
  density: Density;
  radius: Radius;
};

const DEFAULT_PREFS: UiPrefs = {
  accent: "blue",
  density: "comfortable",
  radius: "lg",
};

function safeJsonParse(input: unknown): any | null {
  if (typeof input !== "string") return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function isAccent(v: unknown): v is Accent {
  return v === "blue" || v === "indigo" || v === "emerald" || v === "rose" || v === "slate";
}
function isDensity(v: unknown): v is Density {
  return v === "comfortable" || v === "compact";
}
function isRadius(v: unknown): v is Radius {
  return v === "md" || v === "lg" || v === "xl";
}

function normalizePrefs(rawUiPrefs: any): UiPrefs {
  const base: UiPrefs = { ...DEFAULT_PREFS };

  // ui_prefs might be:
  // - null
  // - an object (jsonb)
  // - a stringified json (older / inconsistent writes)
  const p =
    rawUiPrefs && typeof rawUiPrefs === "object"
      ? rawUiPrefs
      : safeJsonParse(rawUiPrefs) && typeof safeJsonParse(rawUiPrefs) === "object"
      ? safeJsonParse(rawUiPrefs)
      : null;

  if (!p) return base;

  if (isAccent(p.accent)) base.accent = p.accent;
  if (isDensity(p.density)) base.density = p.density;
  if (isRadius(p.radius)) base.radius = p.radius;

  return base;
}

function readLocalPrefs(): UiPrefs | null {
  try {
    // Support both keys (old + new) so you don't brick existing users
    const raw =
      localStorage.getItem("ts_ui_prefs_v1") || localStorage.getItem("ts_theme_prefs") || null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizePrefs(parsed);
  } catch {
    return null;
  }
}

function writeLocalPrefs(prefs: UiPrefs) {
  try {
    localStorage.setItem("ts_ui_prefs_v1", JSON.stringify(prefs));
  } catch {}
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile() as any;
  const profileAny = profile as any;

  const prefs = useMemo(() => {
    // DB prefs win; localStorage is fallback
    const fromDb = normalizePrefs(profileAny?.ui_prefs);
    const fromLocal = readLocalPrefs();

    // If DB has never set prefs (still defaults) but local has something, use local
    // Otherwise prefer DB.
    const dbLooksDefault =
      fromDb.accent === DEFAULT_PREFS.accent &&
      fromDb.density === DEFAULT_PREFS.density &&
      fromDb.radius === DEFAULT_PREFS.radius;

    return dbLooksDefault && fromLocal ? fromLocal : fromDb;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileAny?.id, profileAny?.ui_prefs]);

  useEffect(() => {
    // Apply globally (this is what makes refresh persist)
    document.documentElement.dataset.accent = prefs.accent;
    document.documentElement.dataset.density = prefs.density;
    document.documentElement.dataset.radius = prefs.radius;

    // Keep localStorage aligned (helps before profile loads)
    writeLocalPrefs(prefs);
  }, [prefs.accent, prefs.density, prefs.radius]);

  return <>{children}</>;
}
