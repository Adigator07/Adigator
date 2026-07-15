import "server-only";

import { createOpenAIClient } from "@/app/lib/engines/creativeExtraction";
import {
  buildLocalCampaignBriefInsights,
  normalizeCampaignBriefInsights,
  type CampaignBriefInsights,
  type CampaignBriefInsightsInput,
} from "@/app/lib/campaignBriefInsights";

const SYSTEM_PROMPT = `You are a senior media planner writing a Target Audience plan for paid media (Meta / Google / Programmatic).

Your job is NOT to invent generic "digital consumers". Your job is to read the campaign brief deeply and output audiences a media buyer would actually plug into targeting, grounded in THIS product, messaging, use cases, funnel stage, and who has a real reason to care.

Return JSON only with this shape:
{
  "campaign_intent": "1-3 sentences: what the campaign must achieve for this product and funnel",
  "target_audience": {
    "description": "One crisp sentence naming the core buyer in context of the product",
    "customer_type": "Short media label (e.g. Students & first-time MacBook buyers)",
    "primary_audience": ["5-8 specific primary segments"],
    "secondary_audience": ["3-6 adjacent / influencer / upgrader segments"],
    "interests": ["8-16 affinity / interest tags"],
    "demographics": {
      "age": "age range tied to the brief",
      "gender": "All / or specific if the brief requires it",
      "income": "income band that fits price and positioning",
      "education": "education / life-stage that fits",
      "location": "geo / market tier that fits"
    },
    "purchase_intent": ["6-12 in-market / search-style intents"],
    "remarketing": ["4-8 remarketing / CRM pools that fit this funnel"]
  }
}

How to analyze (do this mentally before answering):
1) Product and category: What is being sold or promoted? Price tier? Ecosystem?
2) Jobs-to-be-done: What will people DO with it (study, create, code, commute, run a business)?
3) Funnel: Awareness, interest/consideration, pre-order, purchase, retention? Who is warm vs cold?
4) Primary buyers: Who is most likely to act first? Name roles and situations, not vague age bands alone.
5) Secondary: Who influences the buy or buys later (parents, upgraders, SMBs, enthusiasts)?
6) Affinities: Brand ecosystem, competitor switches, tools, hobbies, communities mentioned or strongly implied.
7) In-market: Phrases people search when researching this product/use case.
8) Remarketing: Which pools follow from the funnel (site visitors, PDP viewers, cart abandoners, email, existing owners due for upgrade)? Only include what fits.

Quality bar (non-negotiable):
- Campaign-specific. Reject generics: "everyone", "online shoppers", "people interested in the product", "millennials", "gen z", "tech lovers" alone.
- Prefer concrete personas: "College students buying a first laptop for coursework and creative apps", "Existing iPhone users looking for their first Mac", "Professionals upgrading from older Windows laptops".
- Tie segments to product features and messaging in the brief (battery, AI, creative apps, portability, student pricing, etc.) when present.
- Primary ≈ who the campaign should spend most budget reaching. Secondary ≈ expansion / influence / later-stage.
- Interests = usable targeting tags (brands, categories, tools, lifestyles, JTBD), not slogans.
- Purchase intent = real search / in-market language for THIS offer and use cases.
- Remarketing must match stated funnel stages; do not invent loyalty pools if the brief is pure cold awareness with no CRM mention. Site/product visitors are still fine.
- If the brief is thin, infer the strongest plausible audience from product + objective + vertical, still product-linked and realistic.
- Never pad with fluff. Prefer fewer sharp segments over many vague ones.
- Do not invent unrelated markets (e.g. enterprise procurement for a consumer student laptop).

Tone: write like a media planning doc. Use specific, scannable labels a buyer can copy into targeting.
Never use em dashes or hyphen stacks between clauses. Prefer commas, periods, or colons.`;

function buildUserPrompt(input: CampaignBriefInsightsInput): string {
  return [
    "Analyze the brief and produce a precise Target Audience plan for paid media.",
    "",
    "Prioritize precision over generality. Name who buys, why they care, and how they research, for THIS campaign only.",
    "",
    `Campaign brief:\n${input.campaignBrief.trim()}`,
    input.campaignGoal ? `Selected objective: ${input.campaignGoal}` : "",
    input.vertical ? `Vertical: ${input.vertical}` : "",
    input.platform ? `Platform: ${input.platform}` : "",
    "",
    "Fill every list that the brief supports. Primary and interests are required whenever any product or audience signal exists.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** OpenAI brief insights. Server-only (must not be imported by client components). */
export async function generateCampaignBriefInsights(
  input: CampaignBriefInsightsInput,
): Promise<CampaignBriefInsights | null> {
  const brief = input.campaignBrief?.trim() || "";
  if (!brief) return null;

  const fallback = buildLocalCampaignBriefInsights(input);
  const openai = createOpenAIClient();
  if (!openai) return fallback;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    max_tokens: 1600,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const content = response.choices[0]?.message?.content || "{}";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return fallback;
  }

  return normalizeCampaignBriefInsights(parsed, fallback) || fallback;
}
