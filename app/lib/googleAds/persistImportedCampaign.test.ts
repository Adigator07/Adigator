import { describe, expect, it, vi } from "vitest";

import { buildGoogleAdsImportedSnapshot } from "@/app/lib/googleAds/importSnapshot";
import {
  buildGoogleAdsExternalId,
  persistImportedGoogleAdsCampaign,
} from "@/app/lib/googleAds/persistImportedCampaign";
import type { GoogleAdsCampaign } from "@/app/lib/googleAds/client";

function makeCampaign(overrides: Partial<GoogleAdsCampaign> = {}): GoogleAdsCampaign {
  return {
    id: "5001",
    name: "Holiday Draft",
    status: "Draft",
    channelType: "DISPLAY",
    budgetAmountMicros: 1000000,
    startDate: "2026-08-01",
    endDate: "2026-09-01",
    suggestedGoal: "awareness",
    sourceType: "draft",
    draftId: "draft-5001",
    channelSummary: "Display",
    ...overrides,
  };
}

describe("persistImportedGoogleAdsCampaign", () => {
  it("builds a stable external id for drafts", () => {
    const snapshot = buildGoogleAdsImportedSnapshot(
      makeCampaign(),
      "owner-1",
      "1234567890",
      { landingUrl: "https://example.com", adGroupCount: 1 },
    );

    expect(buildGoogleAdsExternalId(snapshot)).toBe("google_ads:1234567890:draft:5001");
  });

  it("inserts a new Google Ads campaign when no existing row is found", async () => {
    const snapshot = buildGoogleAdsImportedSnapshot(
      makeCampaign({ id: "7007", sourceType: "published", status: "ENABLED" }),
      "owner-1",
      "1234567890",
      { landingUrl: "https://example.com", adGroupCount: 2 },
    );

    const createBuilder = () => {
      const builder: Record<string, unknown> = {};
      const self = () => builder;
      builder.select = vi.fn(self);
      builder.eq = vi.fn(self);
      builder.ilike = vi.fn(self);
      builder.order = vi.fn(self);
      builder.update = vi.fn(self);
      builder.insert = vi.fn(self);
      builder.limit = vi.fn().mockResolvedValue({ data: [], error: null });
      builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      builder.single = vi.fn().mockResolvedValue({ data: { id: "row-1" }, error: null });
      return builder;
    };

    const supabase = {
      from: vi.fn((table: string) => {
        expect(table).toBe("campaigns");
        return createBuilder();
      }),
    };

    const result = await persistImportedGoogleAdsCampaign(supabase as never, "owner-1", snapshot);
    expect(result.ok).toBe(true);
    expect(result.rowId).toBe("row-1");
    expect(supabase.from).toHaveBeenCalled();
  });
});
