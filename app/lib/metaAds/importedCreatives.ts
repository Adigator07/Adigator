import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";

export type MetaAdsToolCreative = {
  id: string;
  name: string;
  url: string;
  previewUrl: string;
  previewDataUrl?: string;
  image: string;
  headline: string;
  title: string;
  text: string;
  type: "text" | "image" | "video";
  mediaType: "image" | "video";
  mimeType?: string;
  adGroupId: string | null;
  adGroupName: string;
  adGroupObjective: string;
  importedFromMetaAds: true;
  source: "meta_ads";
  valid: true;
  size?: string;
  validation: {
    status: "PASS";
    issues: unknown[];
    intelligence: Record<string, unknown>;
    size?: string;
  };
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMetaAdsTextPreviewDataUrl(headline: string, description = ""): string {
  const title = escapeXml((headline || "Meta Ad").slice(0, 72));
  const body = escapeXml((description || "").slice(0, 110));
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">',
    '<rect width="1080" height="1080" fill="#0b1220"/>',
    '<rect x="40" y="40" width="1000" height="1000" rx="28" fill="#111827" stroke="#334155"/>',
    '<text x="80" y="480" fill="#f8fafc" font-size="42" font-family="Arial, sans-serif">',
    title,
    "</text>",
    '<text x="80" y="560" fill="#94a3b8" font-size="24" font-family="Arial, sans-serif">',
    body,
    "</text>",
    '<text x="80" y="980" fill="#60a5fa" font-size="18" font-family="Arial, sans-serif">Imported from Meta Ads</text>',
    "</svg>",
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function mapMetaAdsImportedCreativesToTool(
  creatives: Array<Record<string, unknown>> = [],
  adSets: ProgrammaticAdGroup[] = [],
): MetaAdsToolCreative[] {
  return creatives.map((creative, index) => {
    const adGroupId = String(creative.adSetId || creative.adGroupId || "").trim();
    const matched = adSets.find((group) => String(group.id) === adGroupId)
      || (!adGroupId ? (adSets[index] || adSets[0] || null) : null);
    const headline = String(creative.headline || creative.title || "").trim();
    const description = String(creative.description || creative.text || "").trim();
    const type = creative.type === "video" || creative.type === "text" || creative.type === "image"
      ? creative.type
      : "image";
    const previewUrl = String(creative.previewUrl || creative.url || "").trim();
    const fallbackPreview = type === "text" || (!previewUrl && (headline || description))
      ? buildMetaAdsTextPreviewDataUrl(headline || String(creative.name || "Meta ad"), description)
      : "";
    const preview = previewUrl || fallbackPreview;
    const name = String(creative.name || headline || `Creative ${index + 1}`).trim();

    return {
      id: String(creative.id || `meta-creative-${index + 1}`),
      name,
      url: preview,
      previewUrl: preview,
      previewDataUrl: preview.startsWith("data:") ? preview : undefined,
      image: preview,
      headline,
      title: headline || name,
      text: description,
      type,
      size: preview ? "1080x1080" : undefined,
      mediaType: type === "video" ? "video" : "image",
      mimeType: preview.startsWith("data:image/svg") ? "image/svg+xml" : undefined,
      adGroupId: adGroupId || matched?.id || null,
      adGroupName: matched?.name || "",
      adGroupObjective: matched?.objective || "",
      importedFromMetaAds: true,
      source: "meta_ads",
      valid: true,
      validation: {
        status: "PASS",
        issues: [],
        intelligence: {
          importedFromMetaAds: true,
          adGroupId: adGroupId || matched?.id || null,
          adGroupName: matched?.name || "",
          adGroupObjective: matched?.objective || "",
        },
        size: preview ? "1080x1080" : undefined,
      },
    };
  });
}
