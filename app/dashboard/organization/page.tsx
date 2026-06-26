"use client";

import { Activity, BarChart3, Download, Eye, Users, UsersRound } from "lucide-react";
import { orgApi } from "@/app/lib/organization-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { StatCard } from "@/app/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function OrganizationOverviewPage() {
  const { data: metrics, loading, error } = useAdminQuery(() => orgApi.getDashboard(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error || "Failed to load organization dashboard. Apply the organizations migration in Supabase."}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">{metrics.organization.name}</h1>
        <p className="mt-1 text-sm text-white/40">
          Organization dashboard: teams, usage, creative activity, and member engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teams" value={metrics.totalTeams} icon={UsersRound} accent="sky" />
        <StatCard
          label="Members"
          value={metrics.totalMembers}
          sub={`${metrics.activeMembersWeek} active this week`}
          icon={Users}
          accent="emerald"
        />
        <StatCard label="Creative Analyses" value={metrics.creativeAnalyses} icon={BarChart3} accent="violet" />
        <StatCard label="Downloads" value={metrics.downloads} icon={Download} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.recentActivity.length === 0 ? (
              <p className="text-sm text-white/40">No activity recorded yet for this organization.</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Team Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.teamBreakdown.map((team) => (
              <div key={team.teamId || "unassigned"} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{team.teamName}</span>
                <span className="font-semibold text-white">{team.memberCount}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity size={18} className="text-sky-400" />
            Feature Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.usageByFeature.length === 0 ? (
            <p className="text-sm text-white/40">Usage data will appear as your teams use the platform.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.usageByFeature.map((item) => (
                <div key={item.feature} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sky-300">
                    <Eye size={14} />
                    <span className="text-xs uppercase tracking-wider">{item.feature}</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{item.count}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
