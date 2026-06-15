import type { ValidationFlag } from "@/app/types/validation";

export interface UrlHealthResult {
  flags: ValidationFlag[];
  finalUrl: string;
  statusCode: number | null;
  loadTimeMs: number | null;
  redirectCount: number;
  hasSsl: boolean;
  hasViewport: boolean;
  pageTitle: string | null;
  h1: string | null;
  ctaTexts: string[];
  hasForm: boolean;
  hasPhone: boolean;
  hasAppStoreLink: boolean;
  hasBuySignal: boolean;
}

const FETCH_TIMEOUT_MS = 12000;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractSignalsFromHtml(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const buttonMatches = [...html.matchAll(/<(button|a)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => stripTags(m[2]))
    .filter((t) => t.length > 1 && t.length < 80);

  const hasForm = /<form[\s>]/i.test(html);
  const hasPhone = /tel:[+\d]/i.test(html) || /\(\d{3}\)\s*\d{3}[-\s]?\d{4}/.test(html);
  const hasAppStoreLink = /(apps\.apple\.com|play\.google\.com\/store)/i.test(html);
  const hasBuySignal = /(add to cart|buy now|shop now|checkout|purchase)/i.test(html);
  const hasViewport = /name=["']viewport["']/i.test(html);

  return {
    pageTitle: titleMatch ? stripTags(titleMatch[1]) : null,
    h1: h1Match ? stripTags(h1Match[1]) : null,
    ctaTexts: [...new Set(buttonMatches)].slice(0, 12),
    hasForm,
    hasPhone,
    hasAppStoreLink,
    hasBuySignal,
    hasViewport,
  };
}

export async function checkUrlHealth(url: string): Promise<UrlHealthResult> {
  const flags: ValidationFlag[] = [];

  if (!url?.trim()) {
    flags.push({
      id: "url_missing",
      severity: "warning",
      module: "url",
      platform: "all",
      message: "No landing page URL provided.",
      recommendation: "Add a final URL to validate campaign destination health.",
    });
    return {
      flags,
      finalUrl: "",
      statusCode: null,
      loadTimeMs: null,
      redirectCount: 0,
      hasSsl: false,
      hasViewport: false,
      pageTitle: null,
      h1: null,
      ctaTexts: [],
      hasForm: false,
      hasPhone: false,
      hasAppStoreLink: false,
      hasBuySignal: false,
    };
  }

  const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;

  if (!isValidHttpUrl(normalized)) {
    flags.push({
      id: "url_invalid",
      severity: "error",
      module: "url",
      platform: "all",
      message: "Landing page URL format is invalid.",
      recommendation: "Use a full https:// URL for the destination page.",
    });
    return {
      flags,
      finalUrl: normalized,
      statusCode: null,
      loadTimeMs: null,
      redirectCount: 0,
      hasSsl: false,
      hasViewport: false,
      pageTitle: null,
      h1: null,
      ctaTexts: [],
      hasForm: false,
      hasPhone: false,
      hasAppStoreLink: false,
      hasBuySignal: false,
    };
  }

  const hasSsl = normalized.startsWith("https://");
  if (!hasSsl) {
    flags.push({
      id: "url_no_ssl",
      severity: "error",
      module: "url",
      platform: "all",
      message: "Landing page does not use HTTPS.",
      recommendation: "Serve the landing page over SSL (https://) before launch.",
    });
  } else {
    flags.push({
      id: "url_ssl_ok",
      severity: "pass",
      module: "url",
      platform: "all",
      message: "Landing page uses HTTPS.",
    });
  }

  const start = Date.now();
  let statusCode: number | null = null;
  let finalUrl = normalized;
  let html = "";
  let redirectCount = 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(normalized, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Adigator-Validator/1.0" },
    });
    clearTimeout(timer);

    statusCode = response.status;
    finalUrl = response.url || normalized;
    redirectCount = finalUrl !== normalized ? 1 : 0;
    html = await response.text();
  } catch (err) {
    flags.push({
      id: "url_fetch_failed",
      severity: "error",
      module: "url",
      platform: "all",
      message: "Could not reach landing page URL.",
      detail: err instanceof Error ? err.message : "Network error",
      recommendation: "Verify the URL is public, returns 200, and is not blocked by robots or auth.",
    });
    return {
      flags,
      finalUrl,
      statusCode,
      loadTimeMs: Date.now() - start,
      redirectCount,
      hasSsl,
      hasViewport: false,
      pageTitle: null,
      h1: null,
      ctaTexts: [],
      hasForm: false,
      hasPhone: false,
      hasAppStoreLink: false,
      hasBuySignal: false,
    };
  }

  const loadTimeMs = Date.now() - start;

  if (statusCode === 200) {
    flags.push({
      id: "url_status_200",
      severity: "pass",
      module: "url",
      platform: "all",
      message: "Landing page returned HTTP 200 OK.",
    });
  } else if (statusCode && statusCode >= 300 && statusCode < 400) {
    flags.push({
      id: "url_redirect",
      severity: "warning",
      module: "url",
      platform: "all",
      message: `Landing page returned redirect status ${statusCode}.`,
      recommendation: "Use the final destination URL in your ad setup.",
    });
  } else if (statusCode === 404) {
    flags.push({
      id: "url_404",
      severity: "error",
      module: "url",
      platform: "all",
      message: "Landing page returned 404 Not Found.",
      recommendation: "Fix or replace the broken destination URL before launch.",
    });
  } else if (statusCode && statusCode >= 500) {
    flags.push({
      id: "url_5xx",
      severity: "error",
      module: "url",
      platform: "all",
      message: `Landing page returned server error ${statusCode}.`,
      recommendation: "Resolve server errors on the destination page.",
    });
  } else {
    flags.push({
      id: "url_status_other",
      severity: "warning",
      module: "url",
      platform: "all",
      message: `Landing page returned HTTP ${statusCode}.`,
    });
  }

  if (redirectCount > 0 && finalUrl !== normalized) {
    flags.push({
      id: "url_redirect_chain",
      severity: "warning",
      module: "url",
      platform: "all",
      message: "URL redirects to a different final destination.",
      detail: `Submitted: ${normalized} → Final: ${finalUrl}`,
      recommendation: "Submit the final URL in your ad platform to avoid tracking gaps.",
    });
  }

  if (loadTimeMs < 3000) {
    flags.push({
      id: "url_load_fast",
      severity: "pass",
      module: "url",
      platform: "all",
      message: `Page load time ${(loadTimeMs / 1000).toFixed(1)}s — within target.`,
    });
  } else if (loadTimeMs <= 6000) {
    flags.push({
      id: "url_load_moderate",
      severity: "warning",
      module: "url",
      platform: "all",
      message: `Page load time ${(loadTimeMs / 1000).toFixed(1)}s — moderate.`,
      recommendation: "Optimize page speed to under 3 seconds for better conversion.",
    });
  } else {
    flags.push({
      id: "url_load_slow",
      severity: "error",
      module: "url",
      platform: "all",
      message: `Page load time ${(loadTimeMs / 1000).toFixed(1)}s — too slow.`,
      recommendation: "Improve hosting, compress assets, or use a CDN before launch.",
    });
  }

  const signals = extractSignalsFromHtml(html);

  if (!signals.hasViewport) {
    flags.push({
      id: "url_no_viewport",
      severity: "warning",
      module: "landing_page",
      platform: "all",
      message: "No mobile viewport meta tag detected.",
      recommendation: "Add a responsive viewport meta tag for mobile ad traffic.",
    });
  } else {
    flags.push({
      id: "url_viewport_ok",
      severity: "pass",
      module: "landing_page",
      platform: "all",
      message: "Mobile viewport meta tag detected.",
    });
  }

  return {
    flags,
    finalUrl,
    statusCode,
    loadTimeMs,
    redirectCount,
    hasSsl,
    hasViewport: signals.hasViewport,
    pageTitle: signals.pageTitle,
    h1: signals.h1,
    ctaTexts: signals.ctaTexts,
    hasForm: signals.hasForm,
    hasPhone: signals.hasPhone,
    hasAppStoreLink: signals.hasAppStoreLink,
    hasBuySignal: signals.hasBuySignal,
  };
}
