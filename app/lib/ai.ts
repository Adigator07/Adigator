/**
 * AI Service - Marketing Creative Intelligence Engine
 * Converts OCR text into marketing performance analysis
 */

import OpenAI from "openai";

/* ===============================
   RESULT TYPE
================================*/

export interface CreativeAnalysisResult {
  hook: string;
  hookType: string;
  cta: string;
  offer: string;
  targetAudience: string;
  valueProposition: string;
  painPoint: string;
  emotionalTrigger: string;
  conversionScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
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
  text: string
): Promise<CreativeAnalysisResult> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("No OCR text provided");
    }

    const client = getOpenAIClient();

    /* ---------- SYSTEM PROMPT ---------- */

    const systemPrompt = `
You are a senior marketing strategist and paid ads conversion expert.

You analyze advertising creatives extracted from images.

Your role:
- Detect marketing psychology
- Identify conversion elements
- Evaluate performance potential

Return STRICT JSON:

{
  "hook": "",
  "hookType": "question | urgency | curiosity | benefit | fear | social proof",
  "cta": "",
  "offer": "",
  "targetAudience": "",
  "valueProposition": "",
  "painPoint": "",
  "emotionalTrigger": "",
  "conversionScore": 0-100,
  "strengths": [],
  "weaknesses": [],
  "improvements": []
}

Rules:
- Detect IMPLIED CTA if not explicit.
- Think like a performance marketer.
- Score conversion likelihood realistically.
- Never behave like document analysis.
`;

    /* ---------- USER PROMPT ---------- */

    const userPrompt = `
Marketing Creative Text (OCR Output):

${text}

Context:
Text extracted from a marketing advertisement image.
Analyze conversion performance.
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
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = JSON.parse(content);

    /* ---------- SAFE RETURN ---------- */

    return {
      hook: parsed.hook ?? "",
      hookType: parsed.hookType ?? "",
      cta: parsed.cta ?? "",
      offer: parsed.offer ?? "",
      targetAudience: parsed.targetAudience ?? "",
      valueProposition: parsed.valueProposition ?? "",
      painPoint: parsed.painPoint ?? "",
      emotionalTrigger: parsed.emotionalTrigger ?? "",
      conversionScore: Number(parsed.conversionScore ?? 50),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [],
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