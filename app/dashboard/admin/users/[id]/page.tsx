"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminApi } from "@/app/lib/admin-platform/client";
import { ADMIN_FEATURES } from "@/app/lib/admin-platform/types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = String(params.id);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [d, p] = await Promise.all([
        adminApi.getUser(userId),
        adminApi.getPermissions(userId),
      ]);
      setDetail(d);
      setPermissions((p as { permissions?: Record<string, boolean> }).permissions || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    }
  };

  useEffect(() => { void load(); }, [userId]);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!detail) return <p className="text-white/40">Loading profile…</p>;

  const user = detail.user as Record<string, unknown>;
  const activities = (detail.activities as Array<Record<string, unknown>>) || [];
  const sessions = (detail.sessions as Array<Record<string, unknown>>) || [];
  const featureUsage = (detail.featureUsage as Array<Record<string, unknown>>) || [];
  const deviceHistory = (detail.deviceHistory as string[]) || [];

  const togglePermission = async (feature: string, enabled: boolean) => {
    const next = { ...permissions, [feature]: enabled };
    setPermissions(next);
    await adminApi.userAction(userId, { action: "permissions", permissions: next });
  };

  return (
    <div className="space-y-6 pb-10">
      <Link href="/dashboard/admin/users" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} /> Back to users
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{String(user.fullName || user.email)}</h1>
          <p className="text-sm text-white/40">{String(user.email)}</p>
        </div>
        <Badge variant={user.status === "active" ? "success" : "warning"}>{String(user.status)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-white/70">
            <p><span className="text-white/40">Phone:</span> {String(user.phone || "—")}</p>
            <p><span className="text-white/40">Country:</span> {String(user.country || "—")}</p>
            <p><span className="text-white/40">Role:</span> {String(user.adminRole || user.role)}</p>
            <p><span className="text-white/40">Last login:</span> {user.lastLoginAt ? new Date(String(user.lastLoginAt)).toLocaleString() : "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Feature Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ADMIN_FEATURES.map((f) => (
              <label key={f} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
                <span className="text-white/80">{f}</span>
                <input
                  type="checkbox"
                  checked={Boolean(permissions[f])}
                  onChange={(e) => togglePermission(f, e.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {activities.slice(0, 20).map((a) => (
            <div key={String(a.id)} className="flex gap-3 text-sm">
              <span className="whitespace-nowrap text-white/40">{new Date(String(a.timestamp)).toLocaleTimeString()}</span>
              <span className="text-white/80">{String(a.action)}{a.page ? ` · ${String(a.page)}` : ""}</span>
            </div>
          ))}
          {activities.length === 0 ? <p className="text-sm text-white/40">No activity recorded.</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {sessions.slice(0, 10).map((s) => (
              <div key={String(s.id)} className="rounded-lg border border-white/10 px-3 py-2">
                <p className="text-white/80">{new Date(String(s.login_time)).toLocaleString()}</p>
                <p className="text-xs text-white/40">{String(s.device || "—")} · {String(s.browser || "—")} · {String(s.ip_address || "—")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Feature Usage & Devices</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {featureUsage.map((f) => (
              <div key={String(f.id)} className="flex justify-between text-white/80">
                <span>{String(f.feature_name)}</span>
                <span className="text-amber-300">{String(f.usage_count)}×</span>
              </div>
            ))}
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-white/40">Device history</p>
            {deviceHistory.slice(0, 8).map((d) => (
              <p key={d} className="text-white/60">{d}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => adminApi.userAction(userId, { action: "reset_password", email: user.email })}>Reset Password</Button>
        <Button variant="destructive" onClick={() => adminApi.userAction(userId, { action: "delete" }).then(() => window.location.href = "/dashboard/admin/users")}>Delete User</Button>
      </div>
    </div>
  );
}
