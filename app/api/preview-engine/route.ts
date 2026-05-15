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
  LandingPageContent,
} from "@/app/lib/preview-engine/types";

export const runtime = "nodejs";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

type PromptHints = {
  audience: string;
  creativeMessage: string;
  offerType: string;
  tone: string;
  platform: string;
  headline: string;
  ctaText: string;
  brand: string;
};

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function cleanList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function buildPromptHints(input: PreviewEngineInput): PromptHints {
  const analyzer = input.analyzerOutput ?? {};
  const goalOfferMap: Record<PreviewEngineInput["goal"], string> = {
    awareness: "brand awareness offer",
    consideration: "demo, consultation, or comparison offer",
    conversion: "direct purchase, signup, or claim-now offer",
    traffic: "click-through or visit-now offer",
    lead_generation: "form fill, free consultation, or lead capture offer",
    engagement: "social interaction or share-worthy content offer",
    app_installs: "app download or install-now offer",
    video_views: "watch-now or view full video offer",
    retargeting: "return offer or limited-time reminder",
  };

  return {
    audience: cleanText(analyzer.target_audience, `${input.vertical} buyers evaluating solutions`),
    creativeMessage: cleanText(analyzer.primary_message, input.headline ?? `${input.vertical} growth value proposition`),
    offerType: cleanText(input.ctaText, goalOfferMap[input.goal]),
    tone: input.goal === "awareness" ? "brand-forward and modern" : input.goal === "consideration" ? "credible and persuasive" : "urgent and conversion-focused",
    platform: cleanText(analyzer.platform, "display advertising"),
    headline: cleanText(input.headline, `Built for ${input.vertical} performance`),
    ctaText: cleanText(input.ctaText, input.goal === "conversion" ? "Get Started" : "Learn More"),
    brand: cleanText(analyzer.brand, ""),
  };
}

function buildFallbackLandingPage(vertical: string, goal: PreviewEngineInput["goal"], hints: PromptHints): LandingPageContent {
  const primaryCta = hints.ctaText;
  const secondaryCta = goal === "conversion" ? "View Pricing" : "See How It Works";

  return {
    hero: {
      headline: cleanText(hints.headline, `Drive better ${vertical} performance with a sharper landing flow`),
      subheadline: `${hints.creativeMessage}. Built for ${hints.audience} with a clean conversion path that feels like a real commercial destination.`,
      primaryCta,
      secondaryCta,
      supportingBullets: [
        "Clear above-the-fold value proposition",
        "Proof-led page structure that reduces bounce",
        "Conversion journey aligned to real buyer intent",
      ],
      trustIndicators: [
        `Trusted by leading ${vertical} teams`,
        "High-converting page architecture",
        "Launch-ready commercial messaging",
      ],
    },
    valueProposition: {
      sectionTitle: `Why ${hints.audience} convert faster here`,
      features: [
        { title: "Sharper message match", description: "Align creative intent with the page promise in seconds.", iconIdea: "Target with spark accent" },
        { title: "Proof at the right moment", description: "Use trust blocks and outcome signals before hesitation starts.", iconIdea: "Shield with rating star" },
        { title: "Lower-friction action", description: "Move visitors from interest to action with cleaner CTA hierarchy.", iconIdea: "Arrow moving through funnel" },
      ],
    },
    socialProof: {
      testimonials: [
        { quote: `“This feels like a real ${vertical} destination page, not a mockup. Our team could use it immediately.”`, name: "Ava Chen", role: "Growth Lead" },
        { quote: "“The page structure made the offer clearer and improved trust instantly.”", name: "Marcus Reed", role: "Performance Manager" },
        { quote: "“The conversion path is cleaner, faster, and much easier to evaluate.”", name: "Priya Sinha", role: "Digital Marketing Director" },
      ],
      ratingSummary: "4.8/5 average satisfaction from commercial design reviews",
      trustStatement: `Built to feel native inside live ${vertical} website experiences.`,
    },
    offerPromotion: {
      headline: goal === "conversion" ? "Launch your highest-converting page faster" : "Turn attention into qualified intent",
      explanation: `Use ${hints.offerType} messaging with a commercial landing structure designed for ${hints.audience}.`,
      urgency: goal === "conversion" ? "Limited launch window for peak campaign demand." : "Early movers capture attention before the category gets crowded.",
      ctaText: primaryCta,
    },
    howItWorks: [
      { title: "Connect the message", description: "Match the page headline to the creative promise." },
      { title: "Build trust quickly", description: "Surface proof, outcomes, and relevance above hesitation points." },
      { title: "Drive the action", description: "Guide users to one clear CTA with minimal friction." },
    ],
    benefits: [
      "Increase qualified engagement",
      "Reduce bounce from message mismatch",
      "Make offers feel more credible",
      "Improve conversion confidence",
    ],
    finalConversion: {
      headline: `Ready to turn ${hints.audience} into action?`,
      valueStatement: `Deploy a commercial landing experience built around clarity, proof, and conversion momentum for ${vertical}.`,
      ctaText: primaryCta,
    },
    footer: {
      companyDescription: `${vertical} growth platform focused on commercial landing experiences that convert.`,
      navigationLinks: ["Overview", "Features", "Proof", "Pricing", "Contact"],
      legalMessaging: "Secure experience. Privacy-first. Trusted commercial platform.",
    },
  };
}

