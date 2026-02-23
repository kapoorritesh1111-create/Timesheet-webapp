// src/app/settings/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import RequireOnboarding from "../../../components/auth/RequireOnboarding";
import AppShell from "../../../components/layout/AppShell";
import { useProfile } from "../../../lib/useProfile";
import { supabase } from "../../../lib/supabaseBrowser";

export default function MyProfilePage() {
  const { profile, refresh, loading, error } = useProfile() as any;

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile?.id]);

  async function save() {
    if (!profile?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        phone: phone || null,
        address: address || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", profile.id);

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
      <AppShell title="My profile" subtitle="Update your personal details">
        <div className="card cardPad" style={{ maxWidth: 760 }}>
          {loading ? <div className="alert alertInfo">Loading…</div> : null}
          {error ? (
            <div className="alert" style={{ borderColor: "rgba(220,38,38,0.35)" }}>
              {String(error)}
            </div>
          ) : null}

          <div className="tsGrid2" style={{ marginTop: 8 }}>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
                Phone
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
                Avatar URL
              </div>
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
              Address
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              placeholder="Street, City, State, Zip"
            />
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button className="btn btnPrimary" onClick={save} disabled={saving || loading}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
