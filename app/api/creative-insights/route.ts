import { analyzeCreativeWithAI, type CreativeAnalysisResult } from "../../lib/ai";

interface CreativeInsightsPayload {
  extractedText?: string;
  ocrText?: string;
}

interface LegacyAIInsightsResponse {
  contextSummary: string;
  emotion: string;
  insights: string[];
  improvements: string[];
}

function toLegacyShape(result: CreativeAnalysisResult): LegacyAIInsightsResponse {
  return {
    contextSummary: [
      result.hook && `Hook: ${result.hook}`,
      result.cta && `CTA: ${result.cta}`,
      result.offer && `Offer: ${result.offer}`,
      result.valueProposition && `Value: ${result.valueProposition}`,
    ]
      .filter(Boolean)
      .join(" | "),
    emotion: result.emotionalTrigger || "neutral",
    insights: [
      result.targetAudience && `Target audience: ${result.targetAudience}`,
      `Conversion strength: ${result.conversionScore}/100`,
      result.hookType && `Hook type: ${result.hookType}`,
      ...result.weaknesses.slice(0, 2),
    ]
      .filter(Boolean)
      .slice(0, 4) as string[],
    improvements: result.improvements.slice(0, 4),
  };
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as CreativeInsightsPayload;
  const ocrText = String(payload?.ocrText || payload?.extractedText || "").trim();

  if (!ocrText) {
    return Response.json({ error: "Missing OCR text. Provide extractedText or ocrText." }, { status: 400 });
  }

  try {
    const result = await analyzeCreativeWithAI(ocrText);
    return Response.json({
      ...result,
      aiInsights: toLegacyShape(result),
      provider: "openai",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Creative analysis failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