function normalizeGeneratedEnvironment(
  raw: Partial<GeneratedEnvironment> & { landingPage?: Partial<LandingPageContent> },
  env: EnvironmentFamily,
  vertical: string,
  goal: PreviewEngineInput["goal"],
  hints: PromptHints
): GeneratedEnvironment {
  const fallbackLandingPage = buildFallbackLandingPage(vertical, goal, hints);
  const landingPage: LandingPageContent = {
    hero: {
      headline: cleanText(raw.landingPage?.hero?.headline, fallbackLandingPage.hero.headline),
      subheadline: cleanText(raw.landingPage?.hero?.subheadline, fallbackLandingPage.hero.subheadline),
      primaryCta: cleanText(raw.landingPage?.hero?.primaryCta, fallbackLandingPage.hero.primaryCta),
      secondaryCta: cleanText(raw.landingPage?.hero?.secondaryCta, fallbackLandingPage.hero.secondaryCta),
      supportingBullets: cleanList(raw.landingPage?.hero?.supportingBullets, fallbackLandingPage.hero.supportingBullets),
      trustIndicators: cleanList(raw.landingPage?.hero?.trustIndicators, fallbackLandingPage.hero.trustIndicators),
    },
    valueProposition: {
      sectionTitle: cleanText(raw.landingPage?.valueProposition?.sectionTitle, fallbackLandingPage.valueProposition.sectionTitle),
      features: Array.isArray(raw.landingPage?.valueProposition?.features) && raw.landingPage?.valueProposition?.features.length > 0
        ? raw.landingPage.valueProposition.features.map((feature, index) => ({
            title: cleanText(feature?.title, fallbackLandingPage.valueProposition.features[index]?.title ?? fallbackLandingPage.valueProposition.features[0].title),
            description: cleanText(feature?.description, fallbackLandingPage.valueProposition.features[index]?.description ?? fallbackLandingPage.valueProposition.features[0].description),
            iconIdea: cleanText(feature?.iconIdea, fallbackLandingPage.valueProposition.features[index]?.iconIdea ?? fallbackLandingPage.valueProposition.features[0].iconIdea),
          })).slice(0, 6)
        : fallbackLandingPage.valueProposition.features,
    },
    socialProof: {
      testimonials: Array.isArray(raw.landingPage?.socialProof?.testimonials) && raw.landingPage?.socialProof?.testimonials.length > 0
        ? raw.landingPage.socialProof.testimonials.map((item, index) => ({
            quote: cleanText(item?.quote, fallbackLandingPage.socialProof.testimonials[index]?.quote ?? fallbackLandingPage.socialProof.testimonials[0].quote),
            name: cleanText(item?.name, fallbackLandingPage.socialProof.testimonials[index]?.name ?? fallbackLandingPage.socialProof.testimonials[0].name),
            role: cleanText(item?.role, fallbackLandingPage.socialProof.testimonials[index]?.role ?? fallbackLandingPage.socialProof.testimonials[0].role),
          })).slice(0, 3)
        : fallbackLandingPage.socialProof.testimonials,
      ratingSummary: cleanText(raw.landingPage?.socialProof?.ratingSummary, fallbackLandingPage.socialProof.ratingSummary),
      trustStatement: cleanText(raw.landingPage?.socialProof?.trustStatement, fallbackLandingPage.socialProof.trustStatement),
    },
    offerPromotion: {
      headline: cleanText(raw.landingPage?.offerPromotion?.headline, fallbackLandingPage.offerPromotion.headline),
      explanation: cleanText(raw.landingPage?.offerPromotion?.explanation, fallbackLandingPage.offerPromotion.explanation),
      urgency: cleanText(raw.landingPage?.offerPromotion?.urgency, fallbackLandingPage.offerPromotion.urgency),
      ctaText: cleanText(raw.landingPage?.offerPromotion?.ctaText, fallbackLandingPage.offerPromotion.ctaText),
    },
    howItWorks: Array.isArray(raw.landingPage?.howItWorks) && raw.landingPage?.howItWorks.length > 0
      ? raw.landingPage.howItWorks.map((step, index) => ({
          title: cleanText(step?.title, fallbackLandingPage.howItWorks[index]?.title ?? fallbackLandingPage.howItWorks[0].title),
          description: cleanText(step?.description, fallbackLandingPage.howItWorks[index]?.description ?? fallbackLandingPage.howItWorks[0].description),
        })).slice(0, 3)
      : fallbackLandingPage.howItWorks,
    benefits: cleanList(raw.landingPage?.benefits, fallbackLandingPage.benefits),
    finalConversion: {
      headline: cleanText(raw.landingPage?.finalConversion?.headline, fallbackLandingPage.finalConversion.headline),
      valueStatement: cleanText(raw.landingPage?.finalConversion?.valueStatement, fallbackLandingPage.finalConversion.valueStatement),
      ctaText: cleanText(raw.landingPage?.finalConversion?.ctaText, fallbackLandingPage.finalConversion.ctaText),
    },
    footer: {
      companyDescription: cleanText(raw.landingPage?.footer?.companyDescription, fallbackLandingPage.footer.companyDescription),
      navigationLinks: cleanList(raw.landingPage?.footer?.navigationLinks, fallbackLandingPage.footer.navigationLinks),
      legalMessaging: cleanText(raw.landingPage?.footer?.legalMessaging, fallbackLandingPage.footer.legalMessaging),
    },
  };

  return {
    layoutType: cleanText(raw.layoutType, `landing-${env}`),
    pageTitle: cleanText(raw.pageTitle, landingPage.hero.headline),
    publisherName: cleanText(raw.publisherName, hints.brand || `${vertical} Studio`),
    landingPage,
    contextBlocks: [
      { type: "label", text: landingPage.valueProposition.sectionTitle },
      { type: "headline", text: landingPage.hero.headline },
      { type: "body", text: landingPage.hero.subheadline },
      { type: "body", text: landingPage.finalConversion.valueStatement },
      ...landingPage.hero.trustIndicators.slice(0, 3).map((item) => ({ type: "stat" as const, text: item })),
      ...landingPage.benefits.slice(0, 3).map((item) => ({ type: "list-item" as const, text: item })),
    ],
    uiModules: [
      {
        type: "trending",
        label: "Hero support",
        items: landingPage.hero.supportingBullets.slice(0, 4).map((item) => ({ type: "list-item", text: item })),
      },
      {
        type: "sidebar-widget",
        label: "Social proof",
        items: landingPage.socialProof.testimonials.slice(0, 3).map((item) => ({ type: "card", text: item.name, secondary: `${item.role} • ${item.quote}` })),
      },
    ],
  };
}

