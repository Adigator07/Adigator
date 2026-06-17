"use client";

import { adminApi } from "@/app/lib/admin-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import type { AuditLogEntry } from "@/app/lib/admin-platform/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AdminAuditPage() {
  const { data, loading, error } = useAdminQuery(() => adminApi.getAuditLogs(200), []);
  const logs = (data?.logs || []) as AuditLogEntry[];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-white/40">Immutable trail of admin actions on the platform.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Admin actions trail</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-white/40">Loading audit logs…</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-white/90">{log.description}</p>
              <p className="mt-1 text-xs text-white/40">
                {new Date(log.timestamp).toLocaleString()} · {log.adminName} · {log.action}
                {log.ipAddress ? ` · ${log.ipAddress}` : ""}
              </p>
            </div>
          ))}
          {!loading && logs.length === 0 ? (
            <p className="text-sm text-white/40">No audit entries yet. Actions like user suspend/ban will appear here.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
