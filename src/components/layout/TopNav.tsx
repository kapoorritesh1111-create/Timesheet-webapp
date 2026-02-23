// src/components/layout/TopNav.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseBrowser";
import { useProfile } from "../../lib/useProfile";

function initials(name?: string | null) {
  const s = (name || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

type NavItem = { href: string; label: string };

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();

  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";

  const nav: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { href: "/dashboard", label: "Home" },
      { href: "/timesheet", label: "My work" },
      { href: "/projects", label: "Projects" },
    ];

    // People + Payroll are typically manager/admin surfaces
    if (isAdmin || isManager) items.push({ href: "/profiles", label: "People" });
    if (isAdmin || isManager) items.push({ href: "/payroll", label: "Payroll" });

    items.push({ href: "/settings/appearance", label: "Settings" });

    // Admin console if you already have it
    if (isAdmin) items.push({ href: "/admin", label: "Admin" });

    return items;
  }, [isAdmin, isManager]);

  async function logout() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="mwShellTop">
      <div className="mwTopInner">
        <div className="mwBrand">
          <span className="mwBrandDot" />
          <span className="mwBrandName">Timesheet</span>
        </div>

        <div className="mwTopRight">
          <button className="mwProfileBtn" onClick={() => setMenuOpen((v) => !v)}>
            <span className="mwAvatar">{initials(profile?.full_name)}</span>
            <span className="mwProfileMeta">
              <span className="mwProfileName">{profile?.full_name || "Account"}</span>
              <span className="mwProfileRole">{profile?.role || ""}</span>
            </span>
            <span className="mwChevron">▾</span>
          </button>

          {menuOpen && (
            <div className="mwMenu" onMouseLeave={() => setMenuOpen(false)}>
              <div className="mwMenuSection">
                <div className="mwMenuTitle">Account</div>
                <Link className="mwMenuItem" href="/settings/profile" onClick={() => setMenuOpen(false)}>
                  My profile
                </Link>
                <Link className="mwMenuItem" href="/settings/appearance" onClick={() => setMenuOpen(false)}>
                  Change theme
                </Link>
              </div>

              <div className="mwMenuDivider" />

              <div className="mwMenuSection">
                <div className="mwMenuTitle">Navigate</div>
                {nav.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={"mwMenuItem " + (pathname?.startsWith(i.href) ? "mwMenuItemActive" : "")}
                    onClick={() => setMenuOpen(false)}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>

              <div className="mwMenuDivider" />

              <button className="mwMenuItem mwDanger" onClick={logout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar (monday-like) */}
      <div className="mwSidebar">
        <div className="mwSideSection">
          {nav.map((i) => {
            const active = pathname?.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} className={"mwSideItem " + (active ? "mwSideItemActive" : "")}>
                {i.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
