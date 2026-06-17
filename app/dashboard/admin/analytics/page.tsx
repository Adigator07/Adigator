"use client";

import { TrendingUp, Users, Clock, Percent } from "lucide-react";
import { adminApi } from "@/app/lib/admin-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { DashboardChartsLazy } from "@/app/components/admin/DashboardChartsLazy";
import { StatCard } from "@/app/components/admin/StatCard";

export default function AdminAnalyticsPage() {
  const { data, loading, error } = useAdminQuery(() => adminApi.getAnalytics(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-300">{error || "Failed to load analytics"}</p>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-white/40">Engagement, retention, and usage trends.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="DAU" value={data.dau} icon={Users} />
        <StatCard label="WAU" value={data.wau} icon={Users} accent="sky" />
        <StatCard label="MAU" value={data.mau} icon={Users} accent="violet" />
        <StatCard label="Retention" value={`${data.retentionRate}%`} sub={`Churn ${data.churnRate}%`} icon={Percent} accent="emerald" />
        <StatCard label="Avg Session" value={`${data.avgSessionMinutes ?? 0}m`} icon={Clock} />
        <StatCard label="Total Users" value={data.totalUsers} icon={TrendingUp} accent="sky" />
      </div>
      <DashboardChartsLazy metrics={data} />
    </div>
  );
}