// ── Environment content prompt ─────────────────────────────────────────────────
function buildContentPrompt(
  env: EnvironmentFamily,
  vertical: string,
  goal: string,
  hints: PromptHints
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

  return `ROLE:
You are an expert Conversion Copywriter, UX Strategist, and Commercial Landing Page Designer.

Your job is NOT to write articles or blog posts.
Your job is to generate REAL WEBSITE LANDING PAGE CONTENT designed for marketing conversion.

IMPORTANT RULES:
- NEVER create article-style content.
- NEVER write long paragraphs like a blog.
- NEVER use editorial or news tone.
- ALWAYS create commercial website content.
- Content must look like a modern SaaS, E-commerce, Finance, Healthcare, or Brand landing page.
- Write concise, high-conversion copy.
- Use marketing psychology and UX hierarchy.

INPUT CONTEXT:
- Website environment: ${envDescriptions[env]}
- Industry Vertical: ${vertical}
- Campaign Goal: ${goal}
- Target Audience: ${hints.audience}
- Creative Message: ${hints.creativeMessage}
- Offer Type: ${hints.offerType}
- Tone: ${hints.tone}
- Platform Source: ${hints.platform}
- Detected Headline: ${hints.headline}
- Detected CTA: ${hints.ctaText}

OUTPUT REQUIREMENT:
Generate structured LANDING PAGE CONTENT following REAL WEBSITE hierarchy.

Return ONLY a valid JSON object with this exact structure:
{
  "layoutType": "<landing-page layout name>",
  "pageTitle": "<realistic commercial landing page title>",
  "publisherName": "<realistic brand or platform name>",
  "landingPage": {
    "hero": {
      "headline": "<powerful, benefit-driven headline>",
      "subheadline": "<clarifies value>",
      "primaryCta": "<primary CTA text>",
      "secondaryCta": "<secondary CTA text>",
      "supportingBullets": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
      "trustIndicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"]
    },
    "valueProposition": {
      "sectionTitle": "<section title>",
      "features": [
        { "title": "<feature title>", "description": "<short benefit description>", "iconIdea": "<icon idea>" },
        { "title": "<feature title>", "description": "<short benefit description>", "iconIdea": "<icon idea>" },
        { "title": "<feature title>", "description": "<short benefit description>", "iconIdea": "<icon idea>" }
      ]
    },
    "socialProof": {
      "testimonials": [
        { "quote": "<testimonial>", "name": "<customer name>", "role": "<role>" },
        { "quote": "<testimonial>", "name": "<customer name>", "role": "<role>" },
        { "quote": "<testimonial>", "name": "<customer name>", "role": "<role>" }
      ],
      "ratingSummary": "<rating summary>",
      "trustStatement": "<trust statement>"
    },
    "offerPromotion": {
      "headline": "<offer headline>",
      "explanation": "<offer explanation>",
      "urgency": "<urgency element>",
      "ctaText": "<CTA button text>"
    },
    "howItWorks": [
      { "title": "<step 1>", "description": "<short explanation>" },
      { "title": "<step 2>", "description": "<short explanation>" },
      { "title": "<step 3>", "description": "<short explanation>" }
    ],
    "benefits": ["<benefit 1>", "<benefit 2>", "<benefit 3>", "<benefit 4>"],
    "finalConversion": {
      "headline": "<strong closing headline>",
      "valueStatement": "<reinforced value statement>",
      "ctaText": "<final CTA text>"
    },
    "footer": {
      "companyDescription": "<short company description>",
      "navigationLinks": ["<link 1>", "<link 2>", "<link 3>", "<link 4>"],
      "legalMessaging": "<legal/trust messaging>"
    }
  }
}

STYLE GUIDELINES:
- Short blocks of text
- Marketing-focused language
- Conversion optimized
- Clear hierarchy
- Realistic website tone
- Modern startup or brand voice
- Avoid filler words
- Avoid storytelling articles

VERY IMPORTANT:
- Content must feel like it belongs inside a LIVE commercial website where ads or creatives naturally exist.
- Even for news-like environments, generate a conversion-focused commercial landing page or branded microsite, never a news article.
- Do not add explanations.
- Return valid JSON only.`;
}

