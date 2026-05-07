const PROGRAMMATIC_SIZES = {
  desktop: [
    "300x250",
    "336x280",
    "728x90",
    "970x90",
    "970x250",
    "160x600",
    "300x600",
    "300x1050",
    "468x60",
    "234x60",
    "120x600",
    "120x240",
    "250x250",
    "200x200",
    "180x150",
  ],
  mobile: ["320x50", "320x100", "300x250", "320x480", "480x320", "360x640", "375x667", "414x736"],
};

export const PLATFORM_SIZES = {
  programmatic: PROGRAMMATIC_SIZES,
};

export const GOAL_CTA = {
  awareness: ["Learn More", "Discover", "Explore", "Watch Now", "See Now"],
  consideration: ["View Details", "Compare Now", "Check Features", "See Pricing", "Try Demo"],
  conversion: ["Buy Now", "Sign Up", "Get Started", "Download", "Claim Offer"],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value) {
  return Math.round(Number(value) || 0);
}

function parseSize(size) {
  const [width, height] = String(size || "0x0")
    .split("x")
    .map((value) => Number(value) || 0);
  return { width, height };
}

function scoreBand(score) {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function estimateBestFor(goal) {
  if (goal === "conversion") return "Conversion";
  if (goal === "consideration") return "Consideration";
  return "Awareness";
}

function recommendedTemplates(goal) {
  if (goal === "conversion") return ["ecommerce", "technology", "business"];
  if (goal === "consideration") return ["business", "technology", "newspaper"];
  return ["newspaper", "entertainment", "health"];
}

async function loadImageStats(url) {
  if (typeof window === "undefined") {
    return {
      brightness: 52,
      contrast: 56,
      clutterIndex: 4,
      palette: ["#1e293b", "#475569", "#0ea5e9"],
      dominantHue: 210,
      warmthScore: 44,
    };
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        resolve({
          brightness: 52,
          contrast: 56,
          clutterIndex: 4,
          palette: ["#1e293b", "#475569", "#0ea5e9"],
          dominantHue: 210,
          warmthScore: 44,
        });
        return;
      }

      const sampleWidth = 32;
      const sampleHeight = 32;
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

      const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
      let sum = 0;
      let min = 255;
      let max = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      let edgeDelta = 0;
      let edgeSamples = 0;

      for (let index = 0; index < data.length; index += 4) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        sum += luminance;
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
        red += r;
        green += g;
        blue += b;

        const pixel = index / 4;
        const x = pixel % sampleWidth;
        if (x < sampleWidth - 1) {
          const next = index + 4;
          const nextLum = 0.299 * data[next] + 0.587 * data[next + 1] + 0.114 * data[next + 2];
          edgeDelta += Math.abs(luminance - nextLum);
          edgeSamples += 1;
        }
      }

      const totalPixels = sampleWidth * sampleHeight;
      const avgBrightness = sum / totalPixels;
      const avgRed = red / totalPixels;
      const avgGreen = green / totalPixels;
      const avgBlue = blue / totalPixels;
      const dominantHue = avgRed >= avgGreen && avgRed >= avgBlue ? 10 : avgGreen >= avgBlue ? 120 : 220;

      resolve({
        brightness: round((avgBrightness / 255) * 100),
        contrast: round(((max - min) / 255) * 100),
        clutterIndex: clamp(Math.round(10 - (edgeDelta / Math.max(edgeSamples, 1)) / 12), 1, 10),
        palette: [
          `#${Math.round(avgRed).toString(16).padStart(2, "0")}${Math.round(avgGreen).toString(16).padStart(2, "0")}${Math.round(avgBlue).toString(16).padStart(2, "0")}`,
          "#0f172a",
          "#38bdf8",
        ],
        dominantHue,
        warmthScore: clamp(round(((avgRed - avgBlue + 255) / 510) * 100), 0, 100),
      });
    };
    image.onerror = () => {
      resolve({
        brightness: 52,
        contrast: 56,
        clutterIndex: 4,
        palette: ["#1e293b", "#475569", "#0ea5e9"],
        dominantHue: 210,
        warmthScore: 44,
      });
    };
    image.src = url;
  });
}

