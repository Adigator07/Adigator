/**
 * Admin-only activity log access for the future Admin Dashboard.
 * Regular users cannot list activity logs — tracking still runs via trackUserActivity().
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityLogRow = {
  id: string;
  user_id: string;
  action_type: string;
  action_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminActivityQuery = {
  limit?: number;
  userId?: string | null;
  actionType?: string | null;
  since?: string | null;
};

function clampLimit(limit?: number) {
  const n = Number(limit ?? 50);
  if (!Number.isFinite(n)) return 50;
  return Math.min(Math.max(Math.floor(n), 1), 500);
}

/** Server-side query against activity_logs (caller must enforce admin auth). */
export async function queryActivityLogs(
  supabase: SupabaseClient,
  query: AdminActivityQuery = {},
): Promise<{ data: ActivityLogRow[]; error: string | null }> {
  const limit = clampLimit(query.limit);

  let dbQuery = supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query.userId) dbQuery = dbQuery.eq("user_id", query.userId);
  if (query.actionType) dbQuery = dbQuery.eq("action_type", query.actionType);
  if (query.since) dbQuery = dbQuery.gte("created_at", query.since);

  const { data, error } = await dbQuery;

  if (error) return { data: [], error: error.message };
  return { data: (data || []) as ActivityLogRow[], error: null };
}

/** Normalized row for admin UI tables (future Admin Dashboard). */
export function formatActivityLogForAdmin(row: ActivityLogRow) {
  const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const creativeNames = Array.isArray(meta.creative_names) ? meta.creative_names : [];
  return {
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type,
    actionLabel: row.action_label || row.action_type.replace(/_/g, " "),
    platform: typeof meta.platform === "string" ? meta.platform : null,
    campaignGoal: typeof meta.campaign_goal === "string"
      ? meta.campaign_goal
      : typeof meta.goal === "string"
        ? meta.goal
        : null,
    creativeName: typeof meta.creative_name === "string"
      ? meta.creative_name
      : typeof creativeNames[0] === "string"
        ? creativeNames[0]
        : null,
    metadata: meta,
    createdAt: row.created_at,
  };
}
