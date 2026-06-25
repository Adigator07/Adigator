"use client";

import { supabase } from "@/app/lib/supabase";

const API_BASE = "/api/organization/v1";

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function orgFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const orgApi = {
  getDashboard: () => orgFetch<import("./types").OrgDashboardMetrics>("/dashboard"),
  listTeams: () => orgFetch<{ teams: import("./types").Team[] }>("/teams"),
  createTeam: (body: { name: string; description?: string }) =>
    orgFetch<{ team: import("./types").Team }>("/teams", { method: "POST", body: JSON.stringify(body) }),
  listMembers: () => orgFetch<{ members: import("./types").OrganizationMember[] }>("/members"),
  updateMember: (memberId: string, body: Record<string, unknown>) =>
    orgFetch<{ ok: boolean }>(`/members/${memberId}`, { method: "PATCH", body: JSON.stringify(body) }),
  getMembership: () =>
    orgFetch<{
      organizationId: string;
      organizationName: string;
      memberRole: import("./types").OrgMemberRole;
      isOrgAdmin: boolean;
    } | null>("/membership"),
};
