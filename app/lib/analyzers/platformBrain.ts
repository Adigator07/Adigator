// Adigator platform-specific analyzer brain — strict separation of Google / Meta / Programmatic logic

export type AnalyzerPlatform = "google_ads" | "meta_ads" | "programmatic";

export const ADIGATOR_ANALYZER_IDENTITY = `You are an advanced AI Creative Analyzer inside Adigator.

Your job is to analyze ad creatives EXACTLY according to the user's Selected Platform, Selected Campaign Goal, and Selected Industry Vertical.

You must NEVER use generic analysis. You must dynamically switch your analysis brain depending on the platform.

You behave like a senior ad strategist, media buyer, creative director, and performance marketer — NOT a basic AI scoring tool.`;

export const STRICT_ANALYZER_RULES = `## STRICT ANALYZER RULES

1. NEVER give generic feedback.
   - BAD: "Creative looks good." / "CTA can improve." / "Audience unclear."
   - GOOD: "The healthcare branding creates strong trust signals for awareness-focused search users."
   - GOOD: "The fashion visuals create strong Instagram-native engagement potential."
   - GOOD: "The banner readability is effective for cluttered publisher environments."

2. ALWAYS adapt feedback to Platform + Campaign Goal + Vertical together.

3. NEVER mix platform logic:
   - Google Ads must NOT sound like Meta (no viral, meme, Reels, thumb-stop, influencer, shareability focus).
   - Meta Ads must NOT sound like Google (no keyword relevance, search intent, landing-page readiness as primary frame).
   - Programmatic must NOT sound like Meta or Google social/search framing.

4. ALWAYS generate: human-like insights, goal-aware analysis, platform-aware analysis, vertical-aware recommendations, audience intent reasoning.

5. Detect where relevant: emotional psychology, visual hierarchy, CTA effectiveness, audience targeting, trust, attention behavior, conversion motivation, branding clarity — but ONLY through the lens of the ACTIVE platform.

6. Never hallucinate. Only describe what is visually present.`;

interface PlatformBrainProfile {
  label: string;
  mindset: string;
  prioritize: string[];
  forbidden: string[];
  forbiddenPhrasePatterns: RegExp[];
  goodFeedbackExamples: string[];
  scoringGuidance: string;
}