function platformCheck(score) {
  return {
    score,
    pass: score >= 60,
  };
}

function createFixBlocks(coreChecks, ctaDetected, goal) {
  const fixes = [];

  if (!coreChecks.messageClarity.pass) {
    fixes.push({
      severity: "HIGH",
      score: coreChecks.messageClarity.score,
      dimension: "Message Clarity",
      problem: "The core message is not landing fast enough for a scroll-speed placement.",
      impact: "Lower comprehension reduces ad recall and weakens click intent.",
      timeEstimate: "15 min",
      fixNow: "Shorten the headline and increase hierarchy around the primary benefit.",
      fixDeep: "Test a single-minded proposition with fewer competing claims.",
      abTestIdea: "Compare a short benefit-led headline against the current copy block.",
      datasetNote: "Programmatic winners usually surface one dominant promise in the first scan.",
    });
  }

  if (!ctaDetected) {
    fixes.push({
      severity: goal === "conversion" ? "CRITICAL" : "MEDIUM",
      score: goal === "conversion" ? 28 : 46,
      dimension: "Call To Action",
      problem: "No clear CTA is visible for the selected campaign objective.",
      impact: "Users are left without a next step, which suppresses response rate.",
      timeEstimate: "10 min",
      fixNow: `Add one direct CTA such as \"${GOAL_CTA[goal]?.[0] || "Learn More"}\".`,
      fixDeep: "Align button copy, contrast, and placement with the intended funnel stage.",
      abTestIdea: "Test one action-oriented CTA against one value-led CTA.",
      datasetNote: "Conversion campaigns typically need an explicit CTA to score well.",
    });
  }

  if (!coreChecks.contrast.pass) {
    fixes.push({
      severity: "MEDIUM",
      score: coreChecks.contrast.score,
      dimension: "Contrast",
      problem: "Foreground and background separation is weak.",
      impact: "Low contrast hurts readability and degrades attention capture.",
      timeEstimate: "20 min",
      fixNow: "Increase text-to-background contrast and reserve a stronger accent for the CTA.",
      fixDeep: "Rebuild the palette around one dominant, one support, and one CTA accent color.",
      abTestIdea: "Test a dark background treatment against the current palette.",
      datasetNote: "Readable high-contrast banners tend to retain more scan time on mobile.",
    });
  }

  return fixes;
}

