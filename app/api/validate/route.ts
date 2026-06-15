import { NextResponse } from "next/server";
import { buildCampaignReadinessReport } from "@/app/lib/validators/reportBuilder";
import { checkUrlHealth } from "@/app/lib/url/healthCheck";
import type { ValidateRequestBody } from "@/app/types/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_CREATIVES = 20;
const MAX_BODY_BYTES = 512 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }

    const body = (await request.json()) as ValidateRequestBody;

    if (!body?.platform) {
      return NextResponse.json({ error: "Platform is required." }, { status: 400 });
    }

    if (!Array.isArray(body.creatives) || body.creatives.length === 0) {
      return NextResponse.json({ error: "At least one creative is required." }, { status: 400 });
    }

    if (body.creatives.length > MAX_CREATIVES) {
      return NextResponse.json({ error: `Maximum ${MAX_CREATIVES} creatives per validation.` }, { status: 400 });
    }

    const urlRequired = body.platform !== "meta_ads";
    if (urlRequired && !body.url?.trim()) {
      return NextResponse.json(
        { error: "Landing page URL is required for this platform." },
        { status: 400 },
      );
    }

    let urlHealth = null;
    if (body.url?.trim()) {
      try {
        urlHealth = await checkUrlHealth(body.url);
      } catch (err) {
        urlHealth = {
          flags: [
            {
              id: "url_module_error",
              severity: "error" as const,
              module: "url" as const,
              platform: "all" as const,
              message: "URL health module failed.",
              detail: err instanceof Error ? err.message : "Unknown error",
              recommendation: "Retry validation or check the URL manually.",
            },
          ],
          finalUrl: body.url,
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
    }

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session_${Date.now()}`;

    const report = buildCampaignReadinessReport({
      sessionId,
      platform: body.platform,
      objective: body.objective || "awareness",
      campaignName: body.campaignName || "Campaign",
      vertical: body.vertical,
      creatives: body.creatives,
      urlHealth,
      headlines: body.headlines,
      descriptions: body.descriptions,
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error("Validation API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed." },
      { status: 500 },
    );
  }
}
