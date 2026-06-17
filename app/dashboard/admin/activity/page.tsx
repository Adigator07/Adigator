"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { adminApi } from "@/app/lib/admin-platform/client";
import { useAdminQuery } from "@/app/lib/admin-platform/hooks/useAdminQuery";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

type ActivityEvent = {
  id: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  actionType: string;
  actionLabel: string;
  platform?: string | null;
  createdAt: string;
};

export default function AdminActivityPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, loading, error, refetch } = useAdminQuery(
    () => adminApi.getActivityLogs({
      limit: 200,
      ...(search ? { search } : {}),
      ...(actionFilter ? { action_type: actionFilter } : {}),
    }),
    [search, actionFilter],
  );

  const events = (data?.events || []) as ActivityEvent[];

  const actionTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.actionType));
    return Array.from(set).sort();
  }, [events]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Activity Feed</h1>
          <p className="mt-1 text-sm text-white/40">Real-time platform events from all users.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <Input
                className="pl-9"
                placeholder="Search actions, platforms…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
            >
              <option value="">All action types</option>
              {actionTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-white/40">Loading activity…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-white/40">No activity recorded yet. User actions will appear here as they use the platform.</p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2">Platform</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 text-white/75 hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-white/50">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-white/90">{e.userName || e.userEmail || "Unknown"}</p>
                      {e.userEmail ? <p className="text-xs text-white/40">{e.userEmail}</p> : null}
                    </td>
                    <td className="py-2.5 pr-4">{e.actionLabel}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="default">{e.actionType.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-2.5">{e.platform || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
