import { describe, expect, it } from "vitest";

import { mapGoogleAdsImportedCreativesToTool } from "@/app/lib/googleAds/importedCreatives";

describe("mapGoogleAdsImportedCreativesToTool", () => {
  it("keeps image ads previewable and linked to their ad group", () => {
    const [creative] = mapGoogleAdsImportedCreativesToTool(
      [
        {
          id: "gads-image-9",
          name: "Banner",
          type: "image",
          previewUrl: "https://example.com/banner.jpg",
          adGroupId: "11",
          source: "google_ads",
        },
      ],
      [{ id: "11", name: "Prospecting", objective: "google_brand_awareness" }],
    );

    expect(creative).toMatchObject({
      url: "https://example.com/banner.jpg",
      adGroupId: "11",
      adGroupName: "Prospecting",
      adGroupObjective: "google_brand_awareness",
      valid: true,
      importedFromGoogleAds: true,
    });
  });

  it("builds a preview for text ads so they appear in Creative Validation", () => {
    const [creative] = mapGoogleAdsImportedCreativesToTool(
      [
        {
          id: "gads-ad-1",
          name: "Shop now",
          type: "text",
          headline: "Shop now",
          description: "Free shipping this week",
          adGroupId: "22",
          source: "google_ads",
        },
      ],
      [{ id: "22", name: "Retargeting", objective: "google_sales" }],
    );

    expect(creative.valid).toBe(true);
    expect(creative.url).toContain("data:image/svg+xml");
    expect(creative.title).toBe("Shop now");
    expect(creative.text).toBe("Free shipping this week");
    expect(creative.adGroupId).toBe("22");
    expect(creative.size).toBe("1200x628");
  });
});
