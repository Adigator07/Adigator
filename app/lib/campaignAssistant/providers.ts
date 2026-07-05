import OpenAI from "openai";

import type {
  CampaignAssistantQuestion,
  CampaignContextAssessmentInput,
  CampaignContextAssessmentResult,
} from "@/app/lib/campaignAssistant/types";
import { CONFIDENCE_THRESHOLD } from "@/app/lib/campaignAssistant/deterministicAssessment";

type RawAssessment = {
  confidence?: number;
  should_ask_user?: boolean;
  reasoning?: string;
  missing_areas?: string[];
  questions?: Array<{
    id?: string;
    prompt?: string;
    why_needed?: string;
    maps_to?: string;
    placeholder?: string;
  }>;
};

const VALID_MAPS_TO = new Set([
  "campaign_brief",
  "campaign_goal",
  "campaign_vertical",
  "product_focus",
  "audience",
  "offer",
  "landing_url",
  "advertiser",
  "general",
]);

function buildAssessmentPrompt(input: CampaignContextAssessmentInput): string {
  return `Evaluate whether an ad campaign analyzer can run with HIGH confidence using only the inputs below.

Return ONLY JSON:
{
  "confidence": 0.0,
  "should_ask_user": false,
  "reasoning": "",
  "missing_areas": [],
  "questions": [
    {
      "id": "stable_snake_case_id",
      "prompt": "Question for the user",
      "why_needed": "One sentence",
      "maps_to": "campaign_brief|campaign_goal|campaign_vertical|product_focus|audience|offer|landing_url|advertiser|general",
      "placeholder": "optional example"
    }
  ]
}

Rules:
- confidence 0.0-1.0 where >=0.72 means analysis can proceed without user interruption
- should_ask_user true only when confidence < 0.72 AND specific missing facts would materially improve analysis
- Ask at most 5 targeted questions — never a generic fixed questionnaire
- Only ask about information that is missing or ambiguous in the inputs
- Do not ask if the brief already clearly states goal, audience, product, and offer
- Questions must be specific to this campaign context

Campaign inputs:
Platform: ${input.platform}
Task type: ${input.programmaticTaskType || "n/a"}
Campaign name: ${input.campaignName || "n/a"}
Advertiser: ${input.advertiserName || "n/a"}
Goal: ${input.campaignGoal || "n/a"}
Vertical: ${input.campaignVertical || "n/a"}
Audience stage: ${input.campaignAudienceStage || "n/a"}
Product focus: ${input.campaignProductFocus || "n/a"}
Landing URL: ${input.landingUrl || "n/a"}
Creative count: ${input.creativeCount ?? 0}
Creative names: ${(input.creativeNames || []).slice(0, 8).join(", ") || "n/a"}
Prior clarifications already stored: ${input.hasPriorClarifications ? "yes" : "no"}

Campaign brief:
${(input.campaignBrief || "").trim() || "(empty)"}`;
}

function normalizeAssessment(raw: RawAssessment, provider: CampaignContextAssessmentResult["provider"]): CampaignContextAssessmentResult {
  const confidence = typeof raw.confidence === "number"
    ? Math.max(0, Math.min(1, raw.confidence))
    : 0.5;

  const questions: CampaignAssistantQuestion[] = (Array.isArray(raw.questions) ? raw.questions : [])
    .slice(0, 5)
    .map((item, index) => {
      const mapsTo = VALID_MAPS_TO.has(String(item.maps_to))
        ? item.maps_to as CampaignAssistantQuestion["mapsTo"]
        : "general";
      return {
        id: String(item.id || `question_${index + 1}`).trim(),
        prompt: String(item.prompt || "").trim(),
        whyNeeded: String(item.why_needed || "This detail improves analysis accuracy.").trim(),
        mapsTo,
        placeholder: item.placeholder ? String(item.placeholder).trim() : undefined,
      };
    })
    .filter((item) => item.prompt);

  const shouldAsk = typeof raw.should_ask_user === "boolean"
    ? raw.should_ask_user
    : confidence < CONFIDENCE_THRESHOLD && questions.length > 0;

  return {
    confidence,
    shouldAsk: shouldAsk && questions.length > 0,
    reasoning: String(raw.reasoning || "AI campaign context assessment completed.").trim(),
    missingAreas: Array.isArray(raw.missing_areas)
      ? raw.missing_areas.filter((item): item is string => typeof item === "string")
      : [],
    questions: shouldAsk ? questions : [],
    provider,
  };
}

function parseJsonContent(content: string): RawAssessment {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(candidate) as RawAssessment;
}

export async function assessWithOpenAI(
  input: CampaignContextAssessmentInput,
): Promise<CampaignContextAssessmentResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a campaign intake assistant for an ad validation platform. Return strict JSON only.",
      },
      { role: "user", content: buildAssessmentPrompt(input) },
    ],
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  return normalizeAssessment(parseJsonContent(content), "openai");
}

export async function assessWithDeepSeek(
  input: CampaignContextAssessmentInput,
): Promise<CampaignContextAssessmentResult | null> {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.NVIDIA_API_BASE || "https://integrate.api.nvidia.com/v1",
  });

  const completion = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || "deepseek-ai/deepseek-v3.1",
    messages: [
      {
        role: "system",
        content: "You are a campaign intake assistant for an ad validation platform. Return strict JSON only.",
      },
      { role: "user", content: buildAssessmentPrompt(input) },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  return normalizeAssessment(parseJsonContent(content), "deepseek");
}

export async function assessWithGemini(
  input: CampaignContextAssessmentInput,
): Promise<CampaignContextAssessmentResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildAssessmentPrompt(input) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 900,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) return null;
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) return null;
  return normalizeAssessment(parseJsonContent(text), "gemini");
}

export async function assessCampaignContextWithProviders(
  input: CampaignContextAssessmentInput,
): Promise<CampaignContextAssessmentResult | null> {
  try {
    const openAiResult = await assessWithOpenAI(input);
    if (openAiResult && openAiResult.confidence >= CONFIDENCE_THRESHOLD) {
      return { ...openAiResult, shouldAsk: false, questions: [] };
    }
    if (openAiResult && !openAiResult.shouldAsk) {
      return openAiResult;
    }
    if (openAiResult?.shouldAsk && openAiResult.questions.length) {
      return openAiResult;
    }
  } catch (error) {
    console.warn("[campaign-context-assessment] OpenAI failed:", error);
  }

  try {
    const deepSeekResult = await assessWithDeepSeek(input);
    if (deepSeekResult) return deepSeekResult;
  } catch (error) {
    console.warn("[campaign-context-assessment] DeepSeek failed:", error);
  }

  try {
    const geminiResult = await assessWithGemini(input);
    if (geminiResult) return geminiResult;
  } catch (error) {
    console.warn("[campaign-context-assessment] Gemini failed:", error);
  }

  return null;
}
