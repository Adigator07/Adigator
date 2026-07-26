/**
 * Content hashing for brain staleness detection.
 * Uses SHA-256; works in browser (Web Crypto) and Node.js.
 */

async function digestSha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashText(value: string): Promise<string> {
  return digestSha256(value.trim());
}

export async function hashBlobContent(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type CampaignHashInput = {
  briefText: string;
  campaignGoal: string;
  vertical: string;
  targetAudience: string;
  offer: string;
  cta: string;
  platform: string;
  platformConfig?: Record<string, unknown>;
  landingUrl?: string;
  landingContentHash?: string;
};

export async function hashCampaignInputs(input: CampaignHashInput): Promise<string> {
  const payload = JSON.stringify({
    briefText: input.briefText.trim(),
    campaignGoal: input.campaignGoal.trim(),
    vertical: input.vertical.trim(),
    targetAudience: input.targetAudience.trim(),
    offer: input.offer.trim(),
    cta: input.cta.trim(),
    platform: input.platform.trim(),
    platformConfig: input.platformConfig ?? {},
    landingUrl: (input.landingUrl ?? "").trim(),
    landingContentHash: input.landingContentHash ?? "",
  });
  return digestSha256(payload);
}

export type CreativeHashInput = {
  imageBytesHash: string;
  overlayText?: string;
  creativeId: string;
  campaignProductFocus?: string;
  platform?: string;
  campaignGoal?: string;
};

export async function hashCreativeInputs(input: CreativeHashInput): Promise<string> {
  const payload = JSON.stringify({
    creativeId: input.creativeId,
    imageBytesHash: input.imageBytesHash,
    overlayText: (input.overlayText ?? "").trim(),
    campaignProductFocus: (input.campaignProductFocus ?? "").trim(),
    platform: (input.platform ?? "").trim(),
    campaignGoal: (input.campaignGoal ?? "").trim(),
  });
  return digestSha256(payload);
}

export type LandingPageHashInput = {
  landingUrl: string;
  fetchedContentHash: string;
};

export async function hashLandingPageInputs(input: LandingPageHashInput): Promise<string> {
  const payload = JSON.stringify({
    landingUrl: input.landingUrl.trim(),
    fetchedContentHash: input.fetchedContentHash,
  });
  return digestSha256(payload);
}