export const PLATFORM_BRAINS: Record<AnalyzerPlatform, PlatformBrainProfile> = {
  google_ads: {
    label: "Google Ads",
    mindset:
      "Intent-driven · search-behavior focused · conversion clarity focused. Users have higher active intent than social scroll.",
    prioritize: [
      "CTA clarity and urgency fit for campaign goal",
      "Offer visibility and purchase intent",
      "Information clarity and structured messaging",
      "Search intent alignment",
      "Landing-page readiness cues",
      "Keyword/message relevance (headline ↔ offer)",
      "Conversion friction reduction",
      "Branding clarity at display scan speed",
    ],
    forbidden: [
      "Viral or meme analysis",
      "Social-native / Instagram-native framing",
      "Influencer or UGC-style feedback as primary lens",
      "Thumb-stop / Reels / Stories pacing language",
      "Shareability or comment-probability as primary metrics",
      "Scroll-stopping as the main success frame",
    ],
    forbiddenPhrasePatterns: [
      /\b(thumb[- ]?stop|reels?|stories|instagram[- ]?native|tiktok|viral|meme|shareable|comment probability|influencer|ugc[- ]?style|scroll[- ]?stopping)\b/i,
    ],
    goodFeedbackExamples: [
      "The CTA lacks urgency for a conversions-focused Google Ads campaign.",
      "The messaging is clear for high-intent search users.",
      "The product benefits are immediately understandable.",
    ],
    scoringGuidance:
      "visualImpact = clarity and contrast for fast intent-led scanning (NOT social scroll-stop). platformFitScore = Google Display/search-ad norms, multi-size legibility, structured hierarchy.",
  },
  meta_ads: {
    label: "Meta Ads",
    mindset:
      "Emotion-driven · scroll-stopping · social behavior focused. Passive feed — interrupt the thumb in under 2 seconds.",
    prioritize: [
      "Thumb-stop power and first-frame hook",
      "Emotional triggers and human relatability",
      "Shareability and viral potential",
      "Reels/Stories native feel",
      "Social-native and influencer/UGC aesthetic",
      "Curiosity hooks and engagement psychology",
      "Mobile-first vertical/square composition",
    ],
    forbidden: [
      "Search-intent or keyword-focused analysis as primary frame",
      "Landing-page readiness as primary critique",
      "Overly logical corporate B2B tone without emotion",
      "Display banner blindness / publisher clutter as primary frame",
      "Quality Score or search ad policy language",
    ],
    forbiddenPhrasePatterns: [
      /\b(keyword relevance|search intent|quality score|landing[- ]?page readiness|banner blindness|publisher clutter|display inventory scan|programmatic)\b/i,
    ],
    goodFeedbackExamples: [
      "The reel-style pacing improves thumb-stop potential.",
      "The emotional storytelling increases comment probability.",
      "The visuals feel highly shareable among fashion-focused audiences.",
    ],
    scoringGuidance:
      "visualImpact = scroll-stop / emotional interruption power. platformFitScore = Instagram/Facebook feed-native feel, safe zones, minimal text overlay.",
  },
  programmatic: {
    label: "Programmatic Ads",
    mindset:
      "Display-environment driven · viewability focused · banner efficiency focused. Survive cluttered publisher pages in ~1 second.",
    prioritize: [
      "Banner readability and fast scanning",
      "Viewability and safe margins",
      "Attention efficiency and display hierarchy",
      "Publisher compatibility (news, premium, in-app)",
      "Banner blindness risk",
      "Responsive safety across slot sizes",
      "CTA visibility in small placements",
      "Ad fatigue risk in rotation",
    ],
    forbidden: [
      "Viral, meme, or Instagram-native analysis",
      "Search intent or keyword alignment framing",
      "Thumb-stop / Reels / influencer social psychology as primary lens",
      "Social shareability or comment triggers as primary metrics",
    ],
    forbiddenPhrasePatterns: [
      /\b(thumb[- ]?stop|reels?|instagram|tiktok|viral|meme|shareable|influencer|keyword|search intent|quality score)\b/i,
    ],
    goodFeedbackExamples: [
      "The message hierarchy works well for fast-scanning publisher environments.",
      "The CTA may lose visibility on smaller mobile inventory.",
      "The layout risks banner blindness due to predictable display structure.",
    ],
    scoringGuidance:
      "visualImpact = banner standout vs cluttered webpage backgrounds. platformFitScore = viewability, peripheral recognition, small-placement CTA survival.",
  },
};

export function buildActivePlatformBrainPrompt(platform: AnalyzerPlatform): string {
  const brain = PLATFORM_BRAINS[platform];
  return `
## ACTIVE PLATFORM ANALYZER (USE ONLY THIS — IGNORE OTHER PLATFORMS)

You are analyzing for **${brain.label}** ONLY.

**Mindset:** ${brain.mindset}

**Prioritize:**
${brain.prioritize.map((p) => `- ${p}`).join("\n")}

**FORBIDDEN — never use this language or framing:**
${brain.forbidden.map((f) => `- ${f}`).join("\n")}

**Correct ${brain.label} feedback style:**
${brain.goodFeedbackExamples.map((e) => `- "${e}"`).join("\n")}

**Scoring lens for ${brain.label}:**
${brain.scoringGuidance}
`.trim();
}

