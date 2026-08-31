import { describe, expect, it } from "vitest";

import { diffHealthIssues, evaluateCampaignHealth } from "@/app/lib/campaignHealth/engine";
import type { CampaignHealthSnapshot } from "@/app/lib/campaignHealth/types";

function snapshot(overrides: Partial<CampaignHealthSnapshot> = {}): CampaignHealthSnapshot {
  return {
    campaignId: "1001",
    campaignName: "Travel Prospecting",
    customerId: "123",
    status: "ENABLED",
    primaryStatus: "ELIGIBLE",
    primaryStatusReasons: [],
    channelType: "DISPLAY",
    budgetAmountMicros: 50_000_000,
    impressions7d: 12000,
    clicks7d: 400,
    conversions7d: 18,
    costMicros7d: 80_000_000,
    conversionsYesterday: 3,
    costMicrosYesterday: 12_000_000,
    enabledAdCount: 4,
    disapprovedAdCount: 0,
    limitedAdCount: 0,
    underReviewAdCount: 0,
    conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
    landingUrls: ["https://example.com/travel"],
    landingPageErrors: [],
    checkedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("evaluateCampaignHealth", () => {
  it("scores a healthy live campaign highly", () => {
    const report = evaluateCampaignHealth(snapshot());
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.grade).toBe("healthy");
    expect(report.issues).toHaveLength(0);
  });

  it("flags budget exhaustion, disapprovals, and stopped conversions", () => {
    const report = evaluateCampaignHealth(snapshot({
      primaryStatus: "LIMITED",
      primaryStatusReasons: ["BUDGET_CONSTRAINED"],
      disapprovedAdCount: 2,
      conversionsYesterday: 0,
      costMicrosYesterday: 15_000_000,
      landingPageErrors: [{ url: "https://example.com/down", error: "HTTP 404" }],
    }));
    expect(report.grade).toBe("critical");
    expect(report.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "budget-constrained",
      "ads-disapproved",
      "conversions-stopped",
      "landing-page-error",
    ]));
    expect(report.recommendations[0].steps.length).toBeGreaterThan(0);
  });

  it("detects newly opened issues for alerts", () => {
    const next = evaluateCampaignHealth(snapshot({ status: "PAUSED", primaryStatus: "PAUSED" }));
    const diff = diffHealthIssues([], next.issues);
    expect(diff.opened.some((issue) => issue.id === "status-paused")).toBe(true);
  });
});
