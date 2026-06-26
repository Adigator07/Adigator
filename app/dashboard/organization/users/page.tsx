"use client";

import { useCallback, useEffect, useState } from "react";
import { orgApi } from "@/app/lib/organization-platform/client";
import type { OrganizationMember } from "@/app/lib/organization-platform/types";
import { orgMemberRoleLabel } from "@/app/lib/organization-platform/types";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function OrganizationUsersPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orgApi.listMembers();
      setMembers(res.members);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Users & Permissions</h1>
        <p className="mt-1 text-sm text-white/40">
          View organization members, their teams, and access levels.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Organization Members</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Team</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-white/40">Loading members…</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-white/40">No members in this organization yet.</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{member.fullName || member.email}</p>
                      <p className="text-xs text-white/40">{member.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-white/70">{member.teamName || "None"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="default">{orgMemberRoleLabel(member.memberRole)}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={member.status === "active" ? "success" : "warning"}>
                        {member.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
