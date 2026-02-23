// src/app/settings/appearance/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RequireOnboarding from "../../../components/auth/RequireOnboarding";
import AppShell from "../../../components/layout/AppShell";
import { useProfile } from "../../../lib/useProfile";
import { supabase } from "../../../lib/supabaseBrowser";
import type { ThemePrefs, Density } from "../../../components/theme/ThemeProvider";

function safeParse(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { loading, userId, profile } = useProfile();
  const profileAny = profile as any;

  const initialPrefs = useMemo(() => {
    const fromProfile = (profileAny?.ui_prefs as ThemePrefs | undefined) || null;
    const fromLocal = safeParse(localStorage.getItem("ts_theme_prefs")) as ThemePrefs | null;

    const merged = {
      accent: fromProfile?.accent || fromLocal?.accent || "#2563eb",
      radius: clamp(Number(fromProfile?.radius ?? fromLocal?.radius ?? 12), 6, 20),
      density: ((fromProfile?.density || fromLocal?.density || "comfortable") as Density) === "compact" ? "compact" : "comfortable",
    };

    return merged;
  }, [profileAny?.id]);

  const [accent, setAccent] = useState("#2563eb");
  const [radius, setRadius] = useState(12);
  const [density, setDensity] = useState<Density>("comfortable");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setAccent(initialPrefs.accent);
    setRadius(initialPrefs.radius);
    setDensity(initialPrefs.density);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileAny?.id]);

  async function save() {
    const next: ThemePrefs = {
      accent,
      radius,
      density,
    };

    setSaving(true);
    setMsg("");

    // 1) Apply immediately (ThemeProvider reads localStorage + sets CSS vars)
    localStorage.setItem("ts_theme_prefs", JSON.stringify(next));

    // 2) Persist to profile (so it follows the user across devices)
    if (userId) {
      const { error } = await supabase.from("profiles").update({ ui_prefs: next }).eq("id", userId);
      if (error) {
        setSaving(false);
        setMsg(error.message);
        return;
      }
    }

    setSaving(false);

    // Reload to ensure ThemeProvider re-applies everywhere consistently
    window.location.reload();
  }

  async function reset() {
    localStorage.removeItem("ts_theme_prefs");

    setAccent("#2563eb");
    setRadius(12);
    setDensity("comfortable");

    // Optional: also reset server-stored prefs
    if (userId) {
      await supabase.from("profiles").update({ ui_prefs: null }).eq("id", userId);
    }

    window.location.reload();
  }

  if (loading) {
    return (
      <RequireOnboarding>
        <AppShell title="Appearance" subtitle="Theme settings for your account">
          <div className="card cardPad">Loading…</div>
        </AppShell>
      </RequireOnboarding>
    );
  }

  return (
    <RequireOnboarding>
      <AppShell title="Appearance" subtitle="Theme settings for your account">
        {msg ? (
          <div className="alert alertInfo">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg}</pre>
          </div>
        ) : null}

        <div className="card cardPad" style={{ maxWidth: 760, marginTop: 14 }}>
          <div className="tsGrid2">
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Accent color
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  style={{ width: 56, height: 40, padding: 0, border: "none", background: "transparent" }}
                  aria-label="Accent color"
                />
                <input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#2563eb" />
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Corner radius ({radius}px)
              </div>
              <input
                type="range"
                min={6}
                max={20}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              Density
            </div>
            <select value={density} onChange={(e) => setDensity(e.target.value as Density)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button className="btnPrimary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="pill" onClick={reset} disabled={saving}>
              Reset
            </button>
            <button className="pill" onClick={() => router.push("/settings")}>
              Back
            </button>
          </div>

          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            Your theme is stored per-user (local + profile). If saving fails for contractors, apply Step 5 DB fix.
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
