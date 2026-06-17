/**
 * Shared alignment copy + keyword helpers for Step 3 analysis.
 */

const GENERIC_PATTERNS = [
  /no major strategic conflict/i,
  /largely consistent/i,
  /no critical fixes required/i,
  /ready for launch/i,
  /incremental improvement while preserving/i,
  /optimization opportunity is primarily incremental/i,
  /creative pressure and urgency cues align/i,
  /creative pressure and urgency cues indicate/i,
  /align with selected campaign objective stage/i,
  /different stage intent than selected objective/i,
];

export function isGenericAnalyzerText(text) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (trimmed.length < 12) return true;
  return GENERIC_PATTERNS.some((re) => re.test(trimmed));
}

export function keywordMatchesInCorpus(keyword, corpus) {
  const k = String(keyword || "").toLowerCase().trim();
  if (!k || !corpus) return false;
  if (k.length <= 3 || k.includes(" ")) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(corpus);
  }
  return corpus.toLowerCase().includes(k);
}

export function scoreCategoryKeywords(hints, textCorpus, visualCorpus, selectedBoost = 0) {
  return (hints || []).reduce((acc, keyword) => {
    const textMatch = keywordMatchesInCorpus(keyword, textCorpus) ? 3 : 0;
    const visualMatch = keywordMatchesInCorpus(keyword, visualCorpus) ? 1 : 0;
    return acc + textMatch + visualMatch;
  }, selectedBoost);
}

const VERTICAL_LABELS = {
  healthcare: "Healthcare",
  technology: "Technology",
  automotive: "Automotive",
  news_media: "News & Media",
  sports: "Sports",
  fitness: "Fitness",
  finance: "Finance",
  luxury: "Luxury",
  travel: "Travel",
  hotels: "Hotels",
  food: "Food & Restaurants",
  banking: "Banking & Fintech",
  real_estate: "Real Estate",
  education: "Education",
  gaming: "Gaming",
  entertainment: "Entertainment",
  ecommerce: "E-commerce",
  fashion: "Fashion",
  unknown: "Unclear category",
};

export function formatVerticalLabel(id) {
  if (!id) return "Unknown";
  return VERTICAL_LABELS[id] || String(id).replace(/_/g, " ");
}

export function buildGoalAlignmentReason({
  aligned,
  selectedGoal,
  detectedStage,
  extraction,
  aiFeedback,
}) {
  const headline = extraction?.headline?.trim();
  const cta = extraction?.cta?.trim();
  const primary = extraction?.primary_message?.trim();
  const urgency = Array.isArray(extraction?.urgency_signals)
    ? extraction.urgency_signals.filter(Boolean).slice(0, 2).join(", ")
    : "";

  if (aiFeedback && !isGenericAnalyzerText(aiFeedback)) {
    return aiFeedback;
  }

  const quoteParts = [headline && `headline "${headline}"`, cta && `CTA "${cta}"`, primary && `message "${primary}"`]
    .filter(Boolean)
    .slice(0, 2);

  if (aligned) {
    const evidence = quoteParts.length ? quoteParts.join(" and ") : "visible copy and layout cues";
    return `This creative supports a ${selectedGoal} objective — ${evidence} match ${selectedGoal}-stage expectations.`;
  }

  const evidence = quoteParts.length ? quoteParts.join(" and ") : "the visible messaging";
  const urgencyNote = urgency ? ` Urgency cues: ${urgency}.` : "";
  return `${evidence} reads as ${detectedStage || "a different"} intent, not ${selectedGoal}.${urgencyNote}`;
}

export function buildVerticalAlignmentReason({
  aligned,
  selectedVertical,
  detectedVertical,
  productLabel,
  evidence,
  aiFeedback,
}) {
  if (aiFeedback && !isGenericAnalyzerText(aiFeedback)) {
    return aiFeedback;
  }

  const selectedLabel = formatVerticalLabel(selectedVertical);
  const detectedLabel = productLabel || formatVerticalLabel(detectedVertical);
  const evidenceText = (evidence || []).filter(Boolean).slice(0, 4).join(", ");

  if (aligned) {
    return evidenceText
      ? `Copy and visuals signal ${selectedLabel} — detected: ${evidenceText}.`
      : `Visual and text signals align with the ${selectedLabel} vertical.`;
  }

  if (detectedVertical && detectedVertical !== "unknown" && detectedVertical !== selectedVertical) {
    return evidenceText
      ? `Creative presents as ${detectedLabel} (${evidenceText}) but the campaign is set to ${selectedLabel}.`
      : `Creative reads as ${detectedLabel}, which conflicts with the selected ${selectedLabel} vertical.`;
  }

  return evidenceText
    ? `Weak ${selectedLabel} signals — only partial evidence: ${evidenceText}.`
    : `Insufficient ${selectedLabel} cues in headline, visuals, or offer language.`;
}

export function buildEnrichedGoalReasonForInsight(goalAlignment, signals, campaignGoal) {
  return buildGoalAlignmentReason({
    aligned: goalAlignment?.is_aligned === true,
    selectedGoal: campaignGoal || goalAlignment?.selected_goal || "campaign goal",
    detectedStage: goalAlignment?.detected_goal_stage || goalAlignment?.detected_goal,
    extraction: signals,
    aiFeedback: goalAlignment?.ai_goal_feedback || goalAlignment?.reason,
  });
}

export function buildEnrichedVerticalReasonForInsight(verticalAlignment, signals) {
  return buildVerticalAlignmentReason({
    aligned: verticalAlignment?.is_aligned === true,
    selectedVertical: verticalAlignment?.selected_vertical,
    detectedVertical: verticalAlignment?.detected_vertical,
    productLabel: verticalAlignment?.product_category,
    evidence: [
      ...(verticalAlignment?.evidence || []),
      signals?.headline,
      signals?.dominant_visual_cue,
    ].filter(Boolean),
    aiFeedback: verticalAlignment?.ai_vertical_feedback || verticalAlignment?.reason,
  });
}
