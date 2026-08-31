import { describe, expect, it } from "vitest";

import {
  buildGoogleAdsCampaignBrief,
  buildGoogleAdsImportedSnapshot,
  inferVerticalFromGoogleCampaignSignals,
  mapGoogleAdsAdGroupsToProgrammatic,
  mapGoogleAdsChannelToCampaignType,
  mapGoogleAdsGoalToObjective,
} from "@/app/lib/googleAds/importSnapshot";
import type { GoogleAdsCampaign } from "@/app/lib/googleAds/client";

function makeCampaign(overrides: Partial<GoogleAdsCampaign> = {}): GoogleAdsCampaign {
  return {
    id: "1001",
    name: "Holiday Display",
    status: "ENABLED",
    channelType: "DISPLAY",
    budgetAmountMicros: 25000000,
    startDate: "2026-08-01",
    endDate: "2026-09-01",
    suggestedGoal: "awareness",
    sourceType: "published",
    channelSummary: "Display",
    ...overrides,
  };
}

describe("google ads import snapshot mapping", () => {
  it("maps Google channel types to Adigator campaign types", () => {
    expect(mapGoogleAdsChannelToCampaignType("DISPLAY")).toBe("display");
    expect(mapGoogleAdsChannelToCampaignType("VIDEO")).toBe("demand_gen");
    expect(mapGoogleAdsChannelToCampaignType("DEMAND_GEN")).toBe("demand_gen");
    expect(mapGoogleAdsChannelToCampaignType("PERFORMANCE_MAX")).toBe("responsive_display");
    expect(mapGoogleAdsChannelToCampaignType("DISPLAY", "DISPLAY_SMART_CAMPAIGN")).toBe("responsive_display");
  });

  it("maps analyzer goals to Google objective ids", () => {
    expect(mapGoogleAdsGoalToObjective("traffic", "SEARCH")).toBe("google_traffic");
    expect(mapGoogleAdsGoalToObjective("awareness", "DISPLAY")).toBe("google_brand_awareness");
    expect(mapGoogleAdsGoalToObjective("video_views", "VIDEO")).toBe("google_video_views");
    expect(mapGoogleAdsGoalToObjective("google_sales", "PERFORMANCE_MAX")).toBe("google_sales");
  });

  it("copies Google ad groups into programmatic ad group fields", () => {
    const groups = mapGoogleAdsAdGroupsToProgrammatic(
      [
        { id: "11", name: "Prospecting", status: "ENABLED", type: "DISPLAY_STANDARD" },
        { id: "22", name: "Retargeting", landingUrl: "https://example.com/offer" },
      ],
      "google_brand_awareness",
    );

    expect(groups).toEqual([
      { id: "11", name: "Prospecting", objective: "google_brand_awareness" },
      { id: "22", name: "Retargeting", objective: "google_brand_awareness" },
    ]);
    expect(mapGoogleAdsAdGroupsToProgrammatic(
      [{ id: "33", name: "Brand search", type: "SEARCH_STANDARD" }],
      "google_sales",
    )).toEqual([
      { id: "33", name: "Brand search", objective: "google_traffic" },
    ]);
  });

  it("auto-populates snapshot fields from Google Ads campaign details", () => {
    const snapshot = buildGoogleAdsImportedSnapshot(
      makeCampaign({ name: "Travel Awareness Q3", channelType: "DISPLAY" }),
      "owner-1",
      "1234567890",
      {
        landingUrl: "https://example.com/travel",
        adGroupCount: 2,
        adGroups: [
          { id: "11", name: "Prospecting" },
          { id: "22", name: "Retargeting", landingUrl: "https://example.com/travel" },
        ],
        adCopyDescriptions: ["Book coastal getaways this summer."],
        adCopyHeadlines: ["Escape for less"],
      },
    );

    expect(snapshot.campaignName).toBe("Travel Awareness Q3");
    expect(snapshot.landingUrl).toBe("https://example.com/travel");
    expect(snapshot.campaignGoal).toBe("google_brand_awareness");
    expect(snapshot.vertical).toBe("travel");
    expect(snapshot.campaignTaskType).toBe("campaign_setup");
    expect(snapshot.campaignBrief).toBe("Book coastal getaways this summer.");
    expect(snapshot.campaignBrief).not.toMatch(/imported from Google Ads|Objective:|Landing URL:/i);
    expect(snapshot.googleCampaignType).toBe("display");
    expect(snapshot.programmaticAdGroups).toHaveLength(2);
    expect(snapshot.programmaticAdGroups?.[0]).toMatchObject({
      id: "11",
      name: "Prospecting",
      objective: "google_brand_awareness",
    });
    expect(snapshot.selectedProgrammaticAdGroupIds).toEqual(["11", "22"]);
    expect(snapshot.importSource).toBe("google_ads");
  });

  it("copies Google Ads draft creatives into the snapshot", () => {
    const snapshot = buildGoogleAdsImportedSnapshot(
      makeCampaign({ name: "Sales-Performance Max-1", channelType: "PERFORMANCE_MAX", sourceType: "draft", status: "Draft" }),
      "owner-1",
      "1234567890",
      {
        landingUrl: "https://example.com",
        creatives: [
          {
            id: "gads-asset-1",
            name: "Shop now",
            type: "text",
            headline: "Shop now",
            source: "google_ads",
          },
        ],
      },
    );

    expect(snapshot.googleAdsCampaignSource).toBe("draft");
    expect(snapshot.googleCampaignType).toBe("responsive_display");
    expect(snapshot.creatives).toHaveLength(1);
    expect(snapshot.creatives[0]).toMatchObject({
      id: "gads-asset-1",
      headline: "Shop now",
      importedFromGoogleAds: true,
      valid: true,
      adGroupId: "google-ads-imported",
    });
    expect(String(snapshot.creatives[0].url || snapshot.creatives[0].previewUrl || "")).toContain("data:image/svg+xml");
    expect(snapshot.campaignBrief).toBe("Shop now");
    expect(snapshot.vertical).toBe("ecommerce");
    expect(snapshot.programmaticAdGroups?.[0]).toMatchObject({
      id: "google-ads-imported",
      name: "Imported creatives",
    });
  });

  it("uses Google Ads description copy as the campaign brief and infers vertical from copy", () => {
    expect(buildGoogleAdsCampaignBrief({
      adCopyDescriptions: ["Same-day delivery on everyday essentials."],
      adCopyHeadlines: ["Shop weekly deals"],
    })).toBe("Same-day delivery on everyday essentials.");
    expect(inferVerticalFromGoogleCampaignSignals(
      "Q3 Prospecting",
      "https://shop.example.com/cart",
      "Same-day delivery on everyday essentials.",
    )).toBe("ecommerce");
  });
});
