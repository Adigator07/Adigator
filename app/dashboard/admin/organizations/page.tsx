"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Users, UsersRound } from "lucide-react";
import { adminApi } from "@/app/lib/admin-platform/client";
import type { Organization, PlatformOrgMetrics } from "@/app/lib/organization-platform/types";
import { useAdminAuth } from "@/app/lib/admin-platform/AdminAuthContext";
import { StatCard } from "@/app/components/admin/StatCard";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AdminOrganizationsPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [metrics, setMetrics] = useState<PlatformOrgMetrics | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrganizations();
      setMetrics(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await adminApi.createOrganization({
        name: name.trim(),
        slug: slug.trim() || undefined,
        ownerUserId: ownerUserId.trim() || undefined,
      });
      setName("");
      setSlug("");
      setOwnerUserId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Organizations</h1>
        <p className="mt-1 text-sm text-white/40">
          Super Admin view: monitor all companies, teams, and members across the platform.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      ) : null}

      {metrics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Organizations" value={metrics.totalOrganizations} icon={Building2} accent="amber" />
          <StatCard label="Active Orgs" value={metrics.activeOrganizations} icon={Building2} accent="emerald" />
          <StatCard label="Total Teams" value={metrics.totalTeams} icon={UsersRound} accent="sky" />
          <StatCard label="Org Members" value={metrics.totalOrgMembers} icon={Users} accent="violet" />
        </div>
      ) : null}

      {isSuperAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Create Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-4">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" />
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (optional)" />
              <Input
                value={ownerUserId}
                onChange={(e) => setOwnerUserId(e.target.value)}
                placeholder="Owner user ID (optional)"
              />
              <Button type="submit" disabled={saving || !name.trim()}>
                <Plus size={16} className="mr-1" />
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-white">All Organizations</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="pb-3 pr-4 font-medium">Organization</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Teams</th>
                <th className="pb-3 pr-4 font-medium">Members</th>
                <th className="pb-3 pr-4 font-medium">Plan</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">Loading organizations…</td>
                </tr>
              ) : !metrics?.organizations.length ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">
                    No organizations yet.{isSuperAdmin ? " Create one above to get started." : ""}
                  </td>
                </tr>
              ) : (
                metrics.organizations.map((org: Organization) => (
                  <tr key={org.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{org.name}</p>
                      <p className="text-xs text-white/40">{org.slug}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={org.status === "active" ? "success" : "warning"}>{org.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-white/70">{org.teamCount ?? 0}</td>
                    <td className="py-3 pr-4 text-white/70">{org.memberCount ?? 0}</td>
                    <td className="py-3 pr-4 text-white/70">{org.plan}</td>
                    <td className="py-3 text-white/50">{new Date(org.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-white/30">
        Organization admins manage their teams at{" "}
        <Link href="/dashboard/organization" className="text-sky-400 hover:underline">
          /dashboard/organization
        </Link>
        .
      </p>
    </div>
  );
}
