import { describe, expect, it } from "vitest";
import {
  GOOGLE_CAMPAIGN_TYPES,
  getGoogleCampaignTypeLabel,
  isGoogleCampaignType,
  normalizeGoogleCampaignType,
} from "@/app/lib/googleCampaignTypes";

describe("googleCampaignTypes", () => {
  it("exposes Display, Responsive Display, and Demand Gen", () => {
    expect(GOOGLE_CAMPAIGN_TYPES.map((item) => item.id)).toEqual([
      "display",
      "responsive_display",
      "demand_gen",
    ]);
  });

  it("normalizes unknown values to display", () => {
    expect(normalizeGoogleCampaignType("demand_gen")).toBe("demand_gen");
    expect(normalizeGoogleCampaignType("unknown")).toBe("display");
    expect(normalizeGoogleCampaignType(null)).toBe("display");
  });

  it("labels Demand Gen correctly", () => {
    expect(isGoogleCampaignType("demand_gen")).toBe(true);
    expect(getGoogleCampaignTypeLabel("demand_gen")).toBe("Demand Gen");
  });
});
