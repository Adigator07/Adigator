"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Loader2, Shield } from "lucide-react";
import { fetchAdminActivityLogs, isCurrentUserAdmin } from "../../lib/admin/activityAdminClient";

/**
 * Admin Dashboard shell — activity history and platform analytics will expand here.
 * Route: /dashboard/admin (admin role only)
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      const isAdmin = await isCurrentUserAdmin();
      if (!active) return;

      if (!isAdmin) {
        router.replace("/dashboard");
        return;
      }

      setReady(true);

      try {
        const rows = await fetchAdminActivityLogs({ limit: 100 });
        if (active) setEvents(rows);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load activity");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-white/40">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
          <Shield size={22} className="text-amber-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80">Admin Dashboard</p>
          <h1 className="text-3xl font-extrabold text-white">Platform Activity</h1>
          <p className="mt-1 text-sm text-white/40">
            Background activity tracking for all users. More admin tools will be added here.
          </p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={16} className="text-amber-300" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Activity History</h2>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/40">Loading activity logs...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">{error}</div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/40">
            No activity recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/40">
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Platform</th>
                    <th className="px-4 py-3 font-semibold">Goal</th>
                    <th className="px-4 py-3 font-semibold">Creative</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-white/5 text-white/80">
                      <td className="whitespace-nowrap px-4 py-3">{new Date(event.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/50">{event.userId?.slice(0, 8)}…</td>
                      <td className="px-4 py-3">{event.actionLabel}</td>
                      <td className="px-4 py-3">{event.platform || "—"}</td>
                      <td className="px-4 py-3">{event.campaignGoal || "—"}</td>
                      <td className="px-4 py-3">{event.creativeName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
