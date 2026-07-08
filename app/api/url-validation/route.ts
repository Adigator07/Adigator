import { NextResponse } from "next/server";
import { checkUrlHealth } from "@/app/lib/url/healthCheck";
import { evaluateUrlAlignment } from "@/app/lib/url/urlAlignment";
import { stripUtmFromUrl } from "@/app/lib/utmManagement";
import type { UrlValidationRequestBody } from "@/app/types/urlValidation";

export const runtime = "nodejs";
export const maxDuration = 45;

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_CREATIVES = 5;
const MAX_IMAGE_BASE64_CHARS = 2_500_000;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }

    const body = (await request.json()) as UrlValidationRequestBody;

    if (!body?.url?.trim()) {
      return NextResponse.json({ error: "Landing page URL is required." }, { status: 400 });
    }

    if (!body.platform) {
      return NextResponse.json({ error: "Platform is required." }, { status: 400 });
    }

    const creatives = Array.isArray(body.creatives) ? body.creatives.slice(0, MAX_CREATIVES) : [];
    for (const creative of creatives) {
      if (creative.imageBase64 && creative.imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
        return NextResponse.json({ error: "Creative image payload too large." }, { status: 413 });
      }
    }

    const cleanUrl = stripUtmFromUrl(body.url.trim());
    if (!cleanUrl) {
      return NextResponse.json({ error: "Landing page URL is required." }, { status: 400 });
    }

    const adType = body.adType === "video" ? "video" : "display";
    const urlHealth = await checkUrlHealth(cleanUrl);
    const result = await evaluateUrlAlignment({
      submittedUrl: cleanUrl,
      urlHealth,
      platform: body.platform,
      objective: body.objective,
      vertical: body.vertical,
      campaignName: body.campaignName,
      adType,
      creatives: creatives.map((c) => ({
        id: c.id,
        name: c.name,
        size: c.size,
        imageBase64: c.imageBase64,
      })),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("URL validation API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "URL validation failed." },
      { status: 500 },
    );
  }
}
