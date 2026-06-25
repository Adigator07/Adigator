/**
 * User-facing dashboard analytics from activity logs (local + Supabase).
 */

import { supabase } from "./supabase";
import { LOCAL_ACTIVITY_KEY } from "./supabaseDataService";

function readLocalActivity() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function fetchRemoteActivity(userId, maxRows = 5000) {
  const pageSize = 500;
  const rows = [];
  let offset = 0;

  while (rows.length < maxRows) {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("action_type, action_label, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) break;

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

function dayKey(iso) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function mergeEvents(local, remote) {
  const seen = new Set();
  const merged = [];
  for (const row of [...remote, ...local]) {
    const key = `${row.action_type || row.event_type}-${row.created_at}-${JSON.stringify(row.metadata || {})}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      action_type: row.action_type || row.event_type,
      action_label: row.action_label || row.event_label || "",
      metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
      created_at: row.created_at,
    });
  }
  return merged;
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function inferCreativeValidity(row) {
  if (row?.is_valid === true) return true;
  if (row?.is_valid === false) return false;

  const status = String(row?.validation_status || "").trim().toUpperCase();
  if (!status) return null;
  if (status === "CRITICAL" || status === "FAIL" || status === "FAILED" || status === "INVALID") {
    return false;
  }
  if (status === "PASS" || status === "PASSED" || status === "OK" || status === "VALID" || status === "WARNING") {
    return true;
  }
  return null;
}

function registerCreativeOutcome(validIds, invalidIds, uploadedIds, creativeId, isValid) {
  if (!creativeId) return;
  uploadedIds.add(creativeId);
  if (isValid === true) validIds.add(creativeId);
  if (isValid === false) invalidIds.add(creativeId);
}

export async function fetchUserDashboardAnalytics(userId) {
  const remote = userId ? await fetchRemoteActivity(userId) : [];
  const events = mergeEvents(readLocalActivity(), remote);

  const creativesAnalyzedByDay = {};
  const platformUsage = { google_ads: 0, meta_ads: 0, programmatic: 0 };
  let previewStudioOpens = 0;
  let reportsDownloaded = 0;
  let analyzerRuns = 0;

  const validCreativeIds = new Set();
  const invalidCreativeIds = new Set();
  const uploadedCreativeIds = new Set();
  let uploadedCreativeTotal = 0;
  let uploadedValidTotal = 0;
  let uploadedInvalidTotal = 0;

  for (const ev of events) {
    const type = ev.action_type || "";
    const meta = ev.metadata || {};
    const platform = meta.platform;
    const day = dayKey(ev.created_at);

    if (platform && platformUsage[platform] !== undefined) {
      platformUsage[platform] += 1;
    }

    if (type === "analyzer_usage" && /complete|finished/i.test(meta.phase || meta.action_label || ev.action_label || "")) {
      analyzerRuns += 1;
      if (day) creativesAnalyzedByDay[day] = (creativesAnalyzedByDay[day] || 0) + (meta.creative_count || 1);
    }

    if (type === "page_visit" && (meta.step === 4 || String(meta.action_label || "").includes("step 4"))) {
      previewStudioOpens += 1;
    }
    if (type === "navigation" && meta.to_step === 4) previewStudioOpens += 1;

    if (type === "download" || (type === "generate_action" && /pptx|report/i.test(meta.format || meta.action_label || ""))) {
      reportsDownloaded += 1;
    }

    if (type === "upload") {
      const batchCount = toNumber(meta.count) || toNumber(meta.creative_count);
      const batchValid = toNumber(meta.valid_count);
      const batchInvalid = toNumber(meta.invalid_count);

      if (batchCount > 0) uploadedCreativeTotal += batchCount;
      else if (Array.isArray(meta.creative_names) && meta.creative_names.length > 0) {
        uploadedCreativeTotal += meta.creative_names.length;
      }

      uploadedValidTotal += batchValid;
      uploadedInvalidTotal += batchInvalid;

      const ids = Array.isArray(meta.creative_ids) ? meta.creative_ids : [];
      ids.forEach((id) => uploadedCreativeIds.add(String(id)));

      const outcomes = Array.isArray(meta.creative_outcomes) ? meta.creative_outcomes : [];
      for (const outcome of outcomes) {
        registerCreativeOutcome(
          validCreativeIds,
          invalidCreativeIds,
          uploadedCreativeIds,
          outcome?.id ? String(outcome.id) : null,
          outcome?.is_valid === true ? true : outcome?.is_valid === false ? false : null,
        );
      }

      // Legacy uploads only stored names — synthesize stable keys for per-creative tracking.
      const names = Array.isArray(meta.creative_names) ? meta.creative_names : [];
      const sizes = Array.isArray(meta.sizes) ? meta.sizes : (Array.isArray(meta.ad_sizes) ? meta.ad_sizes : []);
      names.forEach((name, index) => {
        const synthId = `legacy:${String(name)}:${String(sizes[index] || "")}`;
        uploadedCreativeIds.add(synthId);
      });
    }

    if (type === "validation_outcome") {
      const cid = meta.creative_id ? String(meta.creative_id) : null;
      const isValid = meta.is_valid === true || meta.outcome === "pass"
        ? true
        : meta.is_valid === false || meta.outcome === "fail"
          ? false
          : null;
      registerCreativeOutcome(validCreativeIds, invalidCreativeIds, uploadedCreativeIds, cid, isValid);
    }
  }

  const analysisByDay = Object.entries(creativesAnalyzedByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, count }));

  return {
    analysisByDay,
    platformUsage: Object.entries(platformUsage).map(([platform, count]) => ({
      platform: platform.replace(/_/g, " "),
      count,
    })),
    previewStudioOpens,
    reportsDownloaded,
    analyzerRuns,
    validCreativeIds,
    invalidCreativeIds,
    uploadedCreativeIds,
    uploadedCreativeTotal,
    uploadedValidTotal,
    uploadedInvalidTotal,
  };
}

export function computeCreativeCountStats(creatives, activityStats, analyzedCreativeIds = []) {
  const everValid = new Set(activityStats?.validCreativeIds || []);
  const everInvalid = new Set(activityStats?.invalidCreativeIds || []);
  const everUploaded = new Set(activityStats?.uploadedCreativeIds || []);

  let dbValid = 0;
  let dbInvalid = 0;

  for (const creative of creatives) {
    const validity = inferCreativeValidity(creative);
    const id = creative?.id ? String(creative.id) : null;

    if (id) {
      everUploaded.add(id);
      if (validity === true) everValid.add(id);
      if (validity === false) everInvalid.add(id);
    }

    if (validity === true) dbValid += 1;
    if (validity === false) dbInvalid += 1;
  }

  for (const id of analyzedCreativeIds) {
    if (id) everUploaded.add(String(id));
  }

  const activityTotal = toNumber(activityStats?.uploadedCreativeTotal);
  const activityValid = toNumber(activityStats?.uploadedValidTotal);
  const activityInvalid = toNumber(activityStats?.uploadedInvalidTotal);

  const totalCreatives = Math.max(
    creatives.length,
    everUploaded.size,
    activityTotal,
    analyzedCreativeIds.length,
  );

  const validCreatives = Math.max(everValid.size, dbValid, activityValid);
  const invalidCreatives = Math.max(everInvalid.size, dbInvalid, activityInvalid);

  return {
    totalCreatives,
    validCreatives,
    invalidCreatives,
    currentlyValid: dbValid,
    currentlyInvalid: dbInvalid,
  };
}
