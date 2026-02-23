"use client";

import React, { ReactNode, useEffect, useMemo } from "react";
import { useProfile } from "../../lib/useProfile";
import TopNav from "./TopNav";

type Props = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

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

function safePrefs(raw: any): UiPrefs {
  const p = raw?.ui_prefs;
  const base = { ...DEFAULT_PREFS };

  if (!p || typeof p !== "object") return base;

  const a = p.accent as Accent;
  const d = p.density as Density;
  const r = p.radius as Radius;

  if (a === "blue" || a === "indigo" || a === "emerald" || a === "rose" || a === "slate") base.accent = a;
  if (d === "comfortable" || d === "compact") base.density = d;
  if (r === "md" || r === "lg" || r === "xl") base.radius = r;

  return base;
}

function applyPrefs(p: UiPrefs) {
  document.documentElement.dataset.accent = p.accent;
  document.documentElement.dataset.density = p.density;
  document.documentElement.dataset.radius = p.radius;
}

export default function AppShell({ title, subtitle, right, children }: Props) {
  const { profile } = useProfile();

  const prefsFromProfile = useMemo(() => safePrefs(profile), [profile?.id, (profile as any)?.ui_prefs]);

  // 1) Apply localStorage immediately (fast paint after refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_theme_prefs");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      applyPrefs(safePrefs({ ui_prefs: parsed }));
    } catch {}
  }, []);

  // 2) Then apply DB prefs once profile is available
  useEffect(() => {
    applyPrefs(prefsFromProfile);

    // keep localStorage in sync (helps when profile loads later)
    try {
      localStorage.setItem("ts_theme_prefs", JSON.stringify(prefsFromProfile));
    } catch {}
  }, [prefsFromProfile.accent, prefsFromProfile.density, prefsFromProfile.radius]);

  return (
    <div className="appShell">
      <TopNav />
      <div className="container">
        {(title || subtitle || right) && (
          <div className="pageHeader">
            <div>
              {title && <h1 className="pageTitle">{title}</h1>}
              {subtitle && <div className="pageSubtitle">{subtitle}</div>}
            </div>
            {right ? <div className="tsHeaderRight">{right}</div> : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
