// src/app/settings/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireOnboarding from "../../../components/auth/RequireOnboarding";
import AppShell from "../../../components/layout/AppShell";
import { useProfile } from "../../../lib/useProfile";
import { supabase } from "../../../lib/supabaseBrowser";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { loading, userId, profile, error } = useProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile?.id]);

  async function save() {
    if (!userId) return;

    setSaving(true);
    setMsg("");

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", userId);

    setSaving(false);

    if (upErr) {
      setMsg(upErr.message);
      return;
    }

    // simplest reliable refresh since useProfile() doesn't expose refresh()
    window.location.reload();
  }

  if (loading) {
    return (
      <RequireOnboarding>
        <AppShell title="My profile" subtitle="Update your personal details">
          <div className="card cardPad">Loading…</div>
        </AppShell>
      </RequireOnboarding>
    );
  }

  if (!userId) {
    return (
      <RequireOnboarding>
        <AppShell title="My profile" subtitle="Update your personal details">
          <div className="card cardPad">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Please log in.</div>
            <button className="btnPrimary" onClick={() => router.push("/login")}>
              Go to Login
            </button>
          </div>
        </AppShell>
      </RequireOnboarding>
    );
  }

  if (!profile) {
    return (
      <RequireOnboarding>
        <AppShell title="My profile" subtitle="Update your personal details">
          <div className="alert alertWarn">
            <div style={{ fontWeight: 900 }}>Profile could not be loaded.</div>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{error || "No details."}</pre>
          </div>
        </AppShell>
      </RequireOnboarding>
    );
  }

  return (
    <RequireOnboarding>
      <AppShell title="My profile" subtitle="Update your personal details">
        {msg ? (
          <div className="alert alertInfo">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg}</pre>
          </div>
        ) : null}

        <div className="card cardPad" style={{ maxWidth: 760, marginTop: 14 }}>
          <div className="tsGrid2">
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Full name
              </div>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Phone
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              Address
            </div>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              Avatar URL
            </div>
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button className="btnPrimary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="pill" onClick={() => router.push("/settings")}>
              Back
            </button>
          </div>

          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            Note: Some fields may be restricted by role security rules.
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
