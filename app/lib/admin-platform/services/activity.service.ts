import type { SupabaseClient } from "@supabase/supabase-js";
import { parseUserAgent } from "../auth";

export async function trackUserActivityEvent(
  supabase: SupabaseClient,
  params: {
    userId: string;
    page?: string;
    action: string;
    feature?: string;
    userAgent?: string | null;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const ua = parseUserAgent(params.userAgent || null);

  await supabase.from("admin_user_activity").insert({
    user_id: params.userId,
    page: params.page || null,
    action: params.action,
    feature: params.feature || null,
    device: ua.device,
    browser: ua.browser,
    ip_address: params.ipAddress || null,
    metadata: params.metadata || {},
  });

  if (params.feature) {
    const { data: existing } = await supabase
      .from("admin_feature_usage")
      .select("id, usage_count")
      .eq("user_id", params.userId)
      .eq("feature_name", params.feature)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("admin_feature_usage")
        .update({ usage_count: existing.usage_count + 1, last_used: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("admin_feature_usage").insert({
        user_id: params.userId,
        feature_name: params.feature,
        usage_count: 1,
      });
    }
  }

  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString(), is_online: true })
    .eq("id", params.userId);
}

export async function recordLoginSession(
  supabase: SupabaseClient,
  params: {
    userId: string;
    userAgent?: string | null;
    ipAddress?: string;
    location?: string;
  },
) {
  const ua = parseUserAgent(params.userAgent || null);
  await supabase.from("admin_user_sessions").insert({
    user_id: params.userId,
    device: ua.device,
    browser: ua.browser,
    os: ua.os,
    ip_address: params.ipAddress || null,
    location: params.location || null,
  });
  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString(), is_online: true })
    .eq("id", params.userId);
}
