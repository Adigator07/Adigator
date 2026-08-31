import { describe, expect, it } from "vitest";
import { mapMetaAdsImportedCreativesToTool } from "@/app/lib/metaAds/importedCreatives";

describe("mapMetaAdsImportedCreativesToTool", () => {
  it("keeps image ads previewable and linked to their ad set", () => {
    const [creative] = mapMetaAdsImportedCreativesToTool(
      [
        {
          id: "meta-image-9",
          name: "Feed",
          type: "image",
          previewUrl: "https://example.com/feed.jpg",
          adSetId: "11",
          source: "meta_ads",
        },
      ],
      [{ id: "11", name: "Prospecting", objective: "meta_awareness" }],
    );

    expect(creative).toMatchObject({
      url: "https://example.com/feed.jpg",
      adGroupId: "11",
      adGroupName: "Prospecting",
      importedFromMetaAds: true,
      source: "meta_ads",
      valid: true,
    });
  });

  it("builds a preview for text ads so they appear in Creative Validation", () => {
    const [creative] = mapMetaAdsImportedCreativesToTool(
      [
        {
          id: "meta-ad-1",
          name: "Shop now",
          type: "text",
          headline: "Shop now",
          description: "Free shipping this week",
          adSetId: "22",
          source: "meta_ads",
        },
      ],
      [{ id: "22", name: "Retargeting", objective: "meta_sales" }],
    );

    expect(creative.valid).toBe(true);
    expect(creative.url).toContain("data:image/svg+xml");
    expect(creative.title).toBe("Shop now");
    expect(creative.text).toBe("Free shipping this week");
  });
});
