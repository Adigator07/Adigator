/**
 * Supabase data layer for creatives, analyzer results, and activity logs.
 * All writes are scoped to the authenticated user via RLS (auth.uid()).
 */

import { supabase } from "./supabase";
import { getCreativeFullBlob } from "./creativeAssetStore";
import { formatSupabaseError, getSupabaseErrorMessage, isSchemaUnavailableError } from "./supabaseErrors";

const CREATIVE_BUCKET = "creative-assets";
const ACTIVITY_DEDUPE_MS = 2500;
const recentActivityKeys = new Map();
let schemaWarned = false;

function warnSchemaOnce(message) {
  if (schemaWarned) return;
  schemaWarned = true;
  console.warn(
    `[Adigator] Database tables not ready (${message}). Run supabase/FIX_DATABASE.sql in the Supabase SQL Editor.`,
  );
}

export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return user;
}

export async function getActivityAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

function sanitizeFileName(name) {
  return String(name || "creative")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120) || "creative";
}

async function uploadCreativeFile(userId, localCreativeId, blob, fileName) {
  const safeName = sanitizeFileName(fileName);
  const path = `${userId}/${localCreativeId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CREATIVE_BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });

  if (uploadError) {
    console.warn("[Adigator] Creative upload failed:", uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from(CREATIVE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

function buildCreativeType(creative, platform) {
  const mime = String(creative.mimeType || "image").toLowerCase();
  const size = creative.size ? `_${creative.size}` : "";
  const platformKey = platform ? `_${platform}` : "";
  return `${mime}${size}${platformKey}`;
}

function buildActivityMetadata(payload = {}) {
  const {
    metadata = {},
    platform,
    campaign_goal,
    vertical,
    creative_name,
    creative_size,
    step,
    ...rest
  } = payload;

  return {
    ...metadata,
    ...(platform != null ? { platform } : {}),
    ...(campaign_goal != null ? { campaign_goal } : {}),
    ...(vertical != null ? { vertical } : {}),
    ...(creative_name != null ? { creative_name } : {}),
    ...(creative_size != null ? { creative_size } : {}),
    ...(typeof step === "number" ? { step } : {}),
    ...rest,
  };
}

function normalizeActivityRow(row) {
  if (!row || typeof row !== "object") return row;
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    ...row,
    event_type: row.action_type || row.event_type,
    event_label: row.action_label || row.event_type || row.action_type,
    platform: metadata.platform ?? row.platform ?? null,
    campaign_goal: metadata.campaign_goal ?? row.campaign_goal ?? null,
    vertical: metadata.vertical ?? row.vertical ?? null,
    creative_name: metadata.creative_name ?? row.creative_name ?? null,
    creative_size: metadata.creative_size ?? row.creative_size ?? null,
    step: metadata.step ?? row.step ?? null,
    metadata,
  };
}

function shouldSkipDuplicateActivity(dedupeKey) {
  if (!dedupeKey) return false;
  const now = Date.now();
  const last = recentActivityKeys.get(dedupeKey);
  if (last && now - last < ACTIVITY_DEDUPE_MS) return true;
  recentActivityKeys.set(dedupeKey, now);

  if (recentActivityKeys.size > 200) {
    for (const [key, ts] of recentActivityKeys) {
      if (now - ts > ACTIVITY_DEDUPE_MS * 4) recentActivityKeys.delete(key);
    }
  }

  return false;
}

/**
 * Persist creative upload details to `creatives`.
 * Returns Supabase row id as `supabaseCreativeId` for linking analyzer results.
 */
export async function saveCreative({ creative, platform, supabaseCreativeId = null }) {
  if (!creative?.name) {
    return { data: null, error: new Error("Creative name is required."), skipped: false };
  }

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    return { data: null, error, skipped: true };
  }

  if (!user) {
    return { data: null, error: null, skipped: true };
  }

  let fileUrl = null;
  try {
    const blob = await getCreativeFullBlob(creative.id);
    if (blob) {
      fileUrl = await uploadCreativeFile(
        user.id,
        creative.id,
        blob,
        creative.originalFile || `${creative.name}.jpg`,
      );
    }
  } catch (error) {
    console.warn("[Adigator] Could not resolve creative blob for upload:", error);
  }

  const row = {
    creative_name: creative.name,
    creative_type: buildCreativeType(creative, platform),
    file_url: fileUrl,
  };

  const token = await getActivityAccessToken();
  if (!token) {
    return { data: null, error: null, skipped: true };
  }

  try {
    const response = await fetch("/api/creatives", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: supabaseCreativeId,
        ...row,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (payload.skipped || payload.schemaUnavailable || isSchemaUnavailableError(payload.error)) {
      warnSchemaOnce(payload.error || "creatives table missing");
      return { data: null, error: null, skipped: true, schemaUnavailable: true };
    }

    if (!response.ok || !payload.success) {
      const normalized = formatSupabaseError(payload.error || "Failed to save creative");
      return { data: null, error: normalized, skipped: false };
    }

    return {
      data: payload.data,
      error: null,
      skipped: false,
      supabaseCreativeId: payload.data?.id || supabaseCreativeId,
    };
  } catch (error) {
    if (isSchemaUnavailableError(error)) {
      warnSchemaOnce(getSupabaseErrorMessage(error));
      return { data: null, error: null, skipped: true, schemaUnavailable: true };
    }
    return { data: null, error: formatSupabaseError(error), skipped: false };
  }
}

export async function deleteCreativeRecord(supabaseCreativeId) {
  if (!supabaseCreativeId) return { error: null, skipped: true };

  try {
    const user = await getAuthenticatedUser();
    if (!user) return { error: null, skipped: true };

    const { error } = await supabase
      .from("creatives")
      .delete()
      .eq("id", supabaseCreativeId)
      .eq("user_id", user.id);

    return { error: error || null, skipped: false };
  } catch (error) {
    return { error, skipped: false };
  }
}

/**
 * Persist analyzer output to `analyzer_results`.
 */
export async function saveAnalyzerResult({ creativeId, platform, goal, resultJson }) {
  if (!creativeId || !platform || !goal) {
    return { data: null, error: new Error("creativeId, platform, and goal are required."), skipped: false };
  }

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    return { data: null, error, skipped: true };
  }

  if (!user) {
    return { data: null, error: null, skipped: true };
  }

  const payload = {
    user_id: user.id,
    creative_id: creativeId,
    platform,
    goal,
    result_json: resultJson && typeof resultJson === "object" ? resultJson : {},
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("analyzer_results")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) {
        warnSchemaOnce(error.message);
        return { data: null, error: null, skipped: true, schemaUnavailable: true };
      }
      return { data: null, error: error || null, skipped: false };
    }

    return { data, error: null, skipped: false };
  } catch (error) {
    if (isSchemaUnavailableError(error)) {
      warnSchemaOnce(getSupabaseErrorMessage(error));
      return { data: null, error: null, skipped: true, schemaUnavailable: true };
    }
    return { data: null, error, skipped: false };
  }
}

/**
 * Track user activity in `activity_logs` with optional deduplication.
 */
export async function trackUserActivity(actionType, payload = {}, options = {}) {
  const normalizedType = String(actionType || "").trim();
  if (!normalizedType) {
    return { data: null, error: new Error("actionType is required."), skipped: false };
  }

  const actionLabel = String(
    payload.action_label || payload.event_label || normalizedType.replace(/_/g, " "),
  ).trim();

  const metadata = buildActivityMetadata(payload);
  const dedupeKey = options.dedupeKey
    ?? `${normalizedType}:${metadata.step ?? ""}:${metadata.platform ?? ""}:${actionLabel}`;

  if (shouldSkipDuplicateActivity(dedupeKey)) {
    return { data: null, error: null, skipped: true, deduped: true };
  }

  const token = await getActivityAccessToken();

  if (token) {
    try {
      const response = await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: normalizedType,
          action_label: actionLabel,
          metadata,
        }),
      });

      if (response.ok) {
        const body = await response.json();
        return { data: normalizeActivityRow(body.event), error: null, skipped: false };
      }

      const body = await response.json().catch(() => ({}));
      console.warn("[Adigator] Activity log API failed:", body.error || response.statusText);
    } catch (error) {
      console.warn("[Adigator] Activity log request failed:", error);
    }
  }

  return writeLocalActivity({
    action_type: normalizedType,
    action_label: actionLabel,
    metadata,
    created_at: new Date().toISOString(),
  });
}

export const LOCAL_ACTIVITY_KEY = "adigator_local_activity_v1";

function readLocalActivity() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalActivity(event) {
  const normalized = normalizeActivityRow({
    ...event,
    id: `local-${Date.now()}`,
    source: "local",
  });

  if (typeof window !== "undefined") {
    try {
      const local = readLocalActivity();
      local.unshift(normalized);
      localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(local.slice(0, 200)));
    } catch {
      // ignore quota errors
    }
  }

  return { data: normalized, error: null, skipped: false };
}

export async function fetchActivityLogs(_limit = 50) {
  if (typeof console !== "undefined") {
    console.warn(
      "[Adigator] fetchActivityLogs is admin-only. Activity is still tracked in the background.",
    );
  }
  return [];
}

export async function fetchUserCreatives() {
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) return [];

  const { data, error } = await supabase
    .from("creatives")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.warn("[Adigator] Failed to fetch creatives:", error.message);
    return [];
  }

  return data || [];
}

export async function fetchAnalyzerResultCreativeIds() {
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) return [];

  const { data, error } = await supabase
    .from("analyzer_results")
    .select("creative_id")
    .eq("user_id", user.id);

  if (error) {
    console.warn("[Adigator] Failed to fetch analyzer results:", error.message);
    return [];
  }

  return (data || []).map((row) => row.creative_id).filter(Boolean);
}

export async function countActivityByTypes(_actionTypes = []) {
  // Aggregate reads from activity_logs are admin-only after RLS hardening.
  // Dashboard stats should use creatives / analyzer_results instead.
  return 0;
}
