/**
 * exportAnalysisPdf.js
 * Structured per-creative analysis report — Overview → QA → Creative Analysis.
 */

import {
  compareStrategicEntries,
  getEntryPayload,
  getStrategicAlignmentScore,
  getStrategicFlow,
  getValidatedRecommendations,
} from "./strategicPresentation";
import { computeCampaignOverview, computeCreativeInsight } from "./analyzerInsights";
import { hydrateCreativesForExport } from "./exportPptx";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  bg: [15, 23, 42],
  white: [255, 255, 255],
  muted: [148, 163, 184],
  body: [203, 213, 225],
  accent: [14, 165, 233],
  emerald: [74, 222, 128],
  amber: [250, 204, 21],
  rose: [248, 113, 113],
  panel: [30, 41, 59],
};

const PLATFORM_LABELS = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  programmatic: "Programmatic Ads",
};

function setFill(doc, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fillPageBackground(doc) {
  setFill(doc, COLORS.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function addPageFooter(doc, pageNum, totalPages) {
  setText(doc, COLORS.muted);
  doc.setFontSize(8);
  doc.text("Adigator Advertising Intelligence System", MARGIN, PAGE_H - 24);
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 24, { align: "right" });
}

function addAccentBar(doc, y = 0, h = 6) {
  setFill(doc, COLORS.accent);
  doc.rect(0, y, PAGE_W, h, "F");
}

function addSectionTitle(doc, title, subtitle, y) {
  addAccentBar(doc, y, 4);
  setText(doc, COLORS.white);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(title, MARGIN, y + 28);
  if (subtitle) {
    setText(doc, COLORS.muted);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(subtitle, MARGIN, y + 44);
  }
  return y + (subtitle ? 58 : 42);
}

function scoreColor(score) {
  if (score >= 70) return COLORS.emerald;
  if (score >= 45) return COLORS.amber;
  return COLORS.rose;
}

function qaStatusColor(status) {
  if (status === "pass") return COLORS.emerald;
  if (status === "warn") return COLORS.amber;
  return COLORS.rose;
}

function qaStatusIcon(status) {
  if (status === "pass") return "✓";
  if (status === "warn") return "!";
  return "✕";
}

function wrapText(doc, text, maxW, fontSize = 10) {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(String(text || "—"), maxW);
}

function drawTextBlock(doc, text, x, y, maxW, fontSize = 10, color = COLORS.body) {
  setText(doc, color);
  const lines = wrapText(doc, text, maxW, fontSize);
  doc.text(lines, x, y);
  return y + lines.length * (fontSize + 3);
}

function ensureSpace(doc, y, needed, pageState) {
  if (y + needed <= PAGE_H - 50) return y;
  doc.addPage();
  fillPageBackground(doc);
  pageState.current += 1;
  return 48;
}

function drawPanel(doc, x, y, w, h) {
  setFill(doc, COLORS.panel);
  doc.roundedRect(x, y, w, h, 4, 4, "F");
}

function tryAddImage(doc, dataUrl, x, y, w, h) {
  if (!dataUrl) return false;
  try {
    doc.addImage(dataUrl, x, y, w, h, undefined, "FAST");
    return true;
  } catch {
    return false;
  }
}

function addCoverPage(doc, meta, creativeCount, pageState) {
  fillPageBackground(doc);
  addAccentBar(doc, 0, 8);

  setText(doc, COLORS.accent);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("ADIGATOR CREATIVE INTELLIGENCE", MARGIN, 72);

  setText(doc, COLORS.white);
  doc.setFontSize(28);
  doc.text("Campaign Analysis Report", MARGIN, 108);

  setText(doc, COLORS.body);
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  const platformLabel = PLATFORM_LABELS[meta.platform] || meta.platform || "Campaign";
  doc.text(`${platformLabel}  ·  Goal: ${(meta.goalLabel || meta.goal || "awareness").toUpperCase()}`, MARGIN, 132);
  doc.text(`Vertical: ${meta.verticalLabel || meta.vertical || "General"}`, MARGIN, 148);
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, 164);

  if (meta.campaignName) {
    doc.text(`Campaign: ${meta.campaignName}`, MARGIN, 188);
  }
  if (meta.advertiserName) {
    doc.text(`Advertiser: ${meta.advertiserName}${meta.advertiserId ? ` (${meta.advertiserId})` : ""}`, MARGIN, 204);
  }

  drawPanel(doc, MARGIN, 230, CONTENT_W, 100);
  setText(doc, COLORS.white);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Report Contents", MARGIN + 16, 254);

  setText(doc, COLORS.body);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  const bullets = [
    "Campaign Overview — launch readiness, health score, and priority risks",
    `Creative Profiles (${creativeCount}) — each asset presented individually`,
    "Per Creative: Overview → QA Results → Creative Analysis & Recommendations",
  ];
  bullets.forEach((line, index) => {
    doc.text(`• ${line}`, MARGIN + 16, 274 + index * 16);
  });

  if (meta.overview) {
    const { readyCount, reviewCount, misalignedCount, totalCount } = meta.overview;
    drawPanel(doc, MARGIN, 350, CONTENT_W, 72);
    setText(doc, COLORS.emerald);
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text(`${readyCount}/${totalCount}`, MARGIN + 16, 386);
    setText(doc, COLORS.muted);
    doc.setFontSize(9);
    doc.text("Launch Ready", MARGIN + 16, 402);

    setText(doc, COLORS.amber);
    doc.setFontSize(22);
    doc.text(String(reviewCount), MARGIN + 120, 386);
    setText(doc, COLORS.muted);
    doc.setFontSize(9);
    doc.text("Needs Review", MARGIN + 120, 402);

    setText(doc, COLORS.rose);
    doc.setFontSize(22);
    doc.text(String(misalignedCount), MARGIN + 240, 386);
    setText(doc, COLORS.muted);
    doc.setFontSize(9);
    doc.text("Misaligned", MARGIN + 240, 402);
  }

  addPageFooter(doc, pageState.current, pageState.total);
}

function addCampaignOverviewPage(doc, overview, meta, pageState) {
  doc.addPage();
  fillPageBackground(doc);
  pageState.current += 1;

  let y = addSectionTitle(
    doc,
    "Campaign Overview",
    overview?.sections?.briefing?.headline || "Launch readiness and strategic summary",
    32,
  );

  const briefing = overview?.sections?.briefing;
  if (briefing?.narrative) {
    drawPanel(doc, MARGIN, y, CONTENT_W, 88);
    y = drawTextBlock(doc, briefing.narrative, MARGIN + 14, y + 18, CONTENT_W - 28, 10, COLORS.body) + 16;
  }

  const health = overview?.sections?.campaignHealth;
  if (health) {
    drawPanel(doc, MARGIN, y, CONTENT_W, 120);
    setText(doc, COLORS.white);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Campaign Health: ${health.healthScore}/100 — ${health.riskLevel?.label || "Assessed"}`, MARGIN + 14, y + 22);

    let innerY = y + 38;
    (health.strengths || []).slice(0, 3).forEach((item) => {
      innerY = drawTextBlock(doc, `✓ ${item}`, MARGIN + 14, innerY, CONTENT_W - 28, 9, COLORS.emerald);
    });
    (health.weaknesses || []).slice(0, 3).forEach((item) => {
      innerY = drawTextBlock(doc, `⚠ ${item}`, MARGIN + 14, innerY, CONTENT_W - 28, 9, COLORS.amber);
    });
    y += 132;
  }

  if (overview?.launchRisks?.length) {
    setText(doc, COLORS.white);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Priority Launch Risks", MARGIN, y);
    y += 18;
    overview.launchRisks.slice(0, 6).forEach((risk) => {
      y = ensureSpace(doc, y, 24, pageState);
      y = drawTextBlock(doc, risk.replace(/^⚠️\s*|🔴\s*/, "• "), MARGIN + 8, y, CONTENT_W - 16, 9, COLORS.rose) + 4;
    });
  }

  addPageFooter(doc, pageState.current, pageState.total);
}

function addQaSection(doc, title, items, startY, pageState) {
  let y = startY;
  setText(doc, COLORS.white);
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text(title, MARGIN, y);
  y += 18;

  if (!items?.length) {
    y = drawTextBlock(doc, "No items recorded.", MARGIN, y, CONTENT_W, 9, COLORS.muted);
    return y + 8;
  }

  items.forEach((item) => {
    y = ensureSpace(doc, y, 28, pageState);
    const status = item.status || "warn";
    setText(doc, qaStatusColor(status));
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text(qaStatusIcon(status), MARGIN, y);
    y = drawTextBlock(doc, item.text, MARGIN + 14, y, CONTENT_W - 20, 9, COLORS.body) + 6;
  });

  return y + 8;
}

function addCreativeReportPages(doc, entry, insight, index, total, meta, pageState) {
  const creative = entry.creative || entry;
  const payload = getEntryPayload(entry) || {};
  const flow = getStrategicFlow(payload);
  const score = getStrategicAlignmentScore(payload) ?? 0;
  const recommendations = getValidatedRecommendations(payload);
  const imageData = creative.pdfImageData || creative.pptxImageData;

  // —— Page 1: Overview ——
  doc.addPage();
  fillPageBackground(doc);
  pageState.current += 1;

  let y = addSectionTitle(
    doc,
    `Creative ${index + 1} of ${total}: ${creative.name || "Untitled"}`,
    `${creative.size || ""}  ·  ${insight.launchStatus?.label || "Assessed"}`,
    32,
  );

  const imageW = 220;
  const imageH = 150;
  drawPanel(doc, MARGIN, y, imageW + 24, imageH + 24);
  const imagePlaced = tryAddImage(doc, imageData, MARGIN + 12, y + 12, imageW, imageH);
  if (!imagePlaced) {
    setText(doc, COLORS.muted);
    doc.setFontSize(9);
    doc.text("Creative preview unavailable", MARGIN + 12, y + imageH / 2 + 12);
  }

  const infoX = MARGIN + imageW + 44;
  let infoY = y + 16;
  drawPanel(doc, infoX, y, PAGE_W - infoX - MARGIN, imageH + 24);

  setText(doc, COLORS.muted);
  doc.setFontSize(9);
  doc.text("OVERVIEW", infoX + 14, infoY);
  infoY += 16;

  setText(doc, scoreColor(score));
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Strategic Alignment: ${score}/100`, infoX + 14, infoY);
  infoY += 22;

  setText(doc, COLORS.body);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(`Goal: ${insight.goalAlignment?.is_aligned === false ? "Misaligned" : insight.goalAlignment?.is_aligned ? "Aligned" : "Review"}`, infoX + 14, infoY);
  infoY += 14;
  doc.text(`Vertical: ${insight.verticalStatus?.label || insight.verticalAlignment?.alignment_status || "Review"}`, infoX + 14, infoY);
  infoY += 14;
  doc.text(`Launch: ${insight.launchStatus?.emoji || ""} ${insight.launchStatus?.label || "—"}`, infoX + 14, infoY);
  infoY += 20;

  if (insight.mainRisk) {
    infoY = drawTextBlock(doc, `Main risk: ${insight.mainRisk}`, infoX + 14, infoY, PAGE_W - infoX - MARGIN - 20, 8, COLORS.rose);
  }
  if (flow.strategicAlignmentSummary) {
    drawTextBlock(doc, flow.strategicAlignmentSummary, infoX + 14, infoY + 4, PAGE_W - infoX - MARGIN - 20, 8, COLORS.body);
  }

  y += imageH + 44;

  if (insight.riskAssessment) {
    const { criticalIssues, complianceConcerns, optimizationOpportunities } = insight.riskAssessment;
    setText(doc, COLORS.white);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Risk Snapshot", MARGIN, y);
    y += 16;
    [...(criticalIssues || []).slice(0, 2), ...(complianceConcerns || []).slice(0, 2), ...(optimizationOpportunities || []).slice(0, 2)].forEach((line) => {
      y = ensureSpace(doc, y, 20, pageState);
      y = drawTextBlock(doc, `• ${line}`, MARGIN + 8, y, CONTENT_W - 16, 8, COLORS.body) + 2;
    });
  }

  addPageFooter(doc, pageState.current, pageState.total);

  // —— Page 2: QA Results ——
  doc.addPage();
  fillPageBackground(doc);
  pageState.current += 1;

  y = addSectionTitle(doc, "QA Results", `${creative.name} — technical and placement validation`, 32);
  y = addQaSection(doc, "Technical QA", insight.technicalQa, y, pageState);
  y = addQaSection(doc, "Placement QA", insight.placementQa, y + 8, pageState);

  addPageFooter(doc, pageState.current, pageState.total);

  // —— Page 3: Creative Analysis ——
  doc.addPage();
  fillPageBackground(doc);
  pageState.current += 1;

  y = addSectionTitle(doc, "Creative Analysis", `${creative.name} — insights, findings, and recommendations`, 32);

  if (flow.mainStrategicProblem) {
    drawPanel(doc, MARGIN, y, CONTENT_W, 56);
    setText(doc, COLORS.muted);
    doc.setFontSize(8);
    doc.text("MAIN STRATEGIC PROBLEM", MARGIN + 14, y + 16);
    drawTextBlock(doc, flow.mainStrategicProblem, MARGIN + 14, y + 28, CONTENT_W - 28, 9, COLORS.body);
    y += 68;
  }

  if (flow.businessConsequence) {
    drawPanel(doc, MARGIN, y, CONTENT_W, 56);
    setText(doc, COLORS.muted);
    doc.setFontSize(8);
    doc.text("BUSINESS CONSEQUENCE", MARGIN + 14, y + 16);
    drawTextBlock(doc, flow.businessConsequence, MARGIN + 14, y + 28, CONTENT_W - 28, 9, COLORS.amber);
    y += 68;
  }

  setText(doc, COLORS.white);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Recommended Interventions", MARGIN, y);
  y += 18;

  if (!recommendations.length) {
    y = drawTextBlock(doc, "No priority fixes identified — creative meets strategic thresholds.", MARGIN, y, CONTENT_W, 10, COLORS.emerald);
  } else {
    recommendations.slice(0, 4).forEach((rec) => {
      y = ensureSpace(doc, y, 70, pageState);
      drawPanel(doc, MARGIN, y, CONTENT_W, 62);
      let innerY = y + 14;
      innerY = drawTextBlock(doc, `Issue: ${rec.issue || "N/A"}`, MARGIN + 14, innerY, CONTENT_W - 28, 9, COLORS.white);
      innerY = drawTextBlock(doc, `Why: ${rec.why_it_hurts || "N/A"}`, MARGIN + 14, innerY + 2, CONTENT_W - 28, 8, COLORS.rose);
      drawTextBlock(doc, `Fix: ${rec.recommended_change || rec.action || "N/A"}`, MARGIN + 14, innerY + 2, CONTENT_W - 28, 8, COLORS.emerald);
      y += 72;
    });
  }

  const signals = insight.extractionSignals || {};
  y = ensureSpace(doc, y + 12, 80, pageState);
  setText(doc, COLORS.white);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Extraction Signals", MARGIN, y);
  y += 16;

  [
    signals.headline ? `Headline: ${signals.headline}` : null,
    signals.cta ? `CTA: ${signals.cta}` : null,
    signals.primary_message ? `Message: ${signals.primary_message}` : null,
    signals.text_density ? `Text density: ${signals.text_density}` : null,
    signals.dominant_visual_cue ? `Visual cue: ${signals.dominant_visual_cue}` : null,
  ].filter(Boolean).forEach((line) => {
    y = drawTextBlock(doc, line, MARGIN + 8, y, CONTENT_W - 16, 8, COLORS.body) + 2;
  });

  addPageFooter(doc, pageState.current, pageState.total);
}

/**
 * @param {Object[]} analysisResult - analysis entries from Preview Tool
 * @param {Object} meta - { platform, goal, goalLabel, vertical, verticalLabel, campaignName, advertiserName, advertiserId, campaignBrief, campaignProductFocus }
 */
export async function exportAnalysisPdf(analysisResult, meta = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "pt" });

  const sorted = [...(analysisResult || [])].sort(compareStrategicEntries);
  const exportItems = sorted.map((entry) => ({
    creative: entry.creative,
    analysisData: getEntryPayload(entry),
  }));

  const hydrated = await hydrateCreativesForExport(exportItems);
  const hydratedEntries = hydrated.map((item, index) => ({
    ...sorted[index],
    creative: {
      ...(item.creative || item),
      pdfImageData: (item.creative || item).pptxImageData,
    },
  }));

  const overview = computeCampaignOverview(
    analysisResult,
    meta.platform,
    meta.goal,
    meta.vertical,
    (v) => meta.verticalLabel || v,
    (g) => meta.goalLabel || g?.replace(/_/g, " "),
    {
      campaignBrief: meta.campaignBrief,
      campaignProductFocus: meta.campaignProductFocus,
    },
  );

  const insights = hydratedEntries.map((entry) =>
    computeCreativeInsight(entry, meta.platform, meta.goal, meta.vertical, {
      campaignBrief: meta.campaignBrief,
      campaignProductFocus: meta.campaignProductFocus,
    }),
  );

  const pageState = {
    current: 1,
    total: 2 + hydratedEntries.length * 3,
  };

  addCoverPage(doc, { ...meta, overview }, hydratedEntries.length, pageState);
  addCampaignOverviewPage(doc, overview, meta, pageState);

  hydratedEntries.forEach((entry, index) => {
    addCreativeReportPages(doc, entry, insights[index], index, hydratedEntries.length, meta, pageState);
  });

  const filename = meta.filename || "Campaign_Analysis_Report.pdf";
  doc.save(filename);
  return filename;
}
