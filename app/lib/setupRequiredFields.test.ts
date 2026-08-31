import { describe, expect, it } from "vitest";

import {
  getMissingCampaignDetailFields,
  type SetupFieldContext,
} from "@/app/lib/setupRequiredFields";

function makeContext(overrides: Partial<SetupFieldContext> = {}): SetupFieldContext {
  return {
    platform: "google_ads",
    advertiserName: "Acme",
    campaignVertical: "travel",
    campaignGoal: "google_brand_awareness",
    campaignBrief: "Book coastal getaways this summer.",
    campaignName: "Travel Awareness Q3",
    adType: "display",
    landingUrl: "https://example.com/travel",
    programmaticTaskType: "campaign_setup",
    programmaticAdGroupCount: 1,
    programmaticAdGroups: [],
    selectedProgrammaticAdGroupIds: [],
    applyProgrammaticAdGroupsToAll: true,
    loadedCampaignSnapshot: { id: "1001" },
    creativeAdditionMode: "",
    renewalReferenceSnapshot: null,
    urlUtmReferenceSnapshot: null,
    lookupCampaignId: "1001",
    renewalUsesAdGroups: false,
    ...overrides,
  };
}

describe("getMissingCampaignDetailFields", () => {
  it("requires campaign name, brief, ad type, and vertical", () => {
    const missing = getMissingCampaignDetailFields(makeContext({
      campaignName: "  ",
      campaignBrief: "",
      adType: null,
      campaignVertical: null,
    }));
    expect(missing.map((field) => field.key)).toEqual([
      "campaignName",
      "campaignBrief",
      "adType",
      "campaignVertical",
    ]);
  });

  it("is complete when all four required fields are set", () => {
    expect(getMissingCampaignDetailFields(makeContext())).toEqual([]);
  });
});
