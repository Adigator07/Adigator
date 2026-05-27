/**
 * POST /api/preview-templates
 * Generates platform-specific ad creative templates via OpenAI.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildGoogleAdsSystemPrompt,
  buildGoogleAdsUserPrompt,
} from "@/app/lib/googleAdsAnalyzerPrompt";
import {
  buildMetaAdsSystemPrompt,
  buildMetaAdsUserPrompt,
} from "@/app/lib/metaAdsAnalyzerPrompt";

export const runtime = "nodejs";

type PreviewPlatform = "google_ads" | "meta_ads";

type RawCreative = Record<string, unknown>;
type RawCard = Record<string, unknown>;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeCreative(raw: RawCreative, platform: PreviewPlatform, vertical: string) {
  if (!raw || typeof raw !== "object") return null;

  const cards = Array.isArray(raw.cards)
    ? raw.cards.map((card: RawCard, index: number) => ({
        imageUrl: cleanText(card?.imageUrl || card?.image),
        title: cleanText(card?.title, `Card ${index + 1}`),
        description: cleanText(card?.description),
        cta: cleanText(card?.cta, "Learn More"),
        url: cleanText(card?.url),
      }))
    : [];

  return {
    id: cleanText(raw.id, `${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    platform,
    vertical: cleanText(raw.vertical, vertical),
    type: cleanText(raw.type),
    placement: cleanText(raw.placement, platform === "google_ads" ? "Google Ads" : "Meta Ads"),
    environment: cleanText(raw.environment),
    headline: cleanText(raw.headline, "Your headline here"),
    headline2: cleanText(raw.headline2),
    headline3: cleanText(raw.headline3),
    description: cleanText(raw.description, "Your ad description here"),
    description2: cleanText(raw.description2),
    primaryText: cleanText(raw.primaryText),
    cta: cleanText(raw.cta, "Learn More"),
    imagePrompt: cleanText(raw.imagePrompt),
    imageUrl: cleanText(raw.imageUrl || raw.image),
    size: cleanText(raw.size),
    price: cleanText(raw.price),
    rating: typeof raw.rating === "number" ? raw.rating : Number(raw.rating) || 0,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : Number(raw.reviewCount) || 0,
    displayUrl: cleanText(raw.displayUrl),
    appName: cleanText(raw.appName),
    storeName: cleanText(raw.storeName),
    pageName: cleanText(raw.pageName),
    pageAvatar: cleanText(raw.pageAvatar),
    cards,
  };
}

function parseCreatives(payload: { creatives?: RawCreative[] }, platform: PreviewPlatform, vertical: string) {
  const list = Array.isArray(payload?.creatives) ? payload.creatives : [];
  return list
    .map((item) => normalizeCreative(item, platform, vertical))
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const platform = body?.platform;
    const vertical = cleanText(body?.vertical, "general");

    if (platform !== "google_ads" && platform !== "meta_ads") {
      return NextResponse.json(
        { error: "platform must be google_ads or meta_ads" },
        { status: 400 },
      );
    }

    const input = {
      brandName: cleanText(body?.brandName, "Brand"),
      vertical,
      targetAudience: cleanText(body?.targetAudience),
      goal: cleanText(body?.goal, "awareness"),
      tone: cleanText(body?.tone),
      keyMessage: cleanText(body?.keyMessage),
      imageUrls: Array.isArray(body?.imageUrls)
        ? body.imageUrls.filter((url: unknown) => typeof url === "string" && url.trim())
        : [],
    };

    const systemPrompt = platform === "google_ads"
      ? buildGoogleAdsSystemPrompt()
      : buildMetaAdsSystemPrompt();
    const userPrompt = platform === "google_ads"
      ? buildGoogleAdsUserPrompt(input)
      : buildMetaAdsUserPrompt(input);

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "OpenAI returned invalid JSON", raw: content },
        { status: 502 },
      );
    }

    const creatives = parseCreatives(parsed, platform, vertical);
    if (!creatives.length) {
      return NextResponse.json(
        { error: "No creatives generated", raw: parsed },
        { status: 502 },
      );
    }

    return NextResponse.json({ creatives, platform, vertical });
  } catch (error) {
    console.error("[preview-templates]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Template generation failed" },
      { status: 500 },
    );
  }
}
