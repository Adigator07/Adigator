import { createHash } from "crypto";
import { checkUrlHealth, type UrlHealthResult } from "@/app/lib/url/healthCheck";

export type LandingPageExtraction = {
  headline: string;
  offer: string;
  cta: string;
  pageIntent: string;
  conversionElements: string[];
  trustSignals: string[];
  pageSpeedInsights?: Record<string, unknown>;
  mobileExperienceSignals?: Record<string, unknown>;
  urlHealth: UrlHealthResult;
  finalUrl: string;
  fetchedContentHash: string;
};

function inferPageIntent(health: UrlHealthResult, goalHint?: string): string {
  if (health.hasBuySignal) return "purchase";
  if (health.hasForm) return "lead_capture";
  if (health.hasAppStoreLink) return "app_install";
  if (goalHint) return goalHint;
  return "information";
}

function inferOfferFromPage(health: UrlHealthResult): string {
  const corpus = [health.pageTitle, health.h1, ...health.ctaTexts].filter(Boolean).join(" ").toLowerCase();
  if (/free trial|start free|try free/.test(corpus)) return "Free trial";
  if (/% off|discount|save \d+/.test(corpus)) return "Discount offer";
  if (/demo|book a demo|schedule/.test(corpus)) return "Demo booking";
  if (/download|get the guide|ebook/.test(corpus)) return "Content download";
  return "";
}

function buildTrustSignals(health: UrlHealthResult): string[] {
  const signals: string[] = [];
  if (health.hasSsl) signals.push("HTTPS");
  if (health.hasViewport) signals.push("mobile_viewport");
  if (health.hasPhone) signals.push("phone_contact");
  if (health.statusCode === 200) signals.push("http_200");
  return signals;
}

function buildConversionElements(health: UrlHealthResult): string[] {
  const elements: string[] = [];
  if (health.ctaTexts.length > 0) elements.push(...health.ctaTexts.slice(0, 6));
  if (health.hasForm) elements.push("form");
  if (health.hasBuySignal) elements.push("buy_signal");
  if (health.hasAppStoreLink) elements.push("app_store_link");
  return [...new Set(elements)];
}

export function hashLandingPageContent(health: UrlHealthResult, finalUrl: string): string {
  const payload = JSON.stringify({
    finalUrl: finalUrl.trim(),
    pageTitle: health.pageTitle ?? "",
    h1: health.h1 ?? "",
    ctaTexts: health.ctaTexts,
    hasForm: health.hasForm,
    hasBuySignal: health.hasBuySignal,
    statusCode: health.statusCode,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Fetches landing page content and extracts deterministic signals for Landing Page Brain.
 * No AI calls — application code owns fetch and signal extraction.
 */
export async function extractLandingPageSignals(
  landingUrl: string,
  goalHint?: string,
): Promise<LandingPageExtraction> {
  const health = await checkUrlHealth(landingUrl);
  const finalUrl = health.finalUrl || landingUrl;
  const fetchedContentHash = hashLandingPageContent(health, finalUrl);

  return {
    headline: health.h1 || health.pageTitle || "",
    offer: inferOfferFromPage(health),
    cta: health.ctaTexts[0] || "",
    pageIntent: inferPageIntent(health, goalHint),
    conversionElements: buildConversionElements(health),
    trustSignals: buildTrustSignals(health),
    pageSpeedInsights: health.loadTimeMs != null
      ? { loadTimeMs: health.loadTimeMs, redirectCount: health.redirectCount }
      : undefined,
    mobileExperienceSignals: { hasViewport: health.hasViewport },
    urlHealth: health,
    finalUrl,
    fetchedContentHash,
  };
}
