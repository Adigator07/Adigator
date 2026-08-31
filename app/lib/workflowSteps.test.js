import { describe, expect, it } from "vitest";

import {
  TOTAL_WORKFLOW_STEPS,
  getWorkflowStepLabel,
  getWorkflowStepSlug,
  resolveWorkflowStep,
} from "./workflowSteps";

describe("workflowSteps", () => {
  it("inserts Campaign Details immediately after Platform Setup", () => {
    expect(TOTAL_WORKFLOW_STEPS).toBe(4);
    expect(getWorkflowStepLabel(1)).toBe("Platform Setup");
    expect(getWorkflowStepLabel(2)).toBe("Campaign Details");
    expect(getWorkflowStepSlug(2)).toBe("campaign-details");
  });

  it("resolves the previous creative-validation slug to Campaign Details", () => {
    expect(resolveWorkflowStep("creative-validation")).toBe(2);
    expect(resolveWorkflowStep("campaign-details")).toBe(2);
    expect(resolveWorkflowStep("2")).toBe(2);
  });
});
