// src/app/profiles/page.tsx
"use client";

import RequireOnboarding from "../../components/auth/RequireOnboarding";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import { supabase } from "../../lib/supabaseBrowser";
import { useProfile } from "../../lib/useProfile";

type Role = "admin" | "manager" | "contractor";
type ActiveFilter = "all" | "active" | "inactive";
type ScopeFilter = "visible" | "all_org";

type ProfileRow = {
  id: string;
  org_id: string;
  role: Role;
  full_name: string | null;
  hourly_rate: number | null;
  is_active: boolean | null;
  manager_id: string | null;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function tag(text: string, kind?: "ok" | "warn" | "muted") {
  const cls = kind === "ok" ? "tag tagOk" : kind === "warn" ? "tag tagWarn" : "tag";
  return <span className={cls}>{text}</span>;
}

function roleLabel(r: Role) {
  if (r === "admin") return "Admin";
  if (r === "manager") return "Manager";
  return "Contractor";
}

function safeName(r: ProfileRow) {
  return (r.full_name || "").trim() || "(no name)";
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function ProfilesInner() {
  const router = useRouter();
  const { loading: profLoading, profile, userId, error: profErr } = useProfile();

  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState<string>("");

  // UI filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [scope, setScope] = useState<ScopeFilter>("visible");

  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";
  const isManagerOrAdmin = isAdmin || isManager;

  const visibleRows = useMemo(() => {
    if (!profile) return [];
    if (!isManagerOrAdmin) return rows.filter((r) => r.id === profile.id);

    // Manager: only team; Admin: org
    if (isAdmin) return rows;

    // manager: show only those assigned to them (manager_id == profile.id) plus self
    return rows.filter((r) => r.id === profile.id || r.manager_id === profile.id);
  }, [rows, profile, isManagerOrAdmin, isAdmin]);

  const filteredRows = useMemo(() => {
    const query = normalize(q);
    const source = scope === "all_org" && isAdmin ? rows : visibleRows;

    return source.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;

      const active = r.is_active !== false;
      if (activeFilter === "active" && !active) return false;
      if (activeFilter === "inactive" && active) return false;

      if (!query) return true;
      const hay = `${safeName(r)} ${r.role} ${r.id}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rows, visibleRows, q, roleFilter, activeFilter, scope, isAdmin]);

  async function loadRows() {
    if (!profile?.org_id) return;
    setMsg("");

    // Admin sees all; manager sees all in org but UI filters; RLS may limit anyway
    const { data, error } = await supabase
      .from("profiles")
      .select("id, org_id, role, full_name, hourly_rate, is_active, manager_id")
      .eq("org_id", profile.org_id)
      .order("full_name", { ascending: true });

    if (error) {
      setMsg(error.message);
      return;
    }

    setRows((data || []) as any);
  }

  useEffect(() => {
    if (profLoading) return;

    if (!userId) return;

    if (!profile) {
      setMsg(profErr || "Profile not loaded");
      return;
    }

    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profLoading, userId, profile?.id]);

  async function saveRow(id: string, patch: Partial<ProfileRow>) {
    if (!profile) return;

    setBusyId(id);
    setMsg("");

    try {
      const { error } = await supabase.from("profiles").update(patch).eq("id", id).eq("org_id", profile.org_id);

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Saved ✅");
    } finally {
      setBusyId("");
    }
  }

  if (profLoading) return <AppShell title="People" subtitle="Loading…" />;

  if (!userId) {
    return (
      <AppShell title="People" subtitle="Please log in.">
        <div className="card cardPad" style={{ marginTop: 12 }}>
          <div className="muted" style={{ marginBottom: 8 }}>Please log in.</div>
          <button className="btnPrimary" onClick={() => router.push("/login")}>
            Go to Login
          </button>
        </div>
      </AppShell>
    );
  }

  const subtitle = isAdmin ? "Admin view (org users)" : isManager ? "Manager view (your team)" : "Your profile";

  const headerRight = (
    <div className="prfHeaderRight">
      <button className="btnPrimary" onClick={() => router.push("/settings/profile")} title="Edit your own profile">
        Edit my profile
      </button>
    </div>
  );

  return (
    <AppShell title="People" subtitle={subtitle} headerRight={headerRight}>
      {msg ? (
        <div className="alert alertInfo">
          <b>Status</b>
          <div style={{ marginTop: 6 }}>{msg}</div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="card cardPad" style={{ marginTop: 12 }}>
        <div className="prfToolbar">
          <div className="prfLeft">
            <div className="prfField">
              <div className="prfLabel">Role</div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}>
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>

            <div className="prfField">
              <div className="prfLabel">Active</div>
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}>
                <option value="all">All</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            {isAdmin ? (
              <div className="prfField">
                <div className="prfLabel">Scope</div>
                <select value={scope} onChange={(e) => setScope(e.target.value as ScopeFilter)}>
                  <option value="visible">Visible</option>
                  <option value="all_org">All org</option>
                </select>
              </div>
            ) : null}

            <div className="prfSearch">
              <div className="prfLabel">Search</div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID" />
            </div>
          </div>

          <div className="prfRight">
            <button onClick={loadRows}>Refresh</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="prfList" style={{ marginTop: 12 }}>
        {filteredRows.map((r) => {
          const canEditRow =
            isAdmin ||
            (isManager && r.id === profile?.id) ||
            (isManager && r.manager_id === profile?.id) ||
            (!isManagerOrAdmin && r.id === profile?.id);

          const saving = busyId === r.id;
          const active = r.is_active !== false;

          return (
            <div key={r.id} className={`prfRow ${active ? "" : "prfRowInactive"}`}>
              <div className="prfRowTop">
                <div className="prfRowName">
                  <div className="prfAvatar">{safeName(r).slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="prfNameLine">
                      <span className="prfNameText">{safeName(r)}</span>
                      {tag(roleLabel(r.role))}
                      {active ? tag("Active", "ok") : tag("Inactive", "warn")}
                    </div>
                    <div className="prfRowMeta muted">
                      <span
                        className="mono"
                        style={{ cursor: "copy" }}
                        onClick={() => copyToClipboard(r.id)}
                        title="Click to copy ID"
                      >
                        {r.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prfRowActions">
                  {isAdmin ? (
                    <button
                      onClick={() => router.push(`/projects?user=${encodeURIComponent(r.id)}`)}
                      title="Assign projects for this user"
                    >
                      Manage projects
                    </button>
                  ) : null}

                  <button
                    className="btnPrimary"
                    disabled={!canEditRow || saving}
                    onClick={() =>
                      saveRow(r.id, {
                        full_name: r.full_name || null,
                        role: r.role,
                        manager_id: r.manager_id,
                        hourly_rate: Number(r.hourly_rate ?? 0),
                        is_active: r.is_active !== false,
                      })
                    }
                    title="Save changes"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div className="prfGrid">
                <div>
                  <div className="prfLabel">Full name</div>
                  <input
                    value={r.full_name ?? ""}
                    disabled={!canEditRow}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, full_name: e.target.value } : x)))
                    }
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <div className="prfLabel">Role</div>
                  <select
                    value={r.role}
                    disabled={!isAdmin || saving}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, role: e.target.value as Role } : x)))
                    }
                    title={!isAdmin ? "Only Admin can change roles" : ""}
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="contractor">contractor</option>
                  </select>
                </div>

                <div>
                  <div className="prfLabel">Hourly rate</div>
                  <input
                    type="number"
                    value={Number(r.hourly_rate ?? 0)}
                    disabled={!isAdmin || saving}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, hourly_rate: Number(e.target.value || 0) } : x
                        )
                      )
                    }
                    title={!isAdmin ? "Only Admin can change rate" : ""}
                  />
                </div>

                <div>
                  <div className="prfLabel">Manager ID</div>
                  <input
                    value={r.manager_id ?? ""}
                    disabled={!isAdmin || saving}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, manager_id: e.target.value || null } : x)))
                    }
                    placeholder="Manager UUID"
                    title={!isAdmin ? "Only Admin can change manager assignment" : ""}
                  />
                </div>

                <div>
                  <div className="prfLabel">Active</div>
                  <select
                    value={active ? "yes" : "no"}
                    disabled={!isAdmin || saving}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) => (x.id === r.id ? { ...x, is_active: e.target.value === "yes" } : x))
                      )
                    }
                    title={!isAdmin ? "Only Admin can deactivate users" : ""}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <div className="prfLabel">Notes</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    For personal edits (phone/address/avatar), use <b>Settings → My profile</b>.
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

export default function ProfilesPage() {
  return (
    <RequireOnboarding>
      <ProfilesInner />
    </RequireOnboarding>
  );
}
