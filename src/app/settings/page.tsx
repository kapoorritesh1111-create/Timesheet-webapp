import Link from "next/link";
import RequireOnboarding from "../../components/auth/RequireOnboarding";
import AppShell from "../../components/layout/AppShell";

export default function SettingsHome() {
  return (
    <RequireOnboarding>
      <AppShell title="Settings" subtitle="Manage your account and workspace">
        <div className="grid2">
          <div className="card cardPad">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>My profile</div>
            <div className="muted" style={{ marginBottom: 12 }}>
              Update your name, phone, address and avatar.
            </div>
            <Link className="btn" href="/settings/profile">Open</Link>
          </div>

          <div className="card cardPad">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Appearance</div>
            <div className="muted" style={{ marginBottom: 12 }}>
              Accent color, radius and density.
            </div>
            <Link className="btn" href="/settings/appearance">Open</Link>
          </div>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
