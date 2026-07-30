import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatContext = {
  step?: number;
  platform?: string | null;
  campaignGoal?: string | null;
  campaignVertical?: string | null;
  campaignName?: string;
  advertiserName?: string;
  hasLandingUrl?: boolean;
  missingSetupFields?: string[];
};

const MAX_MESSAGES = 16;
const MAX_TEXT_LENGTH = 2500;

function cleanText(value: unknown, maxLen = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
      const content = cleanText(item?.content);
      if (!role || !content) return null;
      return { role, content } as ChatMessage;
    })
    .filter((item): item is ChatMessage => Boolean(item))
    .slice(-MAX_MESSAGES);
}

function normalizeContext(input: unknown): ChatContext {
  const context = typeof input === "object" && input ? (input as Record<string, unknown>) : {};
  return {
    step: typeof context.step === "number" ? context.step : undefined,
    platform: typeof context.platform === "string" ? context.platform : null,
    campaignGoal: typeof context.campaignGoal === "string" ? context.campaignGoal : null,
    campaignVertical: typeof context.campaignVertical === "string" ? context.campaignVertical : null,
    campaignName: cleanText(context.campaignName, 120),
    advertiserName: cleanText(context.advertiserName, 120),
    hasLandingUrl: Boolean(context.hasLandingUrl),
    missingSetupFields: Array.isArray(context.missingSetupFields)
      ? context.missingSetupFields
        .filter((field): field is string => typeof field === "string")
        .map((field) => cleanText(field, 80))
        .filter(Boolean)
        .slice(0, 12)
      : [],
  };
}

function buildContextSummary(context: ChatContext): string {
  const lines: string[] = [];
  if (context.step) lines.push(`step: ${context.step}`);
  if (context.platform) lines.push(`platform: ${context.platform}`);
  if (context.campaignGoal) lines.push(`campaignGoal: ${context.campaignGoal}`);
  if (context.campaignVertical) lines.push(`campaignVertical: ${context.campaignVertical}`);
  if (context.campaignName) lines.push(`campaignName: ${context.campaignName}`);
  if (context.advertiserName) lines.push(`advertiserName: ${context.advertiserName}`);
  lines.push(`hasLandingUrl: ${context.hasLandingUrl ? "yes" : "no"}`);
  if (context.missingSetupFields?.length) {
    lines.push(`missingSetupFields: ${context.missingSetupFields.join(", ")}`);
  }
  return lines.join("\n");
}

function buildConversation(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n\n");
}

function normalizeModelId(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = cleanText(value, 180);
  return trimmed.startsWith("models/") ? trimmed.slice("models/".length) : trimmed;
}

function scoreGroqModel(modelId: string): number {
  const id = modelId.toLowerCase();
  let score = 0;

  if (id.includes("gpt-oss-120b")) score += 1000;
  if (id.includes("llama-3.3-70b-versatile")) score += 900;
  if (id.includes("llama-4") && id.includes("maverick")) score += 850;
  if (id.includes("llama-4") && id.includes("scout")) score += 800;
  if (id.includes("qwen") && id.includes("32b")) score += 760;
  if (id.includes("deepseek") && id.includes("70b")) score += 740;

  if (id.includes("versatile") || id.includes("instruct") || id.includes("chat")) score += 120;
  if (id.includes("preview") || id.includes("experimental")) score -= 60;

  return score;
}

function isLikelyTextModel(modelId: string): boolean {
  const id = modelId.toLowerCase();
  const blockedTokens = ["tts", "speech", "audio", "transcribe", "whisper", "vision"];
  if (blockedTokens.some((token) => id.includes(token))) return false;
  return true;
}

async function fetchGroqModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${GROQ_BASE_URL}/models`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) return [];
    const payload = await response.json();
    const models: Record<string, unknown>[] = Array.isArray(payload?.data) ? payload.data : [];

    const ids = models
      .map((model: Record<string, unknown>) => normalizeModelId(model?.id))
      .filter((id: string | null | undefined): id is string => typeof id === "string" && isLikelyTextModel(id));

    return [...new Set(ids)];
  } catch {
    return [];
  }
}

function buildGroqModelCandidates(discovered: string[]): string[] {
  const envModel = normalizeModelId(process.env.GROQ_MODEL || "");
  const fallbackModels = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "qwen/qwen3-32b",
    "deepseek-r1-distill-llama-70b",
  ];

  const sortedDiscovered = [...discovered].sort((a, b) => scoreGroqModel(b) - scoreGroqModel(a));
  return [...new Set([envModel, ...sortedDiscovered, ...fallbackModels].filter(Boolean))];
}

async function queryGroq(messages: ChatMessage[], context: ChatContext): Promise<{ reply: string; model: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server.");
  }

  const discoveredCandidates = await fetchGroqModels(apiKey);
  const modelCandidates = buildGroqModelCandidates(discoveredCandidates);

  const systemPrompt = [
    "You are Adigator Campaign Intelligence Studio Support.",
    "Help users identify and resolve campaign setup, validation, upload, and analysis issues.",
    "Keep answers concise, actionable, and specific to the provided context.",
    "When diagnosing, provide short steps users can execute immediately.",
    "If details are missing, ask one focused follow-up question.",
  ].join(" ");

  const contextPrompt = [
    "Current campaign context:",
    buildContextSummary(context) || "none",
    "",
    "Conversation so far:",
    buildConversation(messages) || "none",
  ].join("\n");

  if (!modelCandidates.length) {
    throw new Error("No Groq text models are available for this API key.");
  }

  let lastError = "Groq request failed with no response.";
  for (const model of modelCandidates) {
    const response = await fetch(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
          max_tokens: 900,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "system", content: contextPrompt },
            ...messages.map((message) => ({ role: message.role, content: message.content })),
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      lastError = `Groq request failed for ${model} (${response.status}): ${errorText}`;

      // Retry with next model when this candidate is incompatible or unavailable.
      if (response.status === 400 || response.status === 404) continue;
      throw new Error(lastError);
    }

    const payload = await response.json();
    const reply = payload?.choices?.[0]?.message?.content;
    const cleaned = cleanText(reply, 6000);
    if (cleaned) {
      return { reply: cleaned, model };
    }

    lastError = `Groq returned an empty response for ${model}.`;
  }

  throw new Error(lastError);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const messages = normalizeMessages(body?.messages);
    const context = normalizeContext(body?.context);

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUserMessage) {
      return NextResponse.json({ error: "Please provide a user message." }, { status: 400 });
    }

    const { reply, model } = await queryGroq(messages, context);
    return NextResponse.json({ reply, provider: "groq", model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process chat request.";
    console.error("[campaign-intelligence-chat]", message);
    const status = message.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
