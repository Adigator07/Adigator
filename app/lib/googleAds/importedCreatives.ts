import type { GoogleAdsImportedCreative } from "@/app/lib/googleAds/client";
import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";

export type GoogleAdsToolCreative = {
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
  importedFromGoogleAds: true;
  source: "google_ads";
  valid: true;
  size?: string;
  validation: {
    status: "PASS";
    issues: unknown[];
    intelligence: Record<string, unknown>;
  };
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildGoogleAdsTextPreviewDataUrl(headline: string, description = ""): string {
  const title = escapeXml((headline || "Google Ad").slice(0, 72));
  const body = escapeXml((description || "").slice(0, 110));
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628" viewBox="0 0 1200 628">',
    '<rect width="1200" height="628" fill="#0b1220"/>',
    '<rect x="36" y="36" width="1128" height="556" rx="24" fill="#111827" stroke="#334155"/>',
    '<text x="72" y="280" fill="#f8fafc" font-size="44" font-family="Arial, sans-serif">',
    title,
    "</text>",
    '<text x="72" y="360" fill="#94a3b8" font-size="26" font-family="Arial, sans-serif">',
    body,
    "</text>",
    '<text x="72" y="540" fill="#22d3ee" font-size="18" font-family="Arial, sans-serif">Imported from Google Ads</text>',
    "</svg>",
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function mapGoogleAdsImportedCreativesToTool(
  creatives: Array<Partial<GoogleAdsImportedCreative> & Record<string, unknown>> = [],
  adGroups: ProgrammaticAdGroup[] = [],
): GoogleAdsToolCreative[] {
  return creatives.map((creative, index) => {
    const adGroupId = String(creative.adGroupId || "").trim();
    const matched = adGroups.find((group) => String(group.id) === adGroupId)
      || (!adGroupId ? (adGroups[index] || adGroups[0] || null) : null);
    const headline = String(creative.headline || creative.title || "").trim();
    const description = String(creative.description || creative.text || "").trim();
    const type = creative.type === "video" || creative.type === "text" || creative.type === "image"
      ? creative.type
      : "image";
    const previewUrl = String(creative.previewUrl || creative.url || "").trim();
    const fallbackPreview = type === "text" || (!previewUrl && (headline || description))
      ? buildGoogleAdsTextPreviewDataUrl(headline || String(creative.name || "Google ad"), description)
      : "";
    const preview = previewUrl || fallbackPreview;
    const name = String(creative.name || headline || `Creative ${index + 1}`).trim();
    const width = Number(creative.width || 0);
    const height = Number(creative.height || 0);
    const size = width > 0 && height > 0
      ? `${Math.round(width)}x${Math.round(height)}`
      : (preview ? "1200x628" : undefined);

    return {
      id: String(creative.id || `gads-creative-${index + 1}`),
      name,
      url: preview,
      previewUrl: preview,
      previewDataUrl: preview.startsWith("data:") ? preview : undefined,
      image: preview,
      headline,
      title: headline || name,
      text: description,
      type,
      size,
      mediaType: type === "video" ? "video" : "image",
      mimeType: preview.startsWith("data:image/svg") ? "image/svg+xml" : undefined,
      adGroupId: adGroupId || matched?.id || null,
      adGroupName: matched?.name || "",
      adGroupObjective: matched?.objective || "",
      importedFromGoogleAds: true,
      source: "google_ads",
      valid: true,
      validation: {
        status: "PASS",
        issues: [],
        intelligence: {
          importedFromGoogleAds: true,
          adGroupId: adGroupId || matched?.id || null,
          adGroupName: matched?.name || "",
          adGroupObjective: matched?.objective || "",
        },
        size,
      },
    };
  });
}
