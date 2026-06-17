import type { SupabaseClient } from "@supabase/supabase-js";
import { formatActivityLogForAdmin, queryActivityLogs } from "@/app/lib/admin/activityAdmin";

export type ActivityListQuery = {
  limit?: number;
  userId?: string | null;
  actionType?: string | null;
  since?: string | null;
  search?: string | null;
};

export async function listActivityLogsForAdmin(
  supabase: SupabaseClient,
  query: ActivityListQuery = {},
) {
  const { data, error } = await queryActivityLogs(supabase, {
    limit: query.limit,
    userId: query.userId,
    actionType: query.actionType,
    since: query.since,
  });

  if (error) return { events: [], error };

  let events = data.map(formatActivityLogForAdmin);

  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    events = events.filter(
      (e) =>
        e.actionLabel.toLowerCase().includes(q)
        || e.actionType.toLowerCase().includes(q)
        || (e.platform && e.platform.toLowerCase().includes(q)),
    );
  }

  const userIds = [...new Set(events.map((e) => e.userId))];
  const profileMap = new Map<string, { email: string; fullName: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds.slice(0, 100));

    (profiles || []).forEach((p) => {
      profileMap.set(p.id, { email: p.email, fullName: p.full_name });
    });
  }

  return {
    events: events.map((e) => ({
      ...e,
      userEmail: profileMap.get(e.userId)?.email || null,
      userName: profileMap.get(e.userId)?.fullName || null,
    })),
    error: null,
  };
}
