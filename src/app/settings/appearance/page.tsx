"use client";

import { useEffect, useMemo, useState } from "react";
import RequireOnboarding from "../../../components/auth/RequireOnboarding";
import AppShell from "../../../components/layout/AppShell";
import { useProfile } from "../../../lib/useProfile";
import { supabase } from "../../../lib/supabaseBrowser";

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

function isAccent(v: unknown): v is Accent {
  return v === "blue" || v === "indigo" || v === "emerald" || v === "rose" || v === "slate";
}
function isDensity(v: unknown): v is Density {
  return v === "comfortable" || v === "compact";
}
function isRadius(v: unknown): v is Radius {
  return v === "md" || v === "lg" || v === "xl";
}

function normalizePrefs(raw: any): UiPrefs {
  const base: UiPrefs = { ...DEFAULT_PREFS };
  if (!raw) return base;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return base;
    }
  }

  if (typeof raw !== "object") return base;

  if (isAccent(raw.accent)) base.accent = raw.accent;
  if (isDensity(raw.density)) base.density = raw.density;
  if (isRadius(raw.radius)) base.radius = raw.radius;

  return base;
}

function readLocalPrefs(): UiPrefs | null {
  try {
    const v = localStorage.getItem("ts_theme_prefs");
    if (!v) return null;
    return normalizePrefs(v);
  } catch {
    return null;
  }
}

export default function AppearanceSettingsPage() {
  const { profile, refresh } = useProfile() as any;
  const profileAny = profile as any;

  // Prefer DB prefs if available, otherwise localStorage, otherwise defaults.
  const initialPrefs = useMemo(() => {
    const fromDb = normalizePrefs(profileAny?.ui_prefs);
    // If DB prefs are still defaults and we have localStorage, use local for initial render.
    // (Prevents “saved but not applied” feeling during hydration.)
    const local = typeof window !== "undefined" ? readLocalPrefs() : null;
    return profileAny?.ui_prefs ? fromDb : (local ?? fromDb);
  }, [profileAny?.id, profileAny?.ui_prefs]);

  const [accent, setAccent] = useState<Accent>(DEFAULT_PREFS.accent);
  const [density, setDensity] = useState<Density>(DEFAULT_PREFS.density);
  const [radius, setRadius] = useState<Radius>(DEFAULT_PREFS.radius);
  const [saving, setSaving] = useState(false);

  // Sync state when initialPrefs changes (DB or local)
  useEffect(() => {
    setAccent(initialPrefs.accent);
    setDensity(initialPrefs.density);
    setRadius(initialPrefs.radius);
  }, [initialPrefs.accent, initialPrefs.density, initialPrefs.radius]);

  // Apply immediately to DOM + persist locally for instant refresh behavior
  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    document.documentElement.dataset.density = density;
    document.documentElement.dataset.radius = radius;

    try {
      localStorage.setItem("ts_theme_prefs", JSON.stringify({ accent, density, radius }));
    } catch {}
  }, [accent, density, radius]);

  async function save() {
    if (!profileAny?.id) return;
    setSaving(true);

    const ui_prefs: UiPrefs = { accent, density, radius };

    const { error } = await supabase
      .from("profiles")
      .update({ ui_prefs })
      .eq("id", profileAny.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    // refresh profile so ThemeProvider picks up DB changes too
    await refresh?.();
    alert("Saved.");
  }

  return (
    <RequireOnboarding>
      <AppShell title="Appearance" subtitle="Customize how Timesheet looks for you">
        <div className="card cardPad" style={{ maxWidth: 720 }}>
          <div className="muted" style={{ marginBottom: 10 }}>
            These settings are per-user. (Admins can enforce org policies later.)
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Accent
              </div>
              <select value={accent} onChange={(e) => setAccent(e.target.value as Accent)}>
                <option value="blue">Blue</option>
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
                <option value="slate">Slate</option>
              </select>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Density
              </div>
              <select value={density} onChange={(e) => setDensity(e.target.value as Density)}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              Corner radius
            </div>
            <select value={radius} onChange={(e) => setRadius(e.target.value as Radius)}>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button className="btn btnPrimary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Tip: if saving fails for contractors, apply the Step 5 SQL trigger patch to allow <code>ui_prefs</code>.
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
