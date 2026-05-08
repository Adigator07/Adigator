/**
 * Preview Engine API — POST /api/preview-engine
 *
 * 1. Accepts creative metadata + optional analyzer output
 * 2. Calls OpenAI to generate contextual environment content
 * 3. Runs deterministic engine to select environment, slot, template
 * 4. Returns the full PreviewEngineOutput
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  selectEnvironmentFamily,
  buildPreviewEngineOutput,
} from "@/app/lib/preview-engine/index";
import type {
  PreviewEngineInput,
  GeneratedEnvironment,
  EnvironmentFamily,
} from "@/app/lib/preview-engine/types";

export const runtime = "nodejs";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

// ── Environment content prompt ─────────────────────────────────────────────────
function buildContentPrompt(
  env: EnvironmentFamily,
  vertical: string,
  goal: string
): string {
  const envDescriptions: Record<EnvironmentFamily, string> = {
    news: "a news/editorial publication website",
    commerce: "an e-commerce shopping website",
    social: "a social media or content feed app",
    luxury: "a premium luxury brand or lifestyle magazine website",
    sports: "a sports news and scores website",
    gaming: "a gaming app or platform",
    finance: "a financial news and data website",
    travel: "a travel discovery and booking website",
    saas: "a SaaS product dashboard or corporate website",
    booking: "a local services or booking platform",
  };

  return `You are a contextual advertising environment content generator.

Generate realistic, specific, believable content for ${envDescriptions[env]}.
The website is hosting an advertisement from the ${vertical} industry.
Campaign goal: ${goal}.

Return ONLY a valid JSON object with this exact structure:
{
  "layoutType": "<type of layout, e.g. 'article', 'product-grid', 'feed', 'dashboard'>",
  "pageTitle": "<realistic page title for this environment>",
  "publisherName": "<realistic publisher or platform name>",
  "contextBlocks": [
    { "type": "headline", "text": "<main content headline>" },
    { "type": "body", "text": "<2-3 sentence body paragraph matching the vertical>" },
    { "type": "body", "text": "<2nd body paragraph>" },
    { "type": "byline", "text": "<Author Name · Date · Read time>" },
    { "type": "label", "text": "<section label e.g. 'Technology' or 'Finance'>"}
  ],
  "uiModules": [
    {
      "type": "trending",
      "label": "Trending Now",
      "items": [
        { "type": "list-item", "text": "<trending headline 1>", "secondary": "<meta e.g. '3h ago'>" },
        { "type": "list-item", "text": "<trending headline 2>", "secondary": "<meta>" },
        { "type": "list-item", "text": "<trending headline 3>", "secondary": "<meta>" },
        { "type": "list-item", "text": "<trending headline 4>", "secondary": "<meta>" }
      ]
    },
    {
      "type": "sidebar-widget",
      "label": "Related Content",
      "items": [
        { "type": "card", "text": "<related article or item 1>", "secondary": "<subtitle or price>" },
        { "type": "card", "text": "<related article or item 2>", "secondary": "<subtitle or price>" },
        { "type": "card", "text": "<related article or item 3>", "secondary": "<subtitle or price>" }
      ]
    }
  ]
}

RULES:
- All content must be specific to the ${vertical} industry — no generic placeholders
- For news: generate real-sounding article headlines and body text about ${vertical} topics
- For commerce: generate product names, prices, ratings
- For social: generate feed posts, handles, engagement counts
- For finance: generate market data, financial headlines
- For travel: generate destination names, prices, availability
- For sports: generate match scores, team names, standings
- Never use lorem ipsum
- Make the publisher name realistic (e.g. "TechInsight Daily", "SportsPulse", "MarketWatch Pro")
- Return valid JSON only, no markdown, no explanation`;
}

// ── Fallback content generator (no AI needed) ─────────────────────────────────
function buildFallbackContent(
  env: EnvironmentFamily,
  vertical: string
): GeneratedEnvironment {
  const publisherNames: Record<EnvironmentFamily, string> = {
    news: "The Digital Post",
    commerce: "ShopSphere",
    social: "FeedFlow",
    luxury: "Prestige Living",
    sports: "SportsPulse Live",
    gaming: "GameVault",
    finance: "MarketWatch Pro",
    travel: "Wanderlust Guide",
    saas: "WorkOS Platform",
    booking: "ReserveNow",
  };

  return {
    layoutType: env === "commerce" ? "product-grid" : env === "social" ? "feed" : "article",
    pageTitle: `${vertical} News & Insights — ${publisherNames[env]}`,
    publisherName: publisherNames[env],
    contextBlocks: [
      { type: "label", text: vertical },
      {
        type: "headline",
        text: `How ${vertical} leaders are transforming operations in 2026`,
      },
      {
        type: "byline",
        text: "Editorial Team · May 9, 2026 · 4 min read",
      },
      {
        type: "body",
        text: `The ${vertical} industry is experiencing unprecedented shifts driven by new technologies and changing consumer expectations. Leading brands are investing heavily in digital transformation to maintain competitive advantage.`,
      },
      {
        type: "body",
        text: `Experts point to data-driven decision making and intelligent automation as key differentiators for high-performing ${vertical} organizations. Companies that embrace these shifts are reporting significantly faster cycle times.`,
      },
    ],
    uiModules: [
      {
        type: "trending",
        label: "Trending Now",
        items: [
          { type: "list-item", text: `${vertical} sector hits record quarterly growth`, secondary: "2h ago" },
          { type: "list-item", text: `Top 10 ${vertical} innovations to watch this year`, secondary: "4h ago" },
          { type: "list-item", text: `How AI is reshaping ${vertical} workflows`, secondary: "6h ago" },
          { type: "list-item", text: `${vertical} investment outlook: what analysts say`, secondary: "8h ago" },
        ],
      },
      {
        type: "sidebar-widget",
        label: "You May Also Like",
        items: [
          { type: "card", text: `The future of ${vertical}: a 2026 deep dive`, secondary: "Sponsored" },
          { type: "card", text: `${vertical} buyer's guide: what to look for`, secondary: "5 min read" },
          { type: "card", text: `Industry benchmarks every ${vertical} pro needs`, secondary: "3 min read" },
        ],
      },
    ],
  };
}

// ── Main POST handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PreviewEngineInput;
    const { vertical, goal, device, creativeSize, creativeType, analyzerOutput, ctaText, headline, logoPresent, riskFlags } = body;

    if (!vertical || !goal) {
      return NextResponse.json(
        { error: "vertical and goal are required" },
        { status: 400 }
      );
    }

    const environment = selectEnvironmentFamily(vertical, goal);
    let generatedEnv: GeneratedEnvironment;

    // Try AI content generation, fall back to deterministic content
    try {
      const client = getClient();
      const prompt = buildContentPrompt(environment, vertical, goal);

      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as GeneratedEnvironment;
      generatedEnv = parsed;
    } catch (aiErr) {
      console.warn("[preview-engine] AI content generation failed, using fallback:", aiErr);
      generatedEnv = buildFallbackContent(environment, vertical);
    }

    const output = buildPreviewEngineOutput(
      { vertical, goal, device, creativeSize, creativeType, analyzerOutput, ctaText, headline, logoPresent, riskFlags },
      generatedEnv
    );

    return NextResponse.json(output, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[preview-engine] Error:", err);
    return NextResponse.json({ error: "Preview engine failed", details: message }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    engine: "Preview Engine v1.0",
    description: "Contextual Ad Reality Simulator",
    endpoint: "POST /api/preview-engine",
  });
}
