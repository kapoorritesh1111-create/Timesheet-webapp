"use client";

import { useEffect, useState } from "react";
import RequireOnboarding from "../../../components/auth/RequireOnboarding";
import AppShell from "../../../components/layout/AppShell";
import { useProfile } from "../../../lib/useProfile";
import { supabase } from "../../../lib/supabaseBrowser";

export default function ProfileSettingsPage() {
  const { profile, refresh } = useProfile() as any;
  const [full_name, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar_url, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile?.id]);

  async function save() {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, phone, address, avatar_url })
      .eq("id", profile.id);

    setSaving(false);
    if (error) return alert(error.message);
    await refresh?.();
    alert("Saved.");
  }

  return (
    <RequireOnboarding>
      <AppShell title="My profile" subtitle="Update your personal details">
        <div className="card cardPad" style={{ maxWidth: 720 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Full name</div>
              <input value={full_name} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Phone</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Address</div>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Avatar URL</div>
            <input value={avatar_url} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button className="btn btnPrimary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
