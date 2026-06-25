"use client";

import { Activity, Clock, TrendingUp, Users, Wifi } from "lucide-react";
import { adminApi } from "@/app/lib/admin-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { StatCard } from "@/app/components/admin/StatCard";
import { DashboardChartsLazy } from "@/app/components/admin/DashboardChartsLazy";
import { RealtimePresence } from "@/app/components/admin/RealtimePresenceLazy";

export default function AdminOverviewPage() {
  const { data: metrics, loading, error } = useAdminQuery(() => adminApi.getDashboard(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error || "Failed to load metrics. Apply the admin migration and set SUPABASE_SERVICE_ROLE_KEY."}
      </div>
    );
  }

  const avgMin = Math.round(metrics.sessions.avgDurationSeconds / 60);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Super Admin Overview</h1>
        <p className="mt-1 text-sm text-white/40">Platform-wide visibility into organizations, users, activity, and health.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={metrics.totalUsers} icon={Users} accent="amber" />
        <StatCard label="Online Now" value={metrics.onlineUsers} icon={Wifi} accent="emerald" />
        <StatCard
          label="Active Users"
          value={metrics.activeUsers.today}
          sub={`${metrics.activeUsers.week} weekly · ${metrics.activeUsers.month} monthly`}
          icon={Activity}
          accent="sky"
        />
        <StatCard label="DAU / MAU" value={`${metrics.dau}/${metrics.mau}`} sub={`Retention ${metrics.retentionRate}%`} icon={TrendingUp} accent="violet" />
        <StatCard
          label="Avg Session"
          value={`${avgMin}m`}
          sub={metrics.sessions.peakHour != null ? `Peak hour: ${metrics.sessions.peakHour}:00` : "No session data"}
          icon={Clock}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DashboardChartsLazy metrics={metrics} />
        </div>
        <RealtimePresence />
      </div>
    </div>
  );
}