export async function analyzeCreativeLocal(url, goal = "awareness", platform = "programmatic", size = "0x0", fileSizeKB = 0) {
  const stats = await loadImageStats(url);
  const { width, height } = parseSize(size);
  const supportedSizes = [
    ...(PLATFORM_SIZES[platform]?.desktop || []),
    ...(PLATFORM_SIZES[platform]?.mobile || []),
  ];
  const sizeSupported = supportedSizes.includes(size);
  const fileWeightScore = clamp(100 - Math.max(fileSizeKB - 250, 0) / 12, 40, 100);
  const clarityScore = clamp(round(stats.contrast * 0.7 + (100 - stats.clutterIndex * 6) * 0.3), 35, 95);
  const contrastScore = clamp(stats.contrast, 25, 95);
  const crowdingScore = clamp(100 - stats.clutterIndex * 8, 20, 95);
  const sizeFitScore = sizeSupported ? 100 : 30;
  const ctaDetected = goal === "conversion" ? contrastScore >= 58 : contrastScore >= 66;
  const ctaStrength = ctaDetected ? (goal === "conversion" ? "high" : contrastScore >= 74 ? "medium" : "low") : "low";
  const ctaType = !ctaDetected ? "None" : goal === "conversion" ? "Hard" : goal === "consideration" ? "Medium" : "Soft";
  const goalAlignmentIndicator = clamp(
    round((goal === "conversion" ? 25 : 15) + clarityScore * 0.35 + contrastScore * 0.25 + crowdingScore * 0.15),
    25,
    95
  );
  const adVisibilityScore = clamp(round((contrastScore + clarityScore) / 2), 25, 95);

  const eligibility = {
    score: round(sizeFitScore * 0.5 + fileWeightScore * 0.25 + (width >= 300 && height >= 250 ? 100 : 60) * 0.25),
    breakdown: {
      sizeFit: sizeFitScore,
      fileWeight: fileWeightScore,
      resolution: width >= 300 && height >= 250 ? 100 : 60,
    },
    issues: [
      !sizeSupported ? `Size ${size} is not in the selected platform inventory list.` : null,
      fileSizeKB > 5120 ? "Large file size may slow delivery or review." : null,
    ].filter(Boolean),
  };

  const attention = {
    score: round(clarityScore * 0.45 + contrastScore * 0.35 + crowdingScore * 0.2),
    breakdown: {
      messageClarity: clarityScore,
      contrast: contrastScore,
      layoutSimplicity: crowdingScore,
    },
  };

  const performance = {
    score: round(goalAlignmentIndicator * 0.45 + adVisibilityScore * 0.3 + (ctaDetected ? 85 : 35) * 0.25),
    breakdown: {
      goalAlignment: goalAlignmentIndicator,
      visibility: adVisibilityScore,
      cta: ctaDetected ? 85 : 35,
    },
    issues: [!ctaDetected ? "CTA is not clearly detectable for this placement." : null].filter(Boolean),
    ctaGoalFit: !ctaDetected ? "missing" : goal === "awareness" ? "good" : goal === "conversion" ? "good" : "acceptable",
  };

  const finalScore = round(eligibility.score * 0.2 + attention.score * 0.4 + performance.score * 0.4);
  const engagementLevel = scoreBand(round(attention.score * 0.55 + performance.score * 0.45));
  const engagementConfidence = clamp(round((eligibility.score + attention.score + performance.score) / 3), 35, 96);
  const coreChecks = {
    contrast: {
      score: contrastScore,
      label: contrastScore >= 60 ? "Readable contrast levels" : "Improve foreground separation",
      pass: contrastScore >= 60,
    },
    messageClarity: {
      score: clarityScore,
      label: clarityScore >= 60 ? "Primary message is scan-friendly" : "Message hierarchy needs simplification",
      pass: clarityScore >= 60,
    },
    crowding: {
      score: crowdingScore,
      label: crowdingScore >= 55 ? "Layout has enough breathing room" : "Creative feels visually crowded",
      pass: crowdingScore >= 55,
    },
    sizeFit: {
      score: sizeFitScore,
      label: sizeSupported ? "Asset fits the selected inventory" : "Asset size is unsupported for this platform",
      pass: sizeSupported,
    },
  };

  const fixBlocks = createFixBlocks(coreChecks, ctaDetected, goal);
  const colorHarmony = contrastScore >= 65 ? "HARMONIOUS" : contrastScore >= 50 ? "ACCEPTABLE" : "DISCORDANT";
  const wcagLevel = contrastScore >= 72 ? "AAA" : contrastScore >= 58 ? "AA" : "FAIL";

  return {
    goal,
    platform,
    size,
    score: finalScore,
    finalScore,
    overall_score: finalScore,
    confidence: `${engagementConfidence}%`,
    recommendedTemplates: recommendedTemplates(goal),
    bestFor: estimateBestFor(goal),
    eligibility,
    attention,
    performance,
    engagement: { level: engagementLevel },
    engagement_forecast: engagementLevel,
    engagement_forecast_confidence: engagementConfidence,
    adVisibilityScore,
    goalAlignmentIndicator,
    brightness: stats.brightness,
    contrast: contrastScore,
    text_clarity: clarityScore,
    clutter_index: stats.clutterIndex,
    creative_archetype: goal === "conversion" ? "Direct Response" : goal === "consideration" ? "Feature Showcase" : "Brand Story",
    emotion_signature: goal === "conversion" ? "Urgency + clarity" : goal === "consideration" ? "Trust + logic" : "Curiosity + recall",
    emotional_appeal: engagementLevel,
    visual_hierarchy: clarityScore >= 75 ? "STRONG" : clarityScore >= 55 ? "MODERATE" : "WEAK",
    headlineDetected: clarityScore >= 58,
    readingFlow: crowdingScore >= 60 ? "LINEAR" : "SCATTERED",
    focalPointStrength: adVisibilityScore,
    colorPalette: stats.palette,
    colorHarmony,
    warmthScore: stats.warmthScore,
    dominantHue: stats.dominantHue,
    wcagLevel,
    textContrast: (contrastScore / 20).toFixed(1),
    hasCurrency: false,
    hasPercentage: false,
    dataset_matches: [],
    dataset_confidence: "LOW",
    cta_presence: ctaDetected,
    cta_detected: ctaDetected,
    cta_text: ctaDetected ? GOAL_CTA[goal]?.[0] || "Learn More" : "",
    cta_strength: ctaStrength,
    cta_type: ctaType,
    cta_goal_fit: !ctaDetected ? "Mismatch" : goal === "awareness" ? "Acceptable" : "Perfect Match",
    cta: {
      detected: ctaDetected,
      text: ctaDetected ? GOAL_CTA[goal]?.[0] || "Learn More" : "",
      strength: ctaStrength,
      visibilityScore: round(adVisibilityScore / 10),
      contrastScore: round(contrastScore / 10),
      positionScore: round(crowdingScore / 10),
      urgencyScore: goal === "conversion" ? 8 : goal === "consideration" ? 6 : 4,
    },
    cta_scores: {
      overall: Number((ctaDetected ? (adVisibilityScore + contrastScore + crowdingScore) / 30 : 3.8).toFixed(1)),
    },
    improved_ctas: GOAL_CTA[goal] || [],
    coreChecks,
    platformChecks: {
      desktop: {
        layoutBalance: platformCheck(crowdingScore),
        visualHierarchy: platformCheck(clarityScore),
        contentStructure: platformCheck(clarityScore - 4),
        placementBlend: platformCheck(adVisibilityScore),
      },
      mobile: {
        readability: platformCheck(clarityScore),
        textDensity: platformCheck(crowdingScore),
        ctaSize: platformCheck(ctaDetected ? 78 : 45),
      },
    },
    suggestions: [
      !sizeSupported ? `Resize this asset to a supported ${platform} slot.` : null,
      !ctaDetected ? `Add a stronger ${goal} CTA such as \"${GOAL_CTA[goal]?.[0] || "Learn More"}\".` : null,
      contrastScore < 60 ? "Increase contrast between headline, CTA, and background." : null,
      crowdingScore < 55 ? "Reduce visual clutter to improve scanning on mobile placements." : null,
    ].filter(Boolean),
    performanceImpact: [
      !ctaDetected
        ? {
            issue: "Missing CTA cue",
            priority: goal === "conversion" ? "High" : "Medium",
            impact: "Lower click intent due to weak next-step guidance.",
            estimatedEffect: "+8 to +15 score from a clear CTA treatment",
            fix: `Introduce one visible CTA aligned to ${goal}.`,
            expectedOutcome: "Clearer action path and better conversion readiness.",
          }
        : null,
      contrastScore < 60
        ? {
            issue: "Low contrast",
            priority: "Medium",
            impact: "Readability drops in smaller or compressed placements.",
            estimatedEffect: "+5 to +10 score from stronger separation",
            fix: "Use higher-contrast typography and a distinct CTA accent.",
            expectedOutcome: "Improved readability and ad recall.",
          }
        : null,
    ].filter(Boolean),
    fix_blocks: fixBlocks,
    ab_hypotheses: [
      {
        dimension: "Headline Framing",
        priority: finalScore < 60 ? "HIGH" : "MEDIUM",
        variant_a: "Current headline and layout treatment",
        variant_b: goal === "conversion" ? "Short value headline with direct CTA button" : "Benefit-led headline with simplified copy",
        expected_lift: finalScore < 60 ? "Expected lift: +10% to +18% CTR potential" : "Expected lift: +4% to +9% CTR potential",
      },
    ],
    stop_rate_estimate: engagementLevel === "HIGH" ? "2.4s" : engagementLevel === "MEDIUM" ? "1.6s" : "0.9s",
    aiInsights: null,
  };
}