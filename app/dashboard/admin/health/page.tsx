"use client";

import { adminApi } from "@/app/lib/admin-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AdminHealthPage() {
  const { data: health, loading, error } = useAdminQuery(() => adminApi.getHealth(), []);

  if (loading) {
    return <p className="text-white/40">Running health checks…</p>;
  }

  if (error || !health) {
    return <p className="text-red-300">{error || "Health check failed"}</p>;
  }

  const db = health.database as { status: string; latencyMs: number };
  const redis = health.redis as { status: string; connected: boolean };
  const server = health.server as { memoryUsageMb: number };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white">System Health</h1>
          <p className="mt-1 text-sm text-white/40">Database, cache, and server diagnostics.</p>
        </div>
        <Badge variant={health.status === "healthy" ? "success" : "warning"}>{String(health.status)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Database</CardTitle></CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>Status: {db?.status}</p>
            <p>Latency: {db?.latencyMs}ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Redis</CardTitle></CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>Status: {redis?.status}</p>
            <p>Connected: {String(redis?.connected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Server</CardTitle></CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>Memory: {server?.memoryUsageMb} MB</p>
            <p>Uptime: {Math.floor(Number(health.uptimeSeconds) / 3600)}h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Errors</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {((health.recentErrors as Array<Record<string, unknown>>) || []).length === 0 ? (
            <p className="text-sm text-white/40">No recent errors recorded.</p>
          ) : (
            ((health.recentErrors as Array<Record<string, unknown>>) || []).map((e) => (
              <div key={String(e.id)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm">
                <p className="text-red-200">{String(e.message)}</p>
                <p className="text-xs text-white/40">{String(e.service)} · {String(e.severity)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
