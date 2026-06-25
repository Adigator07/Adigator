"use client";

import { orgApi } from "@/app/lib/organization-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function OrganizationActivityPage() {
  const { data: metrics, loading, error } = useAdminQuery(() => orgApi.getDashboard(), []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Activity</h1>
        <p className="mt-1 text-sm text-white/40">
          Platform interactions across your organization — analyses, previews, and downloads.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-white/40">Loading activity…</p>
          ) : !metrics?.recentActivity.length ? (
            <p className="text-sm text-white/40">No activity recorded yet.</p>
          ) : (
            metrics.recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.userName}</p>
                  <p className="text-xs text-white/50">{item.action}{item.feature ? ` · ${item.feature}` : ""}</p>
                </div>
                <p className="text-[10px] text-white/30 whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {metrics ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Creative Analyses", value: metrics.creativeAnalyses },
            { label: "Preview Sessions", value: metrics.previewSessions },
            { label: "Downloads", value: metrics.downloads },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-white/40">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
