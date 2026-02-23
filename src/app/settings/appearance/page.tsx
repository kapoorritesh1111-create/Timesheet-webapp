"use client";

import { useEffect, useMemo, useState } from "react";
import RequireOnboarding from "../../../components/auth/RequireOnboarding";
import AppShell from "../../../components/layout/AppShell";
import { useProfile } from "../../../lib/useProfile";
import { supabase } from "../../../lib/supabaseBrowser";

// Keep types narrow so UI stays consistent.
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

// Safely read ui_prefs from profile (could be null / stringly-typed JSON)
function readPrefs(raw: any): UiPrefs {
  const base: UiPrefs = { ...DEFAULT_PREFS };
  const p = raw?.ui_prefs;

  if (!p || typeof p !== "object") return base;

  if (isAccent(p.accent)) base.accent = p.accent;
  if (isDensity(p.density)) base.density = p.density;
  if (isRadius(p.radius)) base.radius = p.radius;

  return base;
}

export default function AppearanceSettingsPage() {
  const { profile, refresh } = useProfile() as any;
  const profileAny = profile as any;

  const initialPrefs = useMemo(() => readPrefs(profileAny), [profileAny?.ui_prefs]);

  const [accent, setAccent] = useState<Accent>(DEFAULT_PREFS.accent);
  const [density, setDensity] = useState<Density>(DEFAULT_PREFS.density);
  const [radius, setRadius] = useState<Radius>(DEFAULT_PREFS.radius);
  const [saving, setSaving] = useState(false);

  // ✅ Always sync state from latest profile prefs
  useEffect(() => {
    setAccent(initialPrefs.accent);
    setDensity(initialPrefs.density);
    setRadius(initialPrefs.radius);
  }, [initialPrefs.accent, initialPrefs.density, initialPrefs.radius]);

  // Optional: Apply visual effects immediately (CSS hooks)
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

    const { error } = await supabase.from("profiles").update({ ui_prefs }).eq("id", profileAny.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    await refresh?.();
    alert("Saved.");
  }

  return (
    <RequireOnboarding>
      <AppShell title="Appearance" subtitle="Customize how Timesheet looks for you">
        <div className="card cardPad" style={{ maxWidth: 720 }}>
          <div className="muted" style={{ marginBottom: 10 }}>
            These settings are per-user.
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
            <button className="btnPrimary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            If changes don’t persist after refresh, it means the app shell isn’t applying prefs globally yet — Step 5B fixes
            that.
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
