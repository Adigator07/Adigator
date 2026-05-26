/**
 * Workflow persistence with a single parse cache and split analysis storage.
 * Keeps Step 2 updates from re-serializing large analysis payloads on every creative change.
 */

const WORKFLOW_STORAGE_KEY = "adigator_workflow_v1";
const ANALYSIS_STORAGE_KEY = "adigator_analysis_result_v1";

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
    const { analysisResult: _removed, ...rest } = workflow;
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

export { WORKFLOW_STORAGE_KEY, ANALYSIS_STORAGE_KEY };