// ── Fallback content generator (no AI needed) ─────────────────────────────────
function buildFallbackContent(
  env: EnvironmentFamily,
  vertical: string,
  goal: PreviewEngineInput["goal"],
  hints: PromptHints
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

  return normalizeGeneratedEnvironment({
    layoutType: env === "commerce" ? "landing-commerce" : env === "social" ? "landing-social" : env === "saas" ? "landing-saas" : "landing-page",
    pageTitle: `${vertical} Growth Platform — ${publisherNames[env]}`,
    publisherName: publisherNames[env],
    landingPage: buildFallbackLandingPage(vertical, goal, hints),
  }, env, vertical, goal, hints);
}

// ── Main POST handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as PreviewEngineInput;
    const { preferredEnvironment, vertical, goal, device, creativeSize, creativeType, analyzerOutput, ctaText, headline, logoPresent, riskFlags } = body;

    if (!vertical || !goal) {
      return NextResponse.json(
        { error: "vertical and goal are required" },
        { status: 400 }
      );
    }

    const environment = preferredEnvironment ?? selectEnvironmentFamily(vertical, goal);
  const promptHints = buildPromptHints(body);
    let generatedEnv: GeneratedEnvironment;

    // Try AI content generation, fall back to deterministic content
    try {
      const client = getClient();
      const prompt = buildContentPrompt(environment, vertical, goal, promptHints);

      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Partial<GeneratedEnvironment> & { landingPage?: Partial<LandingPageContent> };
      generatedEnv = normalizeGeneratedEnvironment(parsed, environment, vertical, goal, promptHints);
    } catch (aiErr) {
      console.warn("[preview-engine] AI content generation failed, using fallback:", aiErr);
      generatedEnv = buildFallbackContent(environment, vertical, goal, promptHints);
    }

    const output = buildPreviewEngineOutput(
      { preferredEnvironment, vertical, goal, device, creativeSize, creativeType, analyzerOutput, ctaText, headline, logoPresent, riskFlags },
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
