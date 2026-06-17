"use client";

import { adminApi } from "@/app/lib/admin-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { ADMIN_FEATURES } from "@/app/lib/admin-platform/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AdminPermissionsPage() {
  const { data, loading, error } = useAdminQuery(() => adminApi.getPermissions(), []);
  const roles = (data?.roles as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Feature Access Management</h1>
        <p className="text-sm text-white/40">Role-based and per-user feature toggles. Edit permissions on individual user profiles.</p>
      </div>

      {loading ? <p className="text-sm text-white/40">Loading roles…</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={String(role.name)}>
            <CardHeader>
              <CardTitle>{String(role.display_name || role.name)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-white/40">Hierarchy: {String(role.hierarchy)}</p>
              <div className="flex flex-wrap gap-2">
                {ADMIN_FEATURES.map((f) => (
                  <span key={f} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60">{f}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && roles.length === 0 ? (
          <p className="text-sm text-white/40">No role definitions found. Run the admin platform migration.</p>
        ) : null}
      </div>
    </div>
  );
}
