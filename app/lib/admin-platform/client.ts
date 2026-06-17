"use client";

import { supabase } from "@/app/lib/supabase";

const API_BASE = "/api/admin/v1";

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export const adminApi = {
  getDashboard: () => adminFetch<import("./types").DashboardMetrics>("/dashboard"),
  getAnalytics: () => adminFetch<import("./types").DashboardMetrics & { avgSessionMinutes: number }>("/analytics"),
  listUsers: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return adminFetch<{ users: import("./types").AdminUser[]; total: number; page: number; totalPages: number }>(
      `/users?${qs}`,
    );
  },
  getUser: (id: string) => adminFetch<Record<string, unknown>>(`/users/${id}`),
  userAction: (id: string, body: Record<string, unknown>) =>
    adminFetch<{ ok: boolean }>(`/users/${id}/actions`, { method: "POST", body: JSON.stringify(body) }),
  getAuditLogs: (limit = 100) => adminFetch<{ logs: import("./types").AuditLogEntry[] }>(`/audit?limit=${limit}`),
  getPermissions: (userId?: string) =>
    adminFetch<Record<string, unknown>>(userId ? `/permissions?userId=${userId}` : "/permissions"),
  getHealth: () => adminFetch<Record<string, unknown>>("/health"),
  getActivityLogs: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return adminFetch<{ events: Array<Record<string, unknown>> }>(
      `/activity${qs ? `?${qs}` : ""}`,
    );
  },
  exportUsersCsv: async () => {
    const token = await getAccessToken();
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/users?format=csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    return res.text();
  },
};

export { getAccessToken };
