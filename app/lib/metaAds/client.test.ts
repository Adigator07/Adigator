import { describe, expect, it } from "vitest";
import { buildMetaAdsImportedSnapshot } from "@/app/lib/metaAds/importSnapshot";
import { buildMetaAdsExternalId } from "@/app/lib/metaAds/persistImportedCampaign";
import {
  parseMetaDraftObjective,
  isMetaDraftCampaign,
  mapAdigatorObjectiveToMeta,
  missingMetaAdsPermissions,
  metaAdsMissingPermissionMessage,
  normalizeAdAccountId,
} from "@/app/lib/metaAds/client";
import type { MetaAdsCampaign } from "@/app/lib/metaAds/client";

describe("meta ads helpers", () => {
  it("normalizes ad account ids", () => {
    expect(normalizeAdAccountId("1214774295062070")).toBe("act_1214774295062070");
    expect(normalizeAdAccountId("act_1214774295062070")).toBe("act_1214774295062070");
  });

  it("treats paused and in-process Meta campaigns as drafts", () => {
    expect(isMetaDraftCampaign("PAUSED")).toBe(true);
    expect(isMetaDraftCampaign("IN_PROCESS")).toBe(true);
    expect(isMetaDraftCampaign("DRAFT")).toBe(true);
    expect(isMetaDraftCampaign("ACTIVE")).toBe(false);
  });

  it("reads an objective out of Ads Manager draft fragment values", () => {
    expect(parseMetaDraftObjective({ objective: "OUTCOME_TRAFFIC" })).toBe("OUTCOME_TRAFFIC");
    expect(parseMetaDraftObjective("{\"objective\":\"OUTCOME_SALES\"}")).toBe("OUTCOME_SALES");
  });

  it("requires ads_management or ads_read on the Meta token", () => {
    expect(missingMetaAdsPermissions(["email", "public_profile"])).toEqual(["ads_read", "ads_management"]);
    expect(missingMetaAdsPermissions(["ads_read", "email"])).toEqual([]);
    expect(missingMetaAdsPermissions(["ads_management", "email"])).toEqual([]);
    expect(metaAdsMissingPermissionMessage("Missing Meta permissions: ads_read.", ["public_profile"])).toContain("Ads management");
  });

  it("maps Adigator objectives to Meta outcome objectives", () => {
    expect(mapAdigatorObjectiveToMeta("meta_traffic")).toBe("OUTCOME_TRAFFIC");
    expect(mapAdigatorObjectiveToMeta("meta_sales")).toBe("OUTCOME_SALES");
    expect(mapAdigatorObjectiveToMeta("meta_awareness")).toBe("OUTCOME_AWARENESS");
  });

  it("builds a stable external id", () => {
    const campaign: MetaAdsCampaign = {
      id: "12001",
      name: "Summer",
      status: "PAUSED",
      objective: "OUTCOME_TRAFFIC",
      adAccountId: "act_9",
      sourceType: "draft",
    };
    const snapshot = buildMetaAdsImportedSnapshot(campaign, "owner-1", "act_9", {});
    expect(buildMetaAdsExternalId(snapshot)).toBe("meta_ads:act_9:12001");
  });
});
