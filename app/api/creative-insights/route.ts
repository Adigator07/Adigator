interface CreativeInsightsPayload {
  goal: "awareness" | "consideration" | "conversion";
  extractedText: string;
  signals: {
    eligibilityScore: number;
    attentionScore: number;
    performanceScore: number;
    finalScore: number;
    ctaDetected: boolean;
    ctaStrength: "low" | "medium" | "high";
    isBlurry: boolean;
    contrast: number;
    clarity: number;
    goalAlignment: number;
    emotionalAppeal: "HIGH" | "MEDIUM" | "LOW";
  };
}

interface AIInsightsResponse {
  contextSummary: string;
  emotion: string;
  insights: string[];
  improvements: string[];
}

function fallbackInsights(payload: CreativeInsightsPayload): AIInsightsResponse {
  const { signals, goal } = payload;
  const insights: string[] = [];
  const improvements: string[] = [];

  if (!signals.ctaDetected) {
    insights.push("No CTA detected in extracted creative text");
    improvements.push(goal === "conversion" ? "Add a high-intent CTA such as Buy Now or Start Now" : "Add a clear CTA aligned to campaign objective");
  }

  if (signals.isBlurry) {
    insights.push("Visual blur is reducing message legibility");
    improvements.push("Use a sharper source image or re-export from a higher-resolution original");
  }

  if (signals.contrast < 35) {
    insights.push("Low contrast weakens attention capture and readability");
    improvements.push("Increase text-background contrast with darker overlay or brighter foreground text");
  }

  if (signals.goalAlignment < 50) {
    insights.push("Creative message is misaligned with selected funnel goal");
    improvements.push("Rewrite headline and CTA to fit funnel intent and reduce mixed signals");
  }

  if (insights.length === 0) {
    insights.push("Signals are broadly aligned with campaign objective");
    improvements.push("A/B test headline emphasis and CTA placement for incremental gains");
  }

  return {
    contextSummary: `Goal ${goal} | Eligibility ${signals.eligibilityScore} | Attention ${signals.attentionScore} | Performance ${signals.performanceScore}`,
    emotion: signals.emotionalAppeal === "HIGH" ? "high-intensity" : signals.emotionalAppeal === "MEDIUM" ? "balanced" : "functional",
    insights: insights.slice(0, 4),
    improvements: improvements.slice(0, 4),
  };
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as CreativeInsightsPayload;

  if (!payload?.goal || !payload?.signals) {
    return Response.json({ error: "Invalid creative insights payload" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json({ aiInsights: fallbackInsights(payload), provider: "fallback" });
  }

  const prompt = [
    "You are an ad creative intelligence assistant.",
    "Use only the provided signals; do not invent metrics or probabilities.",
    "Return strict JSON with keys: contextSummary, emotion, insights, improvements.",
    "Keep each list max 4 items, concise and actionable.",
    `Goal: ${payload.goal}`,
    `Extracted Text: ${payload.extractedText || "(none)"}`,
    `Signals: ${JSON.stringify(payload.signals)}`,
  ].join("\n");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          topP: 0.1,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      return Response.json({ aiInsights: fallbackInsights(payload), provider: "fallback" });
    }

    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw || typeof raw !== "string") {
      return Response.json({ aiInsights: fallbackInsights(payload), provider: "fallback" });
    }

    const parsed = JSON.parse(raw) as Partial<AIInsightsResponse>;
    const aiInsights: AIInsightsResponse = {
      contextSummary: String(parsed.contextSummary || fallbackInsights(payload).contextSummary),
      emotion: String(parsed.emotion || fallbackInsights(payload).emotion),
      insights: Array.isArray(parsed.insights) ? parsed.insights.map(String).slice(0, 4) : fallbackInsights(payload).insights,
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String).slice(0, 4) : fallbackInsights(payload).improvements,
    };

    return Response.json({ aiInsights, provider: "gemini" });
  } catch {
    return Response.json({ aiInsights: fallbackInsights(payload), provider: "fallback" });
  }
}
