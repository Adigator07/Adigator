import { describe, expect, it } from "vitest";

import {
  inferVerticalFromGoogleCampaignSignals,
  inferVerticalFromGoogleChannel,
  buildVerticalInferenceCorpus,
} from "@/app/lib/googleAds/inferVertical";

describe("inferVerticalFromGoogleCampaignSignals", () => {
  it("detects vertical from campaign name", () => {
    expect(inferVerticalFromGoogleCampaignSignals("Travel Awareness Q3")).toBe("travel");
    expect(inferVerticalFromGoogleCampaignSignals("Marriott Brand Hotels")).toBe("hotels");
  });

  it("detects vertical from landing URL domains and paths", () => {
    expect(inferVerticalFromGoogleCampaignSignals(
      "Prospecting",
      "https://www.booking.com/hotel/us/downtown.html",
    )).toBe("travel");
    expect(inferVerticalFromGoogleCampaignSignals(
      "Always On",
      "https://shop.example.com/cart",
    )).toBe("ecommerce");
  });

  it("detects shopping campaigns as ecommerce", () => {
    const corpus = buildVerticalInferenceCorpus({
      campaignName: "PMax Feed",
      channelType: "SHOPPING",
    });
    expect(inferVerticalFromGoogleChannel("SHOPPING")).toBe("ecommerce");
    expect(inferVerticalFromGoogleCampaignSignals(...corpus)).toBe("ecommerce");
  });

  it("uses ad copy when the campaign name is generic", () => {
    expect(inferVerticalFromGoogleCampaignSignals(
      "Display - Prospecting",
      "Same-day delivery on everyday essentials.",
      "Shop weekly deals",
    )).toBe("ecommerce");
  });

  it("returns empty when nothing identifies an industry", () => {
    expect(inferVerticalFromGoogleCampaignSignals("Brand Awareness - Display")).toBe("");
  });
});
