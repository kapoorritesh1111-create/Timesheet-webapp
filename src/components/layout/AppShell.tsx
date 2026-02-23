"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseBrowser";
import { useProfile } from "../../lib/useProfile";

type Props = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

function initials(name?: string) {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "U";
}

export default function AppShell({ title, subtitle, right, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile() as any;

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = profile?.role === "admin";
  const fullName = profile?.full_name || "User";
  const role = profile?.role || "user";

  const navItems = useMemo(() => {
    // IMPORTANT: Payroll route fix — use /reports/payroll (not /payroll)
    return [
      { label: "Home", href: "/dashboard" },
      { label: "My work", href: "/timesheet" },
      { label: "Approvals", href: "/approvals", hideIf: (r: string) => r === "contractor" },
      { label: "Projects", href: "/projects" },
      { label: "People", href: "/profiles", hideIf: (r: string) => r === "contractor" },
      { label: "Payroll", href: "/reports/payroll", hideIf: (r: string) => r === "contractor" },
    ].filter(i => !i.hideIf?.(role));
  }, [role]);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function go(href: string) {
    setMobileOpen(false);
    router.push(href);
  }

  // close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  // close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mwShellTop appShell">
      {/* Top bar */}
      <div className="mwTopInner">
        <div className="mwBrand" onClick={() => go("/dashboard")} style={{ cursor: "pointer" }}>
          <div className="mwBrandDot" />
          <div className="mwBrandName">Timesheet</div>
        </div>

        <div className="mwTopRight" ref={menuRef}>
          {/* Mobile menu button */}
          <button className="mwHamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            ☰
          </button>

          {/* Profile */}
          <button className="mwProfileBtn" onClick={() => setMenuOpen(v => !v)}>
            <span className="mwAvatar">{initials(fullName)}</span>
            <span className="mwProfileMeta">
              <span className="mwProfileName">{fullName}</span>
              <span className="mwProfileRole">{role}</span>
            </span>
            <span className="mwChevron">▾</span>
          </button>

          {menuOpen && (
            <div className="mwMenu">
              <div className="mwMenuSection">
                <div className="mwMenuTitle">Account</div>

                <div className="mwMenuItem" onClick={() => go("/settings/profile")}>
                  My profile
                </div>

                <div className="mwMenuItem" onClick={() => go("/settings/appearance")}>
                  Change theme
                </div>

                {isAdmin && (
                  <div className="mwMenuItem" onClick={() => go("/admin")}>
                    Admin
                  </div>
                )}

                <div className="mwMenuDivider" />

                <div className="mwMenuTitle">Navigate</div>
                {navItems.map(i => (
                  <div
                    key={i.href}
                    className={`mwMenuItem ${isActive(i.href) ? "mwMenuItemActive" : ""}`}
                    onClick={() => go(i.href)}
                  >
                    {i.label}
                  </div>
                ))}

                <div className="mwMenuDivider" />

                <div className="mwMenuItem mwDanger" onClick={signOut}>
                  Log out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="mwSidebar">
        <div className="mwSideSection">
          {navItems.map(i => (
            <div
              key={i.href}
              className={`mwSideItem ${isActive(i.href) ? "mwSideItemActive" : ""}`}
              onClick={() => go(i.href)}
              role="button"
              tabIndex={0}
            >
              {i.label}
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mwDrawerOverlay" onClick={() => setMobileOpen(false)}>
          <div className="mwDrawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="mwBrand" onClick={() => go("/dashboard")} style={{ cursor: "pointer" }}>
                <div className="mwBrandDot" />
                <div className="mwBrandName">Timesheet</div>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                ✕
              </button>
            </div>

            <div className="mwSideSection">
              {navItems.map(i => (
                <div
                  key={i.href}
                  className={`mwSideItem ${isActive(i.href) ? "mwSideItemActive" : ""}`}
                  onClick={() => go(i.href)}
                  role="button"
                  tabIndex={0}
                >
                  {i.label}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="mwMenuTitle">Account</div>
              <div className="mwSideSection">
                <div className="mwSideItem" onClick={() => go("/settings/profile")}>My profile</div>
                <div className="mwSideItem" onClick={() => go("/settings/appearance")}>Change theme</div>
                {isAdmin && <div className="mwSideItem" onClick={() => go("/admin")}>Admin</div>}
                <div className="mwSideItem" onClick={signOut} style={{ color: "var(--danger)" }}>Log out</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container">
        {(title || subtitle || right) && (
          <div className="pageHeader">
            <div>
              {title && <h1 className="pageTitle">{title}</h1>}
              {subtitle && <div className="pageSubtitle">{subtitle}</div>}
            </div>
            {right ? <div>{right}</div> : null}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
