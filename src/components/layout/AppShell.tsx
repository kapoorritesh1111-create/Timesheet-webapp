"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useProfile } from "../../lib/useProfile";
import TopNav from "./TopNav";

type UiPrefsAny = {
  accent?: string;
  density?: string;
  radius?: string;
};

export default function AppShell({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const { profile } = useProfile() as any;
  const prefs: UiPrefsAny = (profile?.ui_prefs && typeof profile.ui_prefs === "object" ? profile.ui_prefs : {}) as UiPrefsAny;

  const applied = useMemo(() => {
    const safe = {
      accent: typeof prefs.accent === "string" ? prefs.accent : "",
      density: typeof prefs.density === "string" ? prefs.density : "",
      radius: typeof prefs.radius === "string" ? prefs.radius : "",
    };
    return safe;
  }, [prefs.accent, prefs.density, prefs.radius]);

  // ✅ Apply user prefs globally (every page)
  useEffect(() => {
    const root = document.documentElement;

    // If profile prefs exist, prefer them.
    if (applied.accent) root.dataset.accent = applied.accent;
    if (applied.density) root.dataset.density = applied.density;
    if (applied.radius) root.dataset.radius = applied.radius;

    // If profile is not loaded / has no prefs, fall back to localStorage draft (optional)
    if (!applied.accent || !applied.density || !applied.radius) {
      try {
        const raw = localStorage.getItem("ts_theme_prefs");
        if (raw) {
          const v = JSON.parse(raw);
          if (!applied.accent && typeof v.accent === "string") root.dataset.accent = v.accent;
          if (!applied.density && typeof v.density === "string") root.dataset.density = v.density;
          if (!applied.radius && typeof v.radius === "string") root.dataset.radius = v.radius;
        }
      } catch {
        // ignore
      }
    }
  }, [applied.accent, applied.density, applied.radius]);

  return (
    <div className="appShell">
      <TopNav />
      <div className="container">
        {(title || subtitle || right) && (
          <div className="pageHeader">
            <div>
              {title ? <h1 className="pageTitle">{title}</h1> : null}
              {subtitle ? <div className="pageSubtitle">{subtitle}</div> : null}
            </div>
            {right ? <div>{right}</div> : null}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
