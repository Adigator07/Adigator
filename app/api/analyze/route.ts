import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// ── New Enhanced Response Schema (7-step CTA + Funnel Classification) ────────
const responseSchema = {
  type: "object",
  properties: {
    // ── Funnel Classification ──
    funnel_stage: { type: "string", enum: ["Awareness", "Consideration", "Conversion"] },
    confidence_score: { type: "integer", description: "0-100, confidence in funnel classification" },
    reasoning: { type: "string", description: "Human-like funnel classification reasoning" },
    messaging_intent: { type: "string", enum: ["Educational", "Emotional", "Persuasive", "Action-driven"] },
    urgency_level: { type: "string", enum: ["Low", "Medium", "High"] },
    audience_type: { type: "string", enum: ["Cold", "Warm", "Hot"] },
    // ── 7-Step CTA Analysis ──
    cta_detected: { type: "boolean", description: "STRICT: CTA must contain action verb AND imply a next step" },
    cta_text: { type: ["string", "null"], description: "Exact CTA text detected, or null if not present" },
    cta_type: { type: "string", enum: ["Soft", "Medium", "Hard", "None"], description: "Soft=Awareness, Medium=Consideration, Hard=Conversion" },
    cta_goal_fit: { type: "string", enum: ["Perfect Match", "Acceptable", "Mismatch", "None"] },
    cta_scores: {
      type: "object",
      properties: {
        clarity: { type: ["number", "null"], description: "0-10: Is the action obvious?" },
        urgency: { type: ["number", "null"], description: "0-10: Is there time pressure?" },
        value: { type: ["number", "null"], description: "0-10: Benefit to user?" },
        visibility: { type: ["number", "null"], description: "0-10: Easy to notice?" },
        overall: { type: ["number", "null"], description: "Average of above 4 scores" },
      },
    },
    cta_strength: { type: "string", enum: ["Soft", "Medium", "Strong", "None"] },
    analysis: { type: "string", description: "Human-like marketer insight — NOT robotic" },
    impact: { type: "string", description: "What this means for campaign performance" },
    improved_ctas: { type: "array", items: { type: "string" }, description: "3-5 improved CTAs: Action + Benefit + Urgency format" },
    improvement_suggestions: { type: "array", items: { type: "string" }, description: "2-3 specific, sector-aware improvement suggestions" },
  },
  required: [
    "funnel_stage", "confidence_score", "reasoning",
    "messaging_intent", "urgency_level", "audience_type",
    "cta_detected", "cta_text", "cta_type", "cta_goal_fit", "cta_scores",
    "cta_strength", "analysis", "impact", "improved_ctas", "improvement_suggestions",
  ],
};

