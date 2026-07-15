/**
 * Canonical Preview Tool / Campaign Intelligence Studio workflow steps.
 * Numeric and slug step params are both accepted for backwards compatibility.
 */

export const WORKFLOW_STEPS = [
  { id: 1, slug: "campaign-setup", label: "Campaign Setup" },
  { id: 2, slug: "creative-validation", label: "Creative Validation" },
  { id: 3, slug: "campaign-intelligence", label: "Campaign Intelligence" },
  { id: 4, slug: "preview-studio", label: "Preview Studio" },
];

export const TOTAL_WORKFLOW_STEPS = WORKFLOW_STEPS.length;

export function clampWorkflowStep(value) {
  const numeric = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(numeric, 1), TOTAL_WORKFLOW_STEPS);
}

export function resolveWorkflowStep(param) {
  if (param == null || param === "") return 1;
  const normalized = String(param).trim().toLowerCase();
  const bySlug = WORKFLOW_STEPS.find((step) => step.slug === normalized);
  if (bySlug) return bySlug.id;
  return clampWorkflowStep(normalized);
}

export function getWorkflowStepSlug(stepId) {
  const step = WORKFLOW_STEPS.find((entry) => entry.id === Number(stepId));
  return step?.slug || "campaign-setup";
}

export function getWorkflowStepLabel(stepId) {
  const step = WORKFLOW_STEPS.find((entry) => entry.id === Number(stepId));
  return step?.label || "Campaign Setup";
}

/** Build a path with the human-readable step slug in the query string. */
export function buildWorkflowStepHref(pathname = "/preview-tool", stepId = 1, extraParams = {}) {
  const params = new URLSearchParams();
  params.set("step", getWorkflowStepSlug(stepId));
  Object.entries(extraParams || {}).forEach(([key, value]) => {
    if (value == null || value === "") return;
    params.set(key, String(value));
  });
  return `${pathname}?${params.toString()}`;
}
