import { describe, expect, it } from "vitest";

import { isGoogleAdsDraftCampaign, withGoogleAdsDrafts } from "@/app/lib/googleAds/drafts";

describe("google ads draft query helpers", () => {
  it("appends include_drafts so unfinished draft campaigns are returned", () => {
    expect(withGoogleAdsDrafts("SELECT campaign.id FROM campaign")).toBe(
      "SELECT campaign.id FROM campaign PARAMETERS include_drafts=true",
    );
    expect(withGoogleAdsDrafts("SELECT asset.id FROM ad_group_ad_asset_view")).toBe(
      "SELECT asset.id FROM ad_group_ad_asset_view PARAMETERS include_drafts=true",
    );
  });

  it("does not add include_drafts to campaign_draft resource queries", () => {
    const query = "SELECT campaign_draft.id FROM campaign_draft";
    expect(withGoogleAdsDrafts(query)).toBe(query);
  });

  it("does not duplicate the drafts parameter", () => {
    const query = "SELECT campaign.id FROM campaign PARAMETERS include_drafts=true";
    expect(withGoogleAdsDrafts(query)).toBe(query);
  });

  it("treats Google Ads draft experiment and CAMPAIGN_DRAFT status as drafts", () => {
    expect(isGoogleAdsDraftCampaign({ experimentType: "DRAFT" })).toBe(true);
    expect(isGoogleAdsDraftCampaign({ primaryStatus: "CAMPAIGN_DRAFT" })).toBe(true);
    expect(isGoogleAdsDraftCampaign({ status: "ENABLED", experimentType: "BASE" })).toBe(false);
  });
});