// ── Heuristic fallback (used when no/invalid API key) ───────────────────────────
function getMockResponse(targetGoal: string, ctaWord: string) {
  const hasConversionCTA = ["buy", "shop", "install", "download", "sign up", "get", "claim", "order"].some(w => ctaWord.includes(w));
  const hasConsiderationCTA = ["compare", "features", "pricing", "details", "try", "check", "demo", "see"].some(w => ctaWord.includes(w));
  const hasCTA = hasConversionCTA || hasConsiderationCTA || ctaWord.length > 1;

  // Determine CTA type
  let ctaType: "Soft" | "Medium" | "Hard" | "None" = "None";
  if (hasCTA) {
    if (hasConversionCTA) ctaType = "Hard";
    else if (hasConsiderationCTA) ctaType = "Medium";
    else ctaType = "Soft";
  }

  // Determine CTA-goal fit
  let ctaGoalFit: "Perfect Match" | "Acceptable" | "Mismatch" | "None" = "None";
  if (hasCTA) {
    if (targetGoal === "Awareness" && ctaType === "Soft") ctaGoalFit = "Perfect Match";
    else if (targetGoal === "Awareness" && ctaType === "Medium") ctaGoalFit = "Acceptable";
    else if (targetGoal === "Awareness" && ctaType === "Hard") ctaGoalFit = "Mismatch";
    else if (targetGoal === "Consideration" && ctaType === "Medium") ctaGoalFit = "Perfect Match";
    else if (targetGoal === "Consideration" && ctaType === "Soft") ctaGoalFit = "Acceptable";
    else if (targetGoal === "Consideration" && ctaType === "Hard") ctaGoalFit = "Acceptable";
    else if (targetGoal === "Conversion" && ctaType === "Hard") ctaGoalFit = "Perfect Match";
    else if (targetGoal === "Conversion" && ctaType === "Medium") ctaGoalFit = "Acceptable";
    else if (targetGoal === "Conversion" && ctaType === "Soft") ctaGoalFit = "Mismatch";
  }

  const base = {
    funnel_stage: targetGoal,
    confidence_score: 50,
    reasoning: "",
    messaging_intent: "Educational" as string,
    urgency_level: "Low" as string,
    audience_type: "Cold" as string,
    cta_detected: hasCTA,
    cta_text: hasCTA ? ctaWord : null,
    cta_type: ctaType as string,
    cta_goal_fit: ctaGoalFit as string,
    cta_scores: hasCTA
      ? { clarity: 6, urgency: 4, value: 5, visibility: 7, overall: 5.5 }
      : { clarity: null, urgency: null, value: null, visibility: null, overall: null },
    cta_strength: hasCTA ? (hasConversionCTA ? "Strong" : "Medium") : "None",
    analysis: "",
    impact: "",
    improved_ctas: [] as string[],
    improvement_suggestions: [] as string[],
  };

  if (targetGoal === "Conversion") {
    base.messaging_intent = "Action-driven";
    base.urgency_level = "High";
    base.audience_type = "Hot";
    if (hasConversionCTA) {
      base.confidence_score = 91;
      base.reasoning = "Strong fit for Conversion. The CTA is direct and action-oriented, which is exactly what a hot, ready-to-buy audience needs to take the final step.";
      base.analysis = "The CTA is clear, visible, and aligned with the conversion goal. It removes friction and tells the user precisely what to do.";
      base.impact = "High conversion potential. Expect strong click-through on remarketing audiences who already know the brand.";
      base.improved_ctas = ["Buy Now — Limited Time Offer", "Get Yours Before Stock Runs Out", "Claim Your Discount Today", "Start Saving Now", "Order in 60 Seconds"];
      base.improvement_suggestions = ["Add urgency signals like 'Limited offer' or a countdown to push fence-sitters.", "Ensure the landing page matches the CTA promise for minimal bounce."];
    } else {
      base.confidence_score = 28;
      base.reasoning = "Poor fit for Conversion. Without a transactional CTA, the creative cannot convert intent into action.";
      base.analysis = "No actionable CTA detected. The creative describes rather than directs — visitors have no clear next step, which bleeds conversion potential.";
      base.impact = "Critical performance gap. Users who see this ad are unlikely to take action even if interested, costing you high-intent clicks.";
      base.improved_ctas = ["Buy Now — Save 40% Today", "Sign Up Free — No Credit Card", "Get Started in 30 Seconds", "Claim Your Free Trial Now", "Shop the Collection"];
      base.improvement_suggestions = ["Replace the current CTA with a strong action verb like 'Buy Now', 'Sign Up', or 'Get Started'.", "Add scarcity elements (e.g., 'Only 3 left') to drive urgency.", "Move the CTA to a high-contrast button in the bottom-right."];
    }
  } else if (targetGoal === "Consideration") {
    base.messaging_intent = "Persuasive";
    base.urgency_level = "Medium";
    base.audience_type = "Warm";
    if (hasConsiderationCTA) {
      base.confidence_score = 87;
      base.reasoning = "Good fit for Consideration. The creative invites evaluation and comparison, which maps well to a warm audience actively researching options.";
      base.analysis = "The CTA encourages exploration without forcing a purchase — ideal for mid-funnel audiences weighing their options.";
      base.impact = "Solid click-through expected. Users will engage with the content and move further down the funnel.";
      base.improved_ctas = ["See How It Works — Free Demo", "Compare Plans Side by Side", "Read 500+ Reviews", "Explore All Features", "Watch a 2-Min Overview"];
      base.improvement_suggestions = ["Highlight 2-3 key differentiators to help the audience compare you vs. competitors.", "Add a trust signal like star ratings or a recognizable client logo."];
    } else {
      base.confidence_score = 38;
      base.reasoning = "Suboptimal for Consideration. Mid-funnel audiences need a reason to evaluate your product — a vague CTA leaves them with no direction.";
      base.analysis = "The CTA lacks the specificity needed to encourage product evaluation. Warm audiences need a concrete next step to deepen their consideration.";
      base.impact = "Missed opportunity. Users are interested but don't know what to do next, leading to passive scroll-bys rather than clicks.";
      base.improved_ctas = ["Compare Plans Now — Start Free", "See All Features", "Get Your Personalized Quote", "Watch the Product Demo", "Read Case Studies"];
      base.improvement_suggestions = ["Change CTA to 'Compare Plans', 'See How It Works', or 'View Features'.", "Add a value proposition statement above the CTA.", "Consider a 'vs. competitor' visual to trigger comparison thinking."];
    }
  } else {
    // Awareness
    base.messaging_intent = "Educational";
    base.urgency_level = "Low";
    base.audience_type = "Cold";
    if (!hasConversionCTA && !hasConsiderationCTA) {
      base.confidence_score = 84;
      base.reasoning = "Strong fit for Awareness. The creative uses a soft, informational tone ideal for introducing your brand to cold audiences.";
      base.analysis = hasCTA
        ? "The soft CTA keeps the pressure low and lets the brand story breathe — perfect for cold audiences who don't know you yet."
        : "No CTA detected, which is acceptable for pure awareness. The creative focuses on brand storytelling rather than driving immediate action.";
      base.impact = "Effective for top-of-funnel reach. Expect high impressions and brand recall, with lower direct click-through — as intended.";
      base.improved_ctas = ["Discover Our Story", "Learn More About Us", "See What's Possible", "Explore the Collection", "Find Out Why Thousands Trust Us"];
      base.improvement_suggestions = ["Ensure your brand mark is visible in the first glance — viewers decide in 0.3s.", "Use high-emotion imagery to trigger memory encoding in cold audiences.", "Keep copy under 7 words for maximum retention."];
    } else {
      base.confidence_score = 43;
      base.reasoning = "Mismatched for Awareness. Using a transactional CTA on a cold audience creates friction — they haven't formed a need yet.";
      base.analysis = "The CTA is too aggressive for a cold audience who hasn't formed brand familiarity. Hard-sell tactics at the awareness stage increase ad fatigue and lower brand trust.";
      base.impact = "Risk of negative brand association. Cold audiences exposed to hard CTAs before brand introduction tend to develop ad blindness faster.";
      base.improved_ctas = ["Discover Our World", "See What's New", "Learn More — No Commitment", "Explore the Possibilities", "Find Your Perfect Fit"];
      base.improvement_suggestions = ["Soften the CTA to 'Learn More', 'Discover', or 'See Why'.", "Shift the copy focus from the product to the problem it solves.", "Use brand colors prominently so cold audiences start forming visual associations."];
    }
  }

  return base;
}

