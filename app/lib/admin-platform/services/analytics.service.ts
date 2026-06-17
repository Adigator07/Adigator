import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardMetrics } from "../types";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function getDashboardMetrics(supabase: SupabaseClient): Promise<DashboardMetrics> {
  const todayStart = startOfDay();
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);

  const [
    totalUsersRes,
    onlineRes,
    dauRes,
    wauRes,
    mauRes,
    activityRes,
    sessionsRes,
    usageRes,
    growthRes,
    countryRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_online", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", todayStart),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", weekStart),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", monthStart),
    supabase
      .from("admin_user_activity")
      .select("user_id, page, feature, device, browser, timestamp")
      .gte("timestamp", monthStart)
      .order("timestamp", { ascending: false })
      .limit(1500),
    supabase
      .from("admin_user_sessions")
      .select("duration, login_time, device, browser")
      .gte("login_time", monthStart)
      .order("login_time", { ascending: false })
      .limit(1500),
    supabase.from("admin_feature_usage").select("feature_name, usage_count").order("usage_count", { ascending: false }).limit(10),
    supabase.from("profiles").select("created_at").gte("created_at", daysAgo(90)).order("created_at"),
    supabase.from("profiles").select("country").not("country", "is", null).limit(2000),
  ]);

  const activities = activityRes.data || [];
  const sessions = sessionsRes.data || [];
  const totalUsers = totalUsersRes.count ?? 0;

  const activeToday = new Set(
    activities.filter((a) => a.timestamp >= todayStart).map((a) => a.user_id),
  ).size;
  const activeWeek = new Set(
    activities.filter((a) => a.timestamp >= weekStart).map((a) => a.user_id),
  ).size;
  const activeMonth = new Set(activities.map((a) => a.user_id)).size;

  const dau = Math.max(dauRes.count ?? 0, activeToday);
  const wau = Math.max(wauRes.count ?? 0, activeWeek);
  const mau = Math.max(mauRes.count ?? 0, activeMonth);

  const durations = sessions.map((s) => s.duration).filter((d): d is number => typeof d === "number" && d > 0);
  const avgDurationSeconds = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const hourCounts = new Array(24).fill(0);
  sessions.forEach((s) => {
    const h = new Date(s.login_time).getHours();
    hourCounts[h] += 1;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourValue = Math.max(...hourCounts);

  const pageCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = { Android: 0, iPhone: 0, Desktop: 0, Tablet: 0 };
  const browserCounts: Record<string, number> = { Chrome: 0, Firefox: 0, Safari: 0, Edge: 0, Unknown: 0 };
  const countryCounts: Record<string, number> = {};

  activities.forEach((a) => {
    if (a.page) pageCounts[a.page] = (pageCounts[a.page] || 0) + 1;
    if (a.device && deviceCounts[a.device] !== undefined) deviceCounts[a.device] += 1;
    else if (a.device) deviceCounts[a.device] = (deviceCounts[a.device] || 0) + 1;
    if (a.browser) {
      const b = browserCounts[a.browser] !== undefined ? a.browser : "Unknown";
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    }
  });

  (countryRes.data || []).forEach((p) => {
    const c = p.country || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });

  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([page, count]) => ({ page, count }));

  const topFeatures = (usageRes.data || []).map((r) => ({
    feature: r.feature_name,
    count: r.usage_count,
  }));

  const growthMap: Record<string, number> = {};
  (growthRes.data || []).forEach((p) => {
    const d = new Date(p.created_at).toISOString().slice(0, 10);
    growthMap[d] = (growthMap[d] || 0) + 1;
  });
  let cumulative = Math.max(0, totalUsers - (growthRes.data?.length || 0));
  const userGrowth = Object.entries(growthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      cumulative += count;
      return { date, count: cumulative };
    });

  const retentionRate = totalUsers > 0 ? Math.round((mau / totalUsers) * 100) : 0;
  const churnRate = Math.max(0, 100 - retentionRate);

  return {
    totalUsers,
    activeUsers: { today: dau, week: wau, month: mau },
    onlineUsers: onlineRes.count ?? 0,
    sessions: {
      avgDurationSeconds,
      peakHour: peakHourValue > 0 ? peakHour : null,
    },
    dau,
    wau,
    mau,
    retentionRate,
    churnRate,
    topFeatures,
    topPages,
    deviceBreakdown: deviceCounts,
    browserBreakdown: browserCounts,
    countryBreakdown: countryCounts,
    userGrowth,
  };
}

export async function getAnalyticsExtended(supabase: SupabaseClient) {
  const metrics = await getDashboardMetrics(supabase);
  return {
    ...metrics,
    avgSessionMinutes: Math.round(metrics.sessions.avgDurationSeconds / 60),
  };
}
