// src/lib/useProfile.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseBrowser";

export type Role = "admin" | "manager" | "contractor";

export type Profile = {
  id: string;
  org_id: string | null;
  role: Role;
  full_name: string | null;
  hourly_rate: number | null;
  is_active: boolean | null;
  manager_id: string | null;

  phone: string | null;
  address: string | null;
  avatar_url: string | null;

  // ✅ important for Step 5
  ui_prefs: any | null;

  onboarding_completed_at: string | null;
};

async function fetchMyProfile(uid: string) {
  return await supabase
    .from("profiles")
    .select(
      [
        "id",
        "org_id",
        "role",
        "full_name",
        "hourly_rate",
        "is_active",
        "manager_id",
        "phone",
        "address",
        "avatar_url",
        "ui_prefs",
        "onboarding_completed_at",
      ].join(", ")
    )
    .eq("id", uid)
    .maybeSingle();
}

export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string>("");

  const hydrate = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();

      if (sessErr) {
        setUserId(null);
        setProfile(null);
        setError(`Auth session error: ${sessErr.message}`);
        return;
      }

      const uid = sessionData.session?.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setProfile(null);
        return;
      }

      const { data: prof, error: profErr } = await fetchMyProfile(uid);

      if (profErr) {
        setProfile(null);
        setError(`Profile query error: ${profErr.message}`);
        return;
      }

      if (!prof) {
        setProfile(null);
        setError(
          "Profile missing: no row found in `profiles` for this user. An admin must create it (or enable auto-create trigger)."
        );
        return;
      }

      setProfile(prof as any);
    } catch (e: any) {
      setUserId(null);
      setProfile(null);
      setError(e?.message ? String(e.message) : "Unexpected profile hydration error.");
    } finally {
      // ✅ critical: never leave the app stuck blank
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await hydrate();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      if (cancelled) return;
      await hydrate();
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, [hydrate]);

  const refresh = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  return { loading, userId, profile, error, refresh };
}