// ── Main route ──────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  let targetGoal = "Awareness";
  let ctaWord = "";

  try {
    const body = await req.json();
    const { text, cta, goal, platform, audience, visualContext, sector } = body;

    targetGoal = goal ? goal.charAt(0).toUpperCase() + goal.slice(1) : "Awareness";
    ctaWord = cta ? cta.toLowerCase() : "";

    const apiKey = process.env.ADIGATOR_GROQ_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim();
    console.log("[Adigator] API Key found:", apiKey ? `${apiKey.substring(0, 8)}...` : "None");

    if (!apiKey) {
      console.warn("[Adigator] No API Key found — using heuristic fallback.");
      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json(getMockResponse(targetGoal, ctaWord));
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are Alex Chen, a Senior Performance Marketing Strategist with 12+ years experience across Google Display, DV360, Meta, and TikTok Ads.

Your ONLY job is to analyze the ad creative data provided and return a perfectly accurate JSON analysis.

CORE PRINCIPLES:
1. ZERO hallucination — analyze ONLY what is explicitly present in the provided text/context
2. Be a real marketer, not a robot — write like a human who has run thousands of campaigns
3. Every score must be earned — do not inflate scores to seem positive
4. CTAs must be EXPLICIT — only mark detected if there is a clear action verb directing the user to do something RIGHT NOW
5. Sector context matters — a health ad and a gaming ad have completely different CTA standards

CTA DETECTION RULES (STRICT):
✅ VALID CTAs: "Buy Now", "Shop Now", "Sign Up Free", "Download Today", "Get Started", "Claim Offer", "Try for Free", "Book a Demo", "See Pricing", "Start Saving"
❌ NOT CTAs: "50% OFF", "Best Quality", brand slogans, product descriptions, promotional text without an action verb
→ When in doubt → cta_detected = false

FUNNEL CLASSIFICATION RULES:
- Awareness: Soft CTAs or no CTA, brand storytelling, emotional hooks, no pricing
- Consideration: Features comparison, reviews, demos, mid-urgency CTAs
- Conversion: Hard CTAs, pricing, discounts, scarcity signals, direct purchase intent

You MUST respond in perfectly valid JSON only. No markdown, no explanation, no extra text.`;

    const userPrompt = `Analyze this ad creative for a ${goal?.toUpperCase()} campaign and return a strict JSON object.

## AD DATA (only analyze what is listed below — do not assume anything else)
- Campaign Goal: ${goal || "unknown"}
- Platform: ${platform || "unknown"}
- Audience Type: ${audience || "unknown"}
- Industry Sector: ${sector || "general digital advertising"}
- Detected Ad Text (via OCR): "${text || "No text detected"}"
- Pre-detected CTA Word: "${cta || "none"}"
- Visual Signal Context: ${visualContext || "No visual data available"}

## YOUR TASK: Complete the following 7-step analysis

### STEP 1 — CTA DETECTION
Scan the OCR text: "${text || "No text detected"}"
Is there a CLEAR, EXPLICIT action phrase with an action verb telling the user to do something immediately?
- Mark cta_detected: true ONLY if you see phrases like "Buy Now", "Shop Now", "Sign Up", "Download", "Get Started", "Claim", "Try Now", "Book Now", etc.
- Mark cta_detected: false if the text is purely: product descriptions, promotional percentages, brand slogans, or no text.
→ Set: cta_detected (boolean), cta_text (exact phrase or null)

### STEP 2 — CTA TYPE CLASSIFICATION
If CTA detected:
- Soft (Awareness-oriented): Learn More, Discover, Explore, See More, Find Out
- Medium (Consideration-oriented): Get Started, See Pricing, View Details, Compare Plans, Book a Demo, Try Free
- Hard (Conversion-oriented): Buy Now, Shop Now, Sign Up, Download, Claim Offer, Order Now, Start Free Trial
If no CTA: cta_type = "None"

### STEP 3 — GOAL FIT ASSESSMENT
Campaign goal is ${goal}. Does the CTA type match?
- Awareness + Soft CTA = "Perfect Match"
- Awareness + Medium CTA = "Acceptable"
- Awareness + Hard CTA = "Mismatch"
- Consideration + Medium CTA = "Perfect Match"
- Consideration + Soft/Hard CTA = "Acceptable"
- Conversion + Hard CTA = "Perfect Match"
- Conversion + Soft/None CTA = "Mismatch"
- No CTA = "None"

### STEP 4 — CTA QUALITY SCORES (0-10, null if no CTA)
Score only if cta_detected = true:
- clarity: Can a 5-second viewer instantly know what action to take? (10 = crystal clear, 0 = confusing)
- urgency: Is there time pressure, scarcity, or deadline implied? (10 = strong urgency, 0 = none)
- value: Does the CTA communicate a clear benefit to the user? (10 = compelling value prop, 0 = generic)
- visibility: Would the CTA stand out in a banner ad environment? (10 = impossible to miss, 0 = invisible)
- overall: Calculate as (clarity + urgency + value + visibility) / 4, rounded to 1 decimal

### STEP 5 — IMPACT ASSESSMENT
What does the CTA situation mean for THIS specific campaign goal and audience?
Write 1-2 sentences like a real marketer presenting to a client.

### STEP 6 — SENIOR MARKETER ANALYSIS
Write 2-3 sentences of expert analysis. Be specific to the text and context provided.
BAD: "The CTA is weak and could be improved."
GOOD: "The 'Learn More' CTA is too passive for a ${goal} objective — ${audience} audiences at this funnel stage need a commitment-reducing offer like 'Try 7 Days Free' to trigger action without buyer friction."

### STEP 7 — IMPROVED CTAs (generate 5 options)
Create 5 improved CTAs specifically optimized for:
- Goal: ${goal}
- Sector: ${sector || "general"}
- Audience stage: ${audience}
- Format: [Strong Action Verb] + [Specific Benefit] + [Urgency Signal if Conversion goal]
Examples for Conversion/Ecommerce: "Claim Your 30% Off — Today Only", "Buy Now & Get Free Shipping"
Examples for Awareness/Health: "Discover What's Possible", "See How Others Are Transforming"

## ADDITIONAL FIELDS TO COMPLETE:
- funnel_stage: Best funnel classification for this creative ("Awareness" | "Consideration" | "Conversion")
- confidence_score: 0-100, how confident are you in the funnel_stage assignment?
- reasoning: 1-2 sentences explaining the funnel classification
- messaging_intent: What is the primary communication intent? ("Educational" | "Emotional" | "Persuasive" | "Action-driven")
- urgency_level: Overall urgency signal in the creative ("Low" | "Medium" | "High")
- audience_type: What warmth level does this creative suit best? ("Cold" | "Warm" | "Hot")
- cta_strength: Overall CTA power for legacy display ("Soft" | "Medium" | "Strong" | "None")
- improvement_suggestions: Array of 2-3 highly specific, actionable suggestions referencing the actual text/context

## ABSOLUTE RULES:
- NEVER invent CTAs that are not in the provided text
- NEVER mark cta_detected: true for purely promotional text (e.g. "50% OFF" alone)
- Do NOT penalize Awareness campaigns for missing hard CTAs — that is intentional
- Keep all text fields concise but specific — no generic filler phrases
- Return ONLY valid JSON matching the schema — no markdown, no preamble`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty Groq response");

      const result = JSON.parse(raw);

      // Ensure cta_scores.overall is calculated if missing
      if (result.cta_detected && result.cta_scores) {
        const { clarity, urgency, value, visibility } = result.cta_scores;
        if ([clarity, urgency, value, visibility].every(v => v !== null && v !== undefined)) {
          result.cta_scores.overall = parseFloat(((clarity + urgency + value + visibility) / 4).toFixed(1));
        }
      }

      return NextResponse.json(result);

    } catch (groqErr: any) {
      console.warn("[Adigator] Groq request failed, using heuristic fallback:", groqErr?.message ?? groqErr);
      return NextResponse.json(getMockResponse(targetGoal, ctaWord));
    }

  } catch (err: any) {
    console.error("[Adigator] Critical route error:", err);
    return NextResponse.json(getMockResponse(targetGoal, ctaWord));
  }
}
