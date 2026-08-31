import { describe, expect, it } from "vitest";

import { buildGoogleAdsImportedSnapshot, selectGoogleAdsCampaignCandidate } from "./route";
import type { GoogleAdsCampaign } from "@/app/lib/googleAds/client";

function makeCampaign(overrides: Partial<GoogleAdsCampaign>): GoogleAdsCampaign {
  return {
    id: "1001",
    name: "Brand Search",
    status: "ENABLED",
    channelType: "SEARCH",
    budgetAmountMicros: 25000000,
    startDate: "2026-07-01",
    endDate: "2026-08-01",
    suggestedGoal: "traffic",
    sourceType: "published",
    channelSummary: "Search",
    ...overrides,
  };
}

describe("selectGoogleAdsCampaignCandidate", () => {
  it("returns published campaign first when both published and draft match", () => {
    const published = [
      makeCampaign({ id: "2001", name: "Summer Burst", sourceType: "published" }),
    ];
    const drafts = [
      makeCampaign({ id: "3001", name: "Summer Burst", sourceType: "draft", status: "Draft" }),
    ];

    const match = selectGoogleAdsCampaignCandidate(published, drafts, "Summer Burst", "");

    expect(match?.id).toBe("2001");
    expect(match?.sourceType).toBe("published");
  });

  it("falls back to draft campaign when published match is missing", () => {
    const published = [
      makeCampaign({ id: "2001", name: "Published A", sourceType: "published" }),
    ];
    const drafts = [
      makeCampaign({ id: "3002", name: "Draft Only", sourceType: "draft", status: "Draft", draftId: "d-22" }),
    ];

    const match = selectGoogleAdsCampaignCandidate(published, drafts, "Draft Only", "");

    expect(match?.id).toBe("3002");
    expect(match?.sourceType).toBe("draft");
  });

  it("supports ID-only lookup for draft campaign import", () => {
    const published = [makeCampaign({ id: "2001", name: "Published A" })];
    const drafts = [
      makeCampaign({ id: "3999", name: "Draft Candidate", sourceType: "draft", status: "Draft", draftId: "draft-3999" }),
    ];

    const match = selectGoogleAdsCampaignCandidate(published, drafts, "", "3999");

    expect(match?.name).toBe("Draft Candidate");
    expect(match?.sourceType).toBe("draft");
  });
});

describe("buildGoogleAdsImportedSnapshot", () => {
  it("marks draft campaign snapshots with draft source metadata", () => {
    const snapshot = buildGoogleAdsImportedSnapshot(
      makeCampaign({
        id: "5001",
        name: "Holiday Draft",
        sourceType: "draft",
        status: "Draft",
        draftId: "draft-5001",
        channelType: "VIDEO",
        channelSummary: "Video",
        suggestedGoal: "video_views",
      }),
      "owner-1",
      "1234567890",
      { landingUrl: "https://example.com", adGroupCount: 0 },
    );

    expect(snapshot.importSource).toBe("google_ads");
    expect(snapshot.googleAdsCampaignSource).toBe("draft");
    expect(snapshot.googleAdsCampaignStatus).toBe("Draft");
    expect(snapshot.googleAdsDraftId).toBe("draft-5001");
    expect(snapshot.googleAdsChannelSummary).toBe("Video");
    expect(snapshot.googleCampaignType).toBe("demand_gen");
    expect(snapshot.campaignGoal).toBe("google_video_views");
  });

  it("maps display channels to the display campaign type", () => {
    const snapshot = buildGoogleAdsImportedSnapshot(
      makeCampaign({
        id: "5002",
        name: "Holiday Display",
        channelType: "DISPLAY",
        channelSummary: "Display",
      }),
      "owner-1",
      "1234567890",
      { landingUrl: "https://example.com", adGroupCount: 2 },
    );

    expect(snapshot.googleCampaignType).toBe("display");
    expect(snapshot.campaignGoal).toBe("google_traffic");
  });
});
