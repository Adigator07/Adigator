/**
 * Platform-dedicated Overview tab sections for Step 3.
 * Google Ads, Meta Ads, and Programmatic each use separate logic — no shared generic framework.
 */

import { CAMPAIGN_LAUNCH_STATUS } from "./analyzerInsights";
import { summarizePlacementMatrix } from "./platformQaBuilders";
import { getPlacementColumns } from "./placementCompatibility";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeQaKey(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
}

function aggregateQaItems(insights, field) {
  const bucket = new Map();
  for (const insight of insights) {
    for (const item of insight[field] || []) {
      const key = `${item.status}:${normalizeQaKey(item.text)}`;
      const existing = bucket.get(key) || { ...item, count: 0, creativeNames: [], sizes: [] };
      existing.count += 1;
      if (!existing.creativeNames.includes(insight.creativeName)) {
        existing.creativeNames.push(insight.creativeName);
      }
      if (insight.creativeSize && !existing.sizes.includes(insight.creativeSize)) {
        existing.sizes.push(insight.creativeSize);
      }
      if (existing.count > 1 && existing.sizes.length) {
        existing.text = `${item.text} (${existing.count} creatives: ${existing.sizes.slice(0, 3).join(", ")}${existing.sizes.length > 3 ? "…" : ""})`;
      }
      bucket.set(key, existing);
    }
  }
  return [...bucket.values()]
    .sort((a, b) => {
      const order = { fail: 0, warn: 1, pass: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    })
    .slice(0, 8);
}

function qaPassRate(items) {
  if (!items.length) return 100;
  const pass = items.filter((i) => i.status === "pass").length;
  return clampScore((pass / items.length) * 100);
}

function placementGoodRate(insights, columnIds) {
  if (!insights.length || !columnIds.length) return 0;
  let good = 0;
  let total = 0;
  for (const insight of insights) {
    for (const id of columnIds) {
      total += 1;
      if (insight.placementScores?.[id] === "good") good += 1;
    }
  }
  return total ? clampScore((good / total) * 100) : 0;
}

function computeDimensionScores(insights, platform) {
  const total = insights.length || 1;
  const ready = insights.filter((i) => i.launchStatusKey === "ready").length;
  const goalAligned = insights.filter((i) => i.goalAlignment?.is_aligned === true).length;
  const verticalAligned = insights.filter((i) => i.verticalAlignment?.is_aligned === true).length;

  const techItems = aggregateQaItems(insights, "technicalQa");
  const placementItems = aggregateQaItems(insights, "placementQa");

  const creativeFit = clampScore((ready / total) * 55 + (goalAligned / total) * 25 + (verticalAligned / total) * 20);
  const technicalCompliance = qaPassRate(techItems);
  const placementReadiness = qaPassRate(placementItems);
  const goalAlignment = clampScore(((goalAligned + verticalAligned) / (total * 2)) * 100);

  let platformReadiness = placementReadiness;
  if (platform === "google_ads") {
    platformReadiness = placementGoodRate(insights, ["gdn", "responsive_display", "demand_gen", "youtube_companion"]);
  } else if (platform === "meta_ads") {
    platformReadiness = placementGoodRate(insights, ["facebook_feed", "instagram_feed", "stories", "reels"]);
  } else if (platform === "programmatic") {
    platformReadiness = placementGoodRate(insights, ["display_banners", "native_ads", "open_web"]);
  }

  return {
    creativeFit,
    technicalCompliance,
    placementReadiness: platformReadiness,
    goalAlignment,
  };
}

function healthRiskLevel(score) {
  if (score >= 80) return { id: "healthy", label: "Healthy", tone: "emerald" };
  if (score >= 60) return { id: "moderate", label: "Moderate Risk", tone: "amber" };
  return { id: "critical", label: "High Risk", tone: "red" };
}

function buildGoogleCampaignHealth(insights, overview) {
  const dims = computeDimensionScores(insights, "google_ads");
  const healthScore = clampScore(
    dims.creativeFit * 0.25
    + dims.placementReadiness * 0.35
    + dims.technicalCompliance * 0.25
    + dims.goalAlignment * 0.15,
  );

  const gdnGood = insights.filter((i) => i.placementScores?.gdn === "good").length;
  const rdaGood = insights.filter((i) => i.placementScores?.responsive_display === "good").length;
  const dgGood = insights.filter((i) => i.placementScores?.demand_gen === "good").length;
  const ytGood = insights.filter((i) => i.placementScores?.youtube_companion === "good").length;

  const strengths = [];
  const weaknesses = [];
  const optimizationTips = [];

  if (overview.readyCount > 0) {
    strengths.push(`${overview.readyCount} creative${overview.readyCount === 1 ? "" : "s"} meet Google Display & RDA dimension guidance`);
  }
  if (gdnGood === insights.length && insights.length) {
    strengths.push("Full set cleared for Google Display Network (GDN) IAB rotation");
  }
  if (rdaGood >= Math.ceil(insights.length * 0.7)) {
    strengths.push("Responsive Display Ad asset ratios support Search/Display/YouTube expansion");
  }
  if (dgGood >= Math.ceil(insights.length * 0.5)) {
    strengths.push("Demand Gen native ratios viable for Discover and YouTube feed cards");
  }
  if (dims.technicalCompliance >= 75) {
    strengths.push("File weight and text-density checks align with Google 150KB viewability guidance");
  }

  if (gdnGood < insights.length) {
    weaknesses.push(`${insights.length - gdnGood} creative${insights.length - gdnGood === 1 ? "" : "s"} weak on GDN — verify 300×250, 728×90, or 970×250 masters`);
  }
  if (rdaGood < insights.length) {
    weaknesses.push("Responsive Display gaps — export 600×314+ landscape or 1200×1200 square for Performance Max/RDA");
  }
  if (dgGood < Math.ceil(insights.length * 0.5)) {
    weaknesses.push("Demand Gen coverage limited — add 1200×628 or 1080×1080 native assets");
  }
  if (ytGood < insights.length) {
    weaknesses.push("YouTube companion readiness incomplete — 16:9 or Tier-1 banner sizes improve in-stream pairing");
  }
  if (overview.misalignedCount > 0) {
    weaknesses.push(`${overview.misalignedCount} creative${overview.misalignedCount === 1 ? "" : "s"} misaligned with campaign goal or vertical intent`);
  }

  if (rdaGood < insights.length) {
    optimizationTips.push("Add landscape (1200×628) and square (1200×1200) masters for Performance Max and Responsive Display");
  }
  if (dgGood < insights.length) {
    optimizationTips.push("Build Demand Gen-specific 4:5 or 1:1 assets for Discover and YouTube Shorts adjacency");
  }
  if (overview.reviewCount > 0) {
    optimizationTips.push("Reduce copy on mobile leaderboard sizes (320×50) before Search companion deployment");
  }
  if (!optimizationTips.length) {
    optimizationTips.push("Maintain current display asset mix — add companion banner sizes if expanding YouTube placements");
  }

  return {
    healthScore,
    riskLevel: healthRiskLevel(healthScore),
    compatibilityScore: dims.placementReadiness,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    optimizationTips: optimizationTips.slice(0, 4),
    dimensions: [
      { label: "Creative Fit", score: dims.creativeFit, note: "Launch readiness + strategic alignment" },
      { label: "GDN & Display Readiness", score: dims.placementReadiness, note: "GDN, RDA, Demand Gen, YouTube" },
      { label: "Technical Compliance", score: dims.technicalCompliance, note: "Weight, dimensions, text density" },
      { label: "Goal Alignment", score: dims.goalAlignment, note: "Campaign objective + vertical fit" },
    ],
    inventoryCoverage: [
      { label: "GDN", ready: gdnGood, total: insights.length },
      { label: "Responsive Display", ready: rdaGood, total: insights.length },
      { label: "Demand Gen", ready: dgGood, total: insights.length },
      { label: "YouTube Companion", ready: ytGood, total: insights.length },
    ],
  };
}

function buildMetaCampaignHealth(insights, overview) {
  const dims = computeDimensionScores(insights, "meta_ads");
  const healthScore = clampScore(
    dims.creativeFit * 0.25
    + dims.placementReadiness * 0.35
    + dims.technicalCompliance * 0.2
    + dims.goalAlignment * 0.2,
  );

  const feedGood = insights.filter((i) =>
    i.placementScores?.facebook_feed === "good" || i.placementScores?.instagram_feed === "good",
  ).length;
  const storiesGood = insights.filter((i) => i.placementScores?.stories === "good").length;
  const reelsGood = insights.filter((i) => i.placementScores?.reels === "good").length;
  const audienceGood = insights.filter((i) => i.placementScores?.audience_network === "good").length;

  const strengths = [];
  const weaknesses = [];
  const optimizationTips = [];

  if (feedGood === insights.length && insights.length) {
    strengths.push("All creatives fit Facebook & Instagram Feed card ratios (1:1 or 4:5)");
  }
  if (storiesGood >= Math.ceil(insights.length * 0.7)) {
    strengths.push("Stories inventory supported — 9:16 safe-zone margins acceptable");
  }
  if (reelsGood >= Math.ceil(insights.length * 0.5)) {
    strengths.push("Reels vertical canvas viable for short-form thumb-stop delivery");
  }
  if (overview.readyCount > 0) {
    strengths.push(`${overview.readyCount} creative${overview.readyCount === 1 ? "" : "s"} pass Meta delivery and policy checks`);
  }

  if (feedGood < insights.length) {
    weaknesses.push(`${insights.length - feedGood} creative${insights.length - feedGood === 1 ? "" : "s"} may letterbox in Feed — export 1080×1080 or 1080×1350`);
  }
  if (reelsGood < Math.ceil(insights.length * 0.5)) {
    weaknesses.push("Reels inventory blocked or cropped — 1080×1920 native required for full-screen");
  }
  if (storiesGood < insights.length) {
    weaknesses.push("Stories safe zones at risk — CTA/headline may collide with profile bar and bottom UI");
  }
  if (audienceGood < Math.ceil(insights.length * 0.5)) {
    weaknesses.push("Audience Network extension limited — simplify layout for in-app banner contexts");
  }

  const textHeavy = insights.filter((i) => i.extractionSignals?.text_density === "high").length;
  if (textHeavy > 0) {
    weaknesses.push(`Heavy text overlay in ${textHeavy} creative${textHeavy === 1 ? "" : "s"} — Meta may throttle delivery`);
    optimizationTips.push("Move copy to primary text/caption — keep frame under ~20% text for Feed delivery");
  }
  if (reelsGood < insights.length) {
    optimizationTips.push("Export dedicated 1080×1920 Reels/Stories masters with center-weighted subjects");
  }
  if (feedGood < insights.length) {
    optimizationTips.push("Prioritize 1080×1080 for carousel and 1080×1350 for mobile-first Feed");
  }
  if (!optimizationTips.length) {
    optimizationTips.push("Test Audience Network variants with reduced text for in-app placements");
  }

  return {
    healthScore,
    riskLevel: healthRiskLevel(healthScore),
    compatibilityScore: dims.placementReadiness,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    optimizationTips: optimizationTips.slice(0, 4),
    dimensions: [
      { label: "Creative Fit", score: dims.creativeFit, note: "Feed-native ratios & launch status" },
      { label: "Placement Readiness", score: dims.placementReadiness, note: "Feed, Stories, Reels, Audience Network" },
      { label: "Policy & Technical", score: dims.technicalCompliance, note: "Text overlay, file weight, safe zones" },
      { label: "Objective Alignment", score: dims.goalAlignment, note: "Campaign goal + vertical match" },
    ],
    inventoryCoverage: [
      { label: "Feed", ready: feedGood, total: insights.length },
      { label: "Stories", ready: storiesGood, total: insights.length },
      { label: "Reels", ready: reelsGood, total: insights.length },
      { label: "Audience Network", ready: audienceGood, total: insights.length },
    ],
  };
}

function buildProgrammaticCampaignHealth(insights, overview) {
  const dims = computeDimensionScores(insights, "programmatic");
  const healthScore = clampScore(
    dims.creativeFit * 0.2
    + dims.placementReadiness * 0.35
    + dims.technicalCompliance * 0.3
    + dims.goalAlignment * 0.15,
  );

  const bannerGood = insights.filter((i) => i.placementScores?.display_banners === "good").length;
  const nativeGood = insights.filter((i) => i.placementScores?.native_ads === "good").length;
  const openWebGood = insights.filter((i) => i.placementScores?.open_web === "good").length;
  const mobileAppGood = insights.filter((i) => i.placementScores?.mobile_app === "good").length;

  const strengths = [];
  const weaknesses = [];
  const optimizationTips = [];

  if (bannerGood === insights.length && insights.length) {
    strengths.push("Core IAB banner sizes cleared for open-exchange RTB fill (300×250, 728×90 class)");
  }
  if (nativeGood >= Math.ceil(insights.length * 0.5)) {
    strengths.push("Native asset ratios suit content-recommendation and in-feed modules");
  }
  if (dims.technicalCompliance >= 70) {
    strengths.push("Viewability-friendly file weights and copy density for publisher environments");
  }
  if (overview.readyCount > 0) {
    strengths.push(`${overview.readyCount} creative${overview.readyCount === 1 ? "" : "s"} DSP-ready with competitive auction density`);
  }

  if (bannerGood < insights.length) {
    weaknesses.push(`${insights.length - bannerGood} creative${insights.length - bannerGood === 1 ? "" : "s"} outside core IAB banner matrix`);
  }
  if (nativeGood < Math.ceil(insights.length * 0.5)) {
    weaknesses.push("Native inventory weak — banner aspect won't render cleanly in native units");
  }
  if (openWebGood < insights.length) {
    weaknesses.push("Open web premium publisher fit limited — verify 336×280 or 970×250 for high-impact");
  }

  const blindness = insights.filter((i) =>
    i.technicalQa.some((t) => /banner.?blindness/i.test(t.text)),
  ).length;
  if (blindness > 0) {
    weaknesses.push(`Banner blindness risk in ${blindness} creative${blindness === 1 ? "" : "s"} — generic layout may be skipped on news/finance sites`);
  }

  if (bannerGood < insights.length) {
    optimizationTips.push("Add 300×250 and 728×90 exports for maximum DV360/TTD bid density");
  }
  if (nativeGood < insights.length) {
    optimizationTips.push("Supply 1200×628 landscape and 1080×1080 square for native responsive lines");
  }
  if (mobileAppGood < insights.length) {
    optimizationTips.push("Include 320×50 and 320×100 for in-app mobile inventory");
  }
  if (!optimizationTips.length) {
    optimizationTips.push("Maintain brand-safe contrast and single-message clarity for viewability scoring");
  }

  return {
    healthScore,
    riskLevel: healthRiskLevel(healthScore),
    compatibilityScore: dims.placementReadiness,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    optimizationTips: optimizationTips.slice(0, 4),
    dimensions: [
      { label: "Creative Fit", score: dims.creativeFit, note: "IAB format + launch readiness" },
      { label: "Inventory Coverage", score: dims.placementReadiness, note: "Banner, native, open web, in-app" },
      { label: "Viewability & DSP", score: dims.technicalCompliance, note: "150KB guidance, DSP coverage, blindness" },
      { label: "Objective Alignment", score: dims.goalAlignment, note: "Goal + vertical match from creative signals" },
    ],
    inventoryCoverage: [
      { label: "Display Banners", ready: bannerGood, total: insights.length },
      { label: "Native Ads", ready: nativeGood, total: insights.length },
      { label: "Open Web", ready: openWebGood, total: insights.length },
      { label: "Mobile App", ready: mobileAppGood, total: insights.length },
    ],
  };
}

function buildDataDrivenBriefing(overview, goalText, verticalText, insights, platformLabel, defaultFocusAreas) {
  const total = overview.totalCount || insights.length || 0;
  const ready = overview.readyCount || 0;
  const review = overview.reviewCount || 0;
  const misaligned = overview.misalignedCount || 0;
  const risks = overview.launchRisks || [];

  const headline = total
    ? `${ready} of ${total} display creative${total === 1 ? "" : "s"} launch-ready`
    : `${platformLabel} campaign intelligence`;

  const visualThemes = [...new Set(
    insights
      .map((i) => i.extractionSignals?.dominant_visual_cue || i.extractionSignals?.topic_summary)
      .filter(Boolean),
  )].slice(0, 2);

  const narrativeParts = [
    `Analysis of ${total || "uploaded"} static display creative${total === 1 ? "" : "s"} for a ${goalText} campaign in ${verticalText}.`,
  ];

  if (total > 0 && ready === total) {
    narrativeParts.push("All creatives passed platform validation and strategic alignment checks.");
  } else if (misaligned > 0) {
    narrativeParts.push(`${misaligned} creative${misaligned === 1 ? "" : "s"} conflict with the selected goal or vertical.`);
  } else if (review > 0) {
    narrativeParts.push(`${review} creative${review === 1 ? "" : "s"} need review before launch.`);
  }

  if (risks[0]) {
    narrativeParts.push(risks[0].replace(/^⚠️\s*/, ""));
  }

  if (visualThemes.length) {
    narrativeParts.push(`Detected visual themes: ${visualThemes.join("; ")}.`);
  }

  const focusAreas = [];
  if (misaligned > 0 || review > 0) focusAreas.push("Goal & vertical alignment");
  if (insights.some((i) => (i.technicalQa || []).some((t) => t.status === "fail"))) {
    focusAreas.push("Technical compliance");
  }
  if (insights.some((i) => Object.values(i.placementScores || {}).includes("bad"))) {
    focusAreas.push("Placement coverage");
  }
  for (const area of defaultFocusAreas) {
    if (focusAreas.length >= 5) break;
    if (!focusAreas.includes(area)) focusAreas.push(area);
  }

  return {
    headline,
    narrative: narrativeParts.join(" "),
    focusAreas: focusAreas.slice(0, 5),
  };
}

function buildGoogleBriefing(overview, goalText, verticalText, insights = []) {
  return buildDataDrivenBriefing(
    overview,
    goalText,
    verticalText,
    insights,
    "Google Ads",
    ["GDN IAB inventory", "Responsive Display / PMax", "Demand Gen feeds", "YouTube companion banners"],
  );
}

function buildMetaBriefing(overview, goalText, verticalText, insights = []) {
  return buildDataDrivenBriefing(
    overview,
    goalText,
    verticalText,
    insights,
    "Meta Ads",
    ["Feed 1:1 / 4:5 ratios", "Stories & Reels 9:16", "Text overlay policy", "Audience Network"],
  );
}

function buildProgrammaticBriefing(overview, goalText, verticalText, insights = []) {
  return buildDataDrivenBriefing(
    overview,
    goalText,
    verticalText,
    insights,
    "Programmatic",
    ["IAB banner matrix", "Native responsive assets", "DSP compatibility", "Viewability guidance"],
  );
}

function buildCreativeAnalysisSection(insights, platform) {
  const perCreative = insights.map((i) => ({
    id: i.creativeId,
    name: i.creativeName,
    status: i.launchStatus,
    statusKey: i.launchStatusKey,
    headline: i.extractionSignals?.headline || null,
    cta: i.extractionSignals?.cta || null,
    dominantVisual: i.extractionSignals?.dominant_visual_cue || i.extractionSignals?.topic_summary || null,
    textDensity: i.extractionSignals?.text_density || null,
    goalAligned: i.goalAlignment?.is_aligned,
    verticalAligned: i.verticalAlignment?.is_aligned,
  }));

  const aligned = insights.filter((i) => i.launchStatusKey === "ready").length;
  const textHeavy = insights.filter((i) => i.extractionSignals?.text_density === "high").length;
  const misalignedVertical = insights.filter((i) => i.verticalAlignment?.is_aligned === false).length;
  const misalignedGoal = insights.filter((i) => i.goalAlignment?.is_aligned === false).length;
  const visualCues = [...new Set(perCreative.map((c) => c.dominantVisual).filter(Boolean))].slice(0, 3);

  let summary = "";
  let highlights = [];

  if (platform === "google_ads") {
    summary = `${aligned}/${insights.length} display creatives launch-ready for Google Ads.${misalignedVertical ? ` ${misalignedVertical} vertical mismatch.` : ""}${misalignedGoal ? ` ${misalignedGoal} goal mismatch.` : ""}`;
    highlights = [
      textHeavy ? `${textHeavy} asset${textHeavy === 1 ? "" : "s"} carry high text density — risky for 320×50/728×90 placements` : null,
      visualCues.length ? `Visual signals: ${visualCues.join("; ")}` : null,
      perCreative.filter((c) => c.headline).length
        ? `Headlines detected in ${perCreative.filter((c) => c.headline).length} creative${perCreative.filter((c) => c.headline).length === 1 ? "" : "s"}`
        : "Visual-led assets — verify ad copy in Google Ads UI",
    ];
  } else if (platform === "meta_ads") {
    summary = `${aligned}/${insights.length} static image creatives evaluated for Meta placements.${misalignedVertical ? ` ${misalignedVertical} vertical conflict.` : ""}${misalignedGoal ? ` ${misalignedGoal} goal conflict.` : ""}`;
    highlights = [
      textHeavy ? `${textHeavy} creative${textHeavy === 1 ? "" : "s"} exceed recommended in-frame text density` : null,
      visualCues.length ? `Dominant visuals: ${visualCues.join("; ")}` : null,
      perCreative.filter((c) => c.cta).length
        ? `CTAs extracted from ${perCreative.filter((c) => c.cta).length} creative${perCreative.filter((c) => c.cta).length === 1 ? "" : "s"}`
        : null,
    ];
  } else {
    summary = `${aligned}/${insights.length} display assets assessed for programmatic RTB and open-web inventory.${misalignedVertical ? ` ${misalignedVertical} vertical mismatch.` : ""}`;
    highlights = [
      textHeavy ? `${textHeavy} banner${textHeavy === 1 ? "" : "s"} overloaded for peripheral scan` : null,
      visualCues.length ? `Visual themes: ${visualCues.join("; ")}` : null,
      misalignedGoal ? `${misalignedGoal} creative${misalignedGoal === 1 ? "" : "s"} misaligned with campaign goal` : null,
    ];
  }

  return { summary, highlights: highlights.filter(Boolean), perCreative };
}

function buildTechnicalQaSection(insights, platform) {
  const items = aggregateQaItems(insights, "technicalQa");
  const pass = items.filter((i) => i.status === "pass").length;
  const warn = items.filter((i) => i.status === "warn").length;
  const fail = items.filter((i) => i.status === "fail").length;

  const platformName = platform === "google_ads" ? "Google Ads" : platform === "meta_ads" ? "Meta Ads" : "Programmatic";
  const summary = `${pass} passed · ${warn} warnings · ${fail} failures — ${platformName} file, size, and readability checks from uploaded creatives.`;

  return { summary, items, passRate: qaPassRate(items) };
}

function buildPlacementQaSection(insights, platform, overview) {
  const items = aggregateQaItems(insights, "placementQa");
  const columns = overview.placementColumns || getPlacementColumns(platform);
  const matrixSummary = summarizePlacementMatrix(platform, insights, columns);

  let summary = matrixSummary;
  if (!summary) {
    if (platform === "google_ads") {
      summary = "Placement QA reflects GDN, Responsive Display, Demand Gen, Gmail, App, and YouTube companion fit per creative size.";
    } else if (platform === "meta_ads") {
      summary = "Placement QA reflects Feed, Stories, Reels, Messenger, and Audience Network fit with Meta-specific ratios.";
    } else {
      summary = "Placement QA reflects Native, Display Banner, Mobile App, and Open Web RTB inventory fit.";
    }
  }

  return {
    summary,
    items,
    passRate: qaPassRate(items),
    placementMatrix: overview.placementMatrix,
    placementColumns: columns,
    deviceMatrix: overview.deviceMatrix,
    deviceColumns: overview.deviceColumns,
    placementLegend: overview.placementLegend,
  };
}

function buildCreativeRiskSection(insights, overview) {
  const perCreativeRisks = insights.map((i) => ({
    id: i.creativeId,
    name: i.creativeName,
    status: i.launchStatus,
    statusKey: i.launchStatusKey,
    mainRisk: i.mainRisk,
    recommendedFix: i.recommendedFix,
  }));

  return {
    hasNoRisk: overview.hasNoRisk,
    launchRisks: overview.launchRisks,
    campaignLaunchStatus: overview.campaignLaunchStatus,
    recommendationBullets: overview.recommendationBullets,
    perCreativeRisks,
    counts: {
      ready: overview.readyCount,
      review: overview.reviewCount,
      misaligned: overview.misalignedCount,
      total: overview.totalCount,
    },
  };
}

export function buildPlatformOverviewSections({
  platform,
  insights,
  overview,
  goalText,
  verticalText,
}) {
  const briefingBuilders = {
    google_ads: buildGoogleBriefing,
    meta_ads: buildMetaBriefing,
    programmatic: buildProgrammaticBriefing,
  };
  const healthBuilders = {
    google_ads: buildGoogleCampaignHealth,
    meta_ads: buildMetaCampaignHealth,
    programmatic: buildProgrammaticCampaignHealth,
  };

  const briefingFn = briefingBuilders[platform] || buildProgrammaticBriefing;
  const healthFn = healthBuilders[platform] || buildProgrammaticCampaignHealth;

  return {
    briefing: briefingFn(overview, goalText, verticalText, insights),
    campaignHealth: healthFn(insights, overview),
    creativeAnalysis: buildCreativeAnalysisSection(insights, platform),
    technicalQa: buildTechnicalQaSection(insights, platform),
    placementQa: buildPlacementQaSection(insights, platform, overview),
    creativeRiskSummary: buildCreativeRiskSection(insights, overview),
    platform,
  };
}

export { CAMPAIGN_LAUNCH_STATUS };
