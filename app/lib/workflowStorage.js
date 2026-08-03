/**
 * Workflow persistence with a single parse cache and split analysis storage.
 * Keeps Step 2 updates from re-serializing large analysis payloads on every creative change.
 */

const WORKFLOW_STORAGE_KEY = "adigator_workflow_v1";
const ANALYSIS_STORAGE_KEY = "adigator_analysis_result_v1";
const CAMPAIGN_PROGRESS_STORAGE_KEY = "adigator_campaign_progress_v1";

function parseStoredJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

let workflowCache = { raw: null, parsed: null };

function refreshWorkflowCache(raw, parsed) {
  workflowCache = { raw, parsed };
}

/** One-time migration: move embedded analysis out of the workflow blob. */
function migrateEmbeddedAnalysis(workflow) {
  if (!workflow || !Array.isArray(workflow.analysisResult) || workflow.analysisResult.length === 0) {
    return workflow;
  }

  try {
    if (!localStorage.getItem(ANALYSIS_STORAGE_KEY)) {
      localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(workflow.analysisResult));
    }
    const rest = { ...workflow };
    delete rest.analysisResult;
    const json = JSON.stringify(rest);
    localStorage.setItem(WORKFLOW_STORAGE_KEY, json);
    refreshWorkflowCache(json, rest);
    return rest;
  } catch {
    return workflow;
  }
}

export function readStoredWorkflow() {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
  if (workflowCache.raw === raw && workflowCache.parsed) {
    return workflowCache.parsed;
  }

  let parsed = parseStoredJson(raw, {});
  parsed = migrateEmbeddedAnalysis(parsed);
  refreshWorkflowCache(localStorage.getItem(WORKFLOW_STORAGE_KEY), parsed);
  return parsed;
}

export function writeStoredWorkflow(payload) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(payload);
  localStorage.setItem(WORKFLOW_STORAGE_KEY, json);
  refreshWorkflowCache(json, payload);
}

export function readStoredAnalysisResult() {
  if (typeof window === "undefined") return null;

  const dedicated = localStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (dedicated) {
    const parsed = parseStoredJson(dedicated, null);
    return Array.isArray(parsed) ? parsed : null;
  }

  const workflow = readStoredWorkflow();
  return Array.isArray(workflow?.analysisResult) ? workflow.analysisResult : null;
}

export function writeStoredAnalysisResult(analysisResult) {
  if (typeof window === "undefined") return;
  if (!analysisResult) {
    localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    return;
  }
  localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysisResult));
}

/** True when stored analysis entries map 1:1 to the current creative ids. */
export function analysisMatchesCreatives(analysisResult, creatives) {
  if (!Array.isArray(analysisResult) || analysisResult.length === 0) return false;
  if (!Array.isArray(creatives) || creatives.length === 0) return false;
  if (analysisResult.length !== creatives.length) return false;

  const creativeIds = new Set(creatives.map((creative) => creative.id));
  return analysisResult.every(
    (entry) => entry?.creative?.id && creativeIds.has(entry.creative.id),
  );
}

/** Keep analysis rows that still match creatives in the current session. */
export function filterAnalysisForCreatives(analysisResult, creatives) {
  if (!Array.isArray(analysisResult) || !Array.isArray(creatives)) return [];
  const creativeIds = new Set(creatives.map((creative) => creative.id));
  return analysisResult.filter(
    (entry) => entry?.creative?.id && creativeIds.has(entry.creative.id),
  );
}

/** Creatives that do not yet have a matching analysis entry. */
export function getCreativesMissingAnalysis(creatives, analysisResult) {
  if (!Array.isArray(creatives) || creatives.length === 0) return [];
  const analyzedIds = new Set(
    (Array.isArray(analysisResult) ? analysisResult : [])
      .map((entry) => entry?.creative?.id)
      .filter(Boolean),
  );
  return creatives.filter((creative) => creative?.id && !analyzedIds.has(creative.id));
}

/** True when every creative in the list has a matching analysis entry (length may differ). */
export function analysisCoversCreatives(analysisResult, creatives) {
  if (!Array.isArray(creatives) || creatives.length === 0) return false;
  if (!Array.isArray(analysisResult) || analysisResult.length === 0) return false;
  const analyzedIds = new Set(
    analysisResult.map((entry) => entry?.creative?.id).filter(Boolean),
  );
  return creatives.every((creative) => creative?.id && analyzedIds.has(creative.id));
}

/** Clear all persisted workflow and analysis state for a fresh session. */
export function clearStoredWorkflow() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WORKFLOW_STORAGE_KEY);
  localStorage.removeItem(ANALYSIS_STORAGE_KEY);
  refreshWorkflowCache(null, {});
}

function readCampaignProgressMap() {
  if (typeof window === "undefined") return {};
  return parseStoredJson(localStorage.getItem(CAMPAIGN_PROGRESS_STORAGE_KEY), {});
}

function writeCampaignProgressMap(progressMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CAMPAIGN_PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
}

export function readCampaignProgress(campaignId) {
  if (!campaignId) return null;
  const progressMap = readCampaignProgressMap();
  const entry = progressMap[campaignId];
  return entry && typeof entry === "object" ? entry : null;
}

export function persistCampaignProgress(campaignId, payload) {
  if (typeof window === "undefined" || !campaignId) return;

  const progressMap = readCampaignProgressMap();
  const previous = progressMap[campaignId] && typeof progressMap[campaignId] === "object"
    ? progressMap[campaignId]
    : {};

  progressMap[campaignId] = {
    ...previous,
    ...payload,
    lastStep: Math.max(Number(previous.lastStep || 0), Number(payload?.lastStep || 0)),
    updatedAt: new Date().toISOString(),
  };

  writeCampaignProgressMap(progressMap);
}

export { WORKFLOW_STORAGE_KEY, ANALYSIS_STORAGE_KEY, CAMPAIGN_PROGRESS_STORAGE_KEY };
