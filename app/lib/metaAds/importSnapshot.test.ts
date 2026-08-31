import { describe, expect, it } from "vitest";
import {
  buildMetaAdsCampaignBrief,
  buildMetaAdsImportedSnapshot,
  mapMetaAdSetsToProgrammatic,
  mapMetaObjectiveToAdigator,
} from "@/app/lib/metaAds/importSnapshot";
import type { MetaAdsCampaign } from "@/app/lib/metaAds/client";

function makeCampaign(overrides: Partial<MetaAdsCampaign> = {}): MetaAdsCampaign {
  return {
    id: "12033001",
    name: "Travel Awareness Q3",
    status: "ACTIVE",
    objective: "OUTCOME_AWARENESS",
    adAccountId: "act_1214774295062070",
    sourceType: "published",
    ...overrides,
  };
}

describe("meta ads import snapshot mapping", () => {
  it("maps Meta objectives to Adigator objective ids", () => {
    expect(mapMetaObjectiveToAdigator("OUTCOME_TRAFFIC")).toBe("meta_traffic");
    expect(mapMetaObjectiveToAdigator("LINK_CLICKS")).toBe("meta_traffic");
    expect(mapMetaObjectiveToAdigator("OUTCOME_SALES")).toBe("meta_sales");
    expect(mapMetaObjectiveToAdigator("BRAND_AWARENESS")).toBe("meta_awareness");
  });

  it("copies Meta ad sets into programmatic ad group fields", () => {
    expect(mapMetaAdSetsToProgrammatic(
      [
        { id: "11", name: "Prospecting" },
        { id: "22", name: "Retargeting" },
      ],
      "meta_awareness",
    )).toEqual([
      { id: "11", name: "Prospecting", objective: "meta_awareness" },
      { id: "22", name: "Retargeting", objective: "meta_awareness" },
    ]);
  });

  it("auto-populates snapshot fields from Meta campaign details", () => {
    const snapshot = buildMetaAdsImportedSnapshot(
      makeCampaign(),
      "owner-1",
      "act_1214774295062070",
      {
        landingUrl: "https://example.com/travel",
        adSetCount: 2,
        adSets: [
          { id: "11", name: "Prospecting" },
          { id: "22", name: "Retargeting", landingUrl: "https://example.com/travel" },
        ],
        adCopyDescriptions: ["Book coastal getaways this summer."],
        adCopyHeadlines: ["Escape for less"],
      },
    );

    expect(snapshot.platform).toBe("meta_ads");
    expect(snapshot.importSource).toBe("meta_ads");
    expect(snapshot.campaignName).toBe("Travel Awareness Q3");
    expect(snapshot.campaignGoal).toBe("meta_awareness");
    expect(snapshot.landingUrl).toBe("https://example.com/travel");
    expect(snapshot.campaignBrief).toContain("Book coastal getaways");
    expect(snapshot.vertical).toBe("travel");
    expect(snapshot.programmaticAdGroups).toHaveLength(2);
    expect(snapshot.metaAdsAdAccountId).toBe("act_1214774295062070");
  });

  it("builds a brief from headlines when descriptions are missing", () => {
    expect(buildMetaAdsCampaignBrief({ adCopyHeadlines: ["Shop the drop"] })).toBe("Shop the drop");
  });
});