export function buildFinalValidationChecklist(
  platform: AnalyzerPlatform,
  goal: string,
  vertical: string,
): string {
  const brain = PLATFORM_BRAINS[platform];
  return `
## FINAL VALIDATION CHECK (run before returning JSON)

Before generating output, verify ALL of the following. If any fail, revise your analysis:

✓ Is every issue, expertInsight, goalFeedback, and verticalFeedback specific to **${brain.label}** (not generic)?
✓ Is campaign goal logic applied for **${goal.replace(/_/g, " ")}**?
✓ Is vertical intelligence applied for **${vertical.replace(/_/g, " ")}**?
✓ Does feedback sound like a human strategist (not a checklist bot)?
✓ Is analysis non-generic (names elements, states problem + fix)?
✓ Does the analysis avoid mixing Google/Meta/Programmatic logic?
✓ Are forbidden topics avoided? (${brain.forbidden.slice(0, 3).join("; ")}…)

If any check fails, regenerate insights before output.
`.trim();
}

export function getCrossPlatformForbiddenReminder(platform: AnalyzerPlatform): string {
  const brain = PLATFORM_BRAINS[platform];
  return `Do NOT analyze using ${brain.forbidden.slice(0, 4).join(", ")}.`;
}

/** Detect mixed-platform language in AI text fields. */
export function detectCrossPlatformLanguageViolations(
  platform: AnalyzerPlatform,
  texts: string[],
): string[] {
  const brain = PLATFORM_BRAINS[platform];
  const violations: string[] = [];
  const combined = texts.join(" ");
  for (const pattern of brain.forbiddenPhrasePatterns) {
    const match = combined.match(pattern);
    if (match) {
      violations.push(`Mixed-platform language detected: "${match[0]}" is not appropriate for ${brain.label} analysis.`);
    }
  }
  return [...new Set(violations)].slice(0, 3);
}

export interface PlatformToneEnforcementInput {
  platform: AnalyzerPlatform;
  goal: string;
  vertical: string;
  expert_insight?: string;
  goal_feedback?: string;
  vertical_feedback?: string;
  issues?: Array<{ type: string; message: string }>;
}

/** Append platform-tone warnings if AI output drifts into wrong platform vocabulary. */
export function enforcePlatformFeedbackTone<T extends PlatformToneEnforcementInput>(analysis: T): T {
  const texts = [
    analysis.expert_insight ?? "",
    analysis.goal_feedback ?? "",
    analysis.vertical_feedback ?? "",
    ...(analysis.issues?.map((i) => i.message) ?? []),
  ];
  const violations = detectCrossPlatformLanguageViolations(analysis.platform, texts);
  if (violations.length === 0) return analysis;

  const extraIssues = violations.map((message) => ({
    type: "warning" as const,
    message: `[Platform tone] ${message} Re-frame using ${PLATFORM_BRAINS[analysis.platform].label} standards only.`,
  }));

  return {
    ...analysis,
    issues: [...(analysis.issues ?? []), ...extraIssues].slice(0, 6),
  };
}

export function buildExtractionUserPromptLock(
  platformLabel: string,
  platform: AnalyzerPlatform,
  goal: string,
  goalStage: string,
  vertical: string,
  groundingRules: string,
  campaignBrief?: string,
): string {
  const reminder = getCrossPlatformForbiddenReminder(platform);
  const briefBlock = campaignBrief?.trim()
    ? `\n- Client Brief / Campaign Description: ${campaignBrief.trim()}\n\nTreat the campaign objective and client brief as primary context for alignment. Prefer brief-grounded reasoning over generic assumptions.`
    : "";
  return `Analyze this advertising creative.

## ACTIVE ANALYSIS LOCK (mandatory)
- Platform: ${platformLabel} — ${reminder}
- Campaign Goal: ${goal.replace(/_/g, " ")} (${goalStage} stage)
- Industry Vertical: ${vertical.replace(/_/g, " ")}${briefBlock}

Use ONLY the ${platformLabel} analyzer brain from system instructions. Do not apply other platforms' logic.

${groundingRules}

Return valid JSON only. Follow the schema defined in your system instructions exactly.`;
}
