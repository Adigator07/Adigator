/**
 * AI Service - Marketing Creative Intelligence Engine
 * Converts OCR text into marketing performance analysis
 */

import OpenAI from "openai";

/* ===============================
   RESULT TYPE
================================*/

export interface CreativeAnalysisResult {
  vertical: string;
  hook: string;
  hookType: string;
  cta: string;
  offer: string;
  targetAudience: string;
  valueProposition: string;
  painPoint: string;
  emotionalTrigger: string;
  conversionScore: number;
  verticalFitScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommendedCTAs: string[];
  missingElements: string[];
}

/* ===============================
   OPENAI CLIENT
================================*/

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  return new OpenAI({ apiKey });
}

/* ===============================
   MAIN ANALYSIS FUNCTION
================================*/

export async function analyzeCreativeWithAI(
  text: string,
  vertical: string = "General"
): Promise<CreativeAnalysisResult> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("No OCR text provided");
    }

    const client = getOpenAIClient();

    /* ---------- SYSTEM PROMPT ---------- */

    const systemPrompt = `
You are an elite senior performance marketing strategist, creative director, and conversion optimization expert.

You specialize in analyzing advertising creatives across multiple INDUSTRY VERTICALS.

You think like someone managing multi-million dollar ad budgets on Meta, Google, TikTok, and YouTube Ads.

Your task is to analyze marketing creatives based on persuasion psychology, conversion science, and vertical-specific advertising principles.

----------------------------------------------------
SELECTED INDUSTRY VERTICAL:
${vertical}
----------------------------------------------------

You MUST adapt your evaluation logic based on the selected vertical.

VERTICAL INTELLIGENCE RULES:

Healthcare:
- Trust, credibility, safety
- Authority & compliance tone
- Emotional reassurance
- Avoid aggressive selling

Technology:
- Innovation positioning
- Problem → Solution clarity
- Feature translated into benefit
- Efficiency messaging

Automotive:
- Lifestyle aspiration
- Performance + reliability
- Ownership pride
- Visual imagination triggers

News / Media:
- Curiosity-driven hooks
- Speed & urgency
- Authority voice

Sports:
- Motivation & performance energy
- Competitive mindset
- Achievement framing

Business / Finance:
- ROI clarity
- Data-backed claims
- Professional trust
- Growth positioning

Luxury:
- Exclusivity
- Prestige signaling
- Minimal but powerful messaging
- Emotional aspiration

Travel / Hotels:
- Escape & experience
- Emotional visualization
- Relaxation & discovery

Restaurants / Food:
- Appetite appeal
- Sensory language
- Immediate craving trigger
- Local urgency

Banking / FinTech:
- Security & trust
- Simplicity
- Financial empowerment

Real Estate:
- Lifestyle upgrade
- Investment logic
- Long-term value framing

Education / EdTech:
- Transformation promise
- Career outcome focus
- Skill advancement

Gaming:
- Excitement & immersion
- Reward loops
- Competitive or social motivation

Entertainment / OTT / Streaming:
- Curiosity
- Emotional engagement
- Story intrigue

E-commerce / Retail:
- Offer clarity
- Urgency
- Discount psychology
- Friction reduction

----------------------------------------------------
ANALYSIS REQUIREMENTS
----------------------------------------------------

Analyze the marketing creative and extract:

1. Primary Hook
2. Hook Type
3. Call To Action (CTA)
4. Offer Strength
5. Target Audience
6. Core Value Proposition
7. Customer Pain Point
8. Emotional Trigger Used
9. Conversion Readiness
10. Vertical Alignment Quality

You MUST:
- Detect implied CTA if missing
- Identify weak persuasion
- Evaluate conversion psychology
- Judge performance relative to vertical standards
- Think like a paid ads performance expert

----------------------------------------------------

verticalFitScore:
Measures how well messaging matches industry expectations.

----------------------------------------------------
RETURN STRICT JSON ONLY
NO explanations.
NO extra text.
NO markdown.
ONLY valid JSON.

{
  "vertical": "",
  "hook": "",
  "hookType": "",
  "cta": "",
  "offer": "",
  "targetAudience": "",
  "valueProposition": "",
  "painPoint": "",
  "emotionalTrigger": "",
  "conversionScore": 0,
  "verticalFitScore": 0,
  "strengths": [],
  "weaknesses": [],
  "improvements": [],
  "recommendedCTAs": [],
  "missingElements": []
}
`;

    /* ---------- USER PROMPT ---------- */

    const userPrompt = `
Marketing Creative Text (OCR Output):

${text}

Context:
Text extracted from a marketing advertisement image.
Analyze conversion performance based on the provided framework.
`;

    /* ---------- OPENAI CALL ---------- */

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = JSON.parse(content);

    /* ---------- SAFE RETURN ---------- */

    return {
      vertical: parsed.vertical || vertical,
      hook: parsed.hook || "",
      hookType: parsed.hookType || "",
      cta: parsed.cta || "",
      offer: parsed.offer || "",
      targetAudience: parsed.targetAudience || "",
      valueProposition: parsed.valueProposition || "",
      painPoint: parsed.painPoint || "",
      emotionalTrigger: parsed.emotionalTrigger || "",
      conversionScore: Number(parsed.conversionScore || 50),
      verticalFitScore: Number(parsed.verticalFitScore || 50),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      recommendedCTAs: Array.isArray(parsed.recommendedCTAs) ? parsed.recommendedCTAs : [],
      missingElements: Array.isArray(parsed.missingElements) ? parsed.missingElements : [],
    };
  } catch (error) {
    console.error("Creative AI analysis error:", error);

    throw new Error(
      `AI Creative Analysis Failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/* ===============================
   OPTIONAL QUICK SCORE ONLY
================================*/

export async function getConversionScore(text: string): Promise<number> {
  const result = await analyzeCreativeWithAI(text);
  return result.conversionScore;
}