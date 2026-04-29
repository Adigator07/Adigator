import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// ── Schema (for system prompt reference only — Groq uses json_object mode) ──────
const responseSchema = {
  type: "object",
  properties: {
    funnel_stage:            { type: "string", enum: ["Awareness", "Consideration", "Conversion"] },
    confidence_score:        { type: "integer", description: "0-100" },
    reasoning:               { type: "string" },
    messaging_intent:        { type: "string", enum: ["Educational", "Emotional", "Persuasive", "Action-driven"] },
    urgency_level:           { type: "string", enum: ["Low", "Medium", "High"] },
    audience_type:           { type: "string", enum: ["Cold", "Warm", "Hot"] },
    cta_strength:            { type: "string", enum: ["Soft", "Medium", "Strong"] },
    improvement_suggestions: { type: "array", items: { type: "string" } },
  },
  required: [
    "funnel_stage", "confidence_score", "reasoning",
    "messaging_intent", "urgency_level", "audience_type",
    "cta_strength", "improvement_suggestions",
  ],
};

// ── Heuristic fallback (used when no/invalid API key) ───────────────────────────
function getMockResponse(targetGoal: string, ctaWord: string) {
  const hasConversionCTA   = ["buy", "shop", "install", "download", "sign up", "get", "claim", "order"].some(w => ctaWord.includes(w));
  const hasConsiderationCTA = ["compare", "features", "pricing", "details", "try", "check", "demo", "see"].some(w => ctaWord.includes(w));

  const base = {
    funnel_stage:            targetGoal,
    confidence_score:        50,
    reasoning:               "",
    messaging_intent:        "Educational" as string,
    urgency_level:           "Low" as string,
    audience_type:           "Cold" as string,
    cta_strength:            "Soft" as string,
    improvement_suggestions: [] as string[],
  };

  if (targetGoal === "Conversion") {
    base.messaging_intent = "Action-driven";
    base.urgency_level    = "High";
    base.audience_type    = "Hot";
    if (hasConversionCTA) {
      base.confidence_score = 91;
      base.cta_strength     = "Strong";
      base.reasoning        = "Strong fit for Conversion. The CTA is direct and action-oriented, which is exactly what a hot, ready-to-buy audience needs to take the final step.";
      base.improvement_suggestions = ["Add urgency signals like 'Limited offer' or a countdown to push fence-sitters.", "Ensure the landing page matches the CTA promise for minimal bounce."];
    } else {
      base.confidence_score = 28;
      base.cta_strength     = "Soft";
      base.reasoning        = "Poor fit for Conversion. Without a transactional CTA, the creative cannot convert intent into action — visitors have no clear next step.";
      base.improvement_suggestions = ["Replace the current CTA with a strong action verb like 'Buy Now', 'Sign Up', or 'Get Started'.", "Add scarcity elements (e.g., 'Only 3 left') to drive urgency.", "Move the CTA to a high-contrast button in the bottom-right — the natural eye-path endpoint."];
    }
  } else if (targetGoal === "Consideration") {
    base.messaging_intent = "Persuasive";
    base.urgency_level    = "Medium";
    base.audience_type    = "Warm";
    if (hasConsiderationCTA) {
      base.confidence_score = 87;
      base.cta_strength     = "Medium";
      base.reasoning        = "Good fit for Consideration. The creative invites evaluation and comparison, which maps well to a warm audience who is actively researching options.";
      base.improvement_suggestions = ["Highlight 2-3 key differentiators to help the audience compare you vs. competitors.", "Add a trust signal like star ratings or a recognizable client logo."];
    } else {
      base.confidence_score = 38;
      base.cta_strength     = "Soft";
      base.reasoning        = "Suboptimal for Consideration. Mid-funnel audiences need a reason to evaluate your product — a vague or missing CTA leaves them with no direction.";
      base.improvement_suggestions = ["Change CTA to 'Compare Plans', 'See How It Works', or 'View Features'.", "Add a value proposition statement above the CTA to anchor the decision.", "Consider showing a 'vs. competitor' visual to trigger comparison thinking."];
    }
  } else {
    // Awareness
    base.messaging_intent = "Educational";
    base.urgency_level    = "Low";
    base.audience_type    = "Cold";
    if (!hasConversionCTA && !hasConsiderationCTA) {
      base.confidence_score = 84;
      base.cta_strength     = "Soft";
      base.reasoning        = "Strong fit for Awareness. The creative uses a soft, informational tone that's ideal for introducing your brand to cold audiences who don't know you yet.";
      base.improvement_suggestions = ["Ensure your brand mark is visible in the first glance — most viewers decide in 0.3s.", "Use high-emotion imagery to trigger memory encoding in cold audiences.", "Keep copy under 7 words for maximum retention."];
    } else {
      base.confidence_score = 43;
      base.cta_strength     = "Strong";
      base.reasoning        = "Mismatched for Awareness. Using a transactional CTA on a cold audience creates friction — they haven't formed a need yet, so hard sells increase ad fatigue and lower brand trust.";
      base.improvement_suggestions = ["Soften the CTA to 'Learn More', 'Discover', or 'See Why'.", "Shift the copy focus from the product to the problem it solves.", "Use brand colors prominently so cold audiences start forming visual associations."];
    }
  }

  return base;
}

// ── Main route ──────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  let targetGoal = "Awareness";
  let ctaWord    = "";

  try {
    const body = await req.json();
    const { text, cta, goal, platform, audience, visualContext } = body;

    targetGoal = goal ? goal.charAt(0).toUpperCase() + goal.slice(1) : "Awareness";
    ctaWord    = cta ? cta.toLowerCase() : "";

    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      console.warn("[Adigator] No GROQ_API_KEY — using heuristic fallback.");
      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json(getMockResponse(targetGoal, ctaWord));
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are a senior performance marketer and ad creative strategist.
Analyze digital ads intelligently — NOT using fixed rules, keyword matching, or hardcoded CTA logic.
Think like a human marketer. Context matters more than CTA text alone.
You MUST respond strictly in valid JSON format matching this schema:
${JSON.stringify(responseSchema, null, 2)}`;

    const userPrompt = `Analyze the ad below and classify it for the given Target Goal.

Target Goal: ${goal}
Platform: ${platform}
Audience Type: ${audience}
Detected Ad Copy/Text: ${text || "None detected"}
Detected CTA: ${cta || "None detected"}
Visual Context: ${visualContext || "None"}

Framework:
1. Messaging Intent — educational, emotional, persuasive, or action-driven?
2. Urgency Level — Low / Medium / High
3. Audience Awareness — Cold / Warm / Hot
4. CTA Strength — Soft / Medium / Strong
5. Visual alignment — does design support branding, trust, or direct action?

Rules:
- "Buy Now" CTA does NOT automatically mean Conversion stage
- A missing CTA is fine for Awareness — do not penalize it
- Provide 2-3 specific, actionable improvement_suggestions as a marketer would say them`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.15,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty Groq response");

      const result = JSON.parse(raw);
      return NextResponse.json(result);

    } catch (groqErr: any) {
      // Graceful fallback — do NOT return 500
      console.warn("[Adigator] Groq request failed, using heuristic fallback:", groqErr?.message ?? groqErr);
      return NextResponse.json(getMockResponse(targetGoal, ctaWord));
    }

  } catch (err: any) {
    // Last-resort fallback — still return 200 so frontend never crashes
    console.error("[Adigator] Critical route error:", err);
    return NextResponse.json(getMockResponse(targetGoal, ctaWord));
  }
}
