/**
 * exportPptx.js
 * Exports strategic intelligence reports as .pptx with full analysis detail.
 */

import pptxgen from "pptxgenjs";
import {
  compareStrategicEntries,
  getEntryPayload,
  getGoalAlignment,
  getStrategicAlignmentScore,
  getStrategicFlow,
  getStrategicRankLabel,
  getVerticalAlignment,
  getExtractionSignals,
  isValidStrategicPayload,
  getValidatedRecommendations,
} from "./strategicPresentation";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const BG_COLOR = "0F172A";
const ACCENT_COLOR = "0EA5E9";
const TEXT_COLOR = "FFFFFF";
const MUTED_COLOR = "94A3B8";

const PLATFORM_LABELS = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  programmatic: "Programmatic Ads",
};

function imgSrc(url) {
  return url;
}

function addSlideBackground(slide) {
  slide.background = { color: BG_COLOR };
}

function addFooter(slide, slideNum, totalSlides) {
  slide.addText("Adigator Advertising Intelligence System", {
    x: 0.3,
    y: SLIDE_H - 0.4,
    w: 5,
    h: 0.3,
    fontSize: 8,
    color: MUTED_COLOR,
    fontFace: "Arial",
  });
  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: SLIDE_W - 1,
    y: SLIDE_H - 0.4,
    w: 0.7,
    h: 0.3,
    fontSize: 8,
    color: MUTED_COLOR,
    fontFace: "Arial",
    align: "right",
  });
}

function addHeader(prs, slide, title, subtitle) {
  slide.addShape(prs.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.08,
    fill: { color: ACCENT_COLOR },
    line: { color: ACCENT_COLOR },
  });

  slide.addText(title, {
    x: 0.5,
    y: 0.22,
    w: SLIDE_W - 1,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: TEXT_COLOR,
    fontFace: "Arial",
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 0.68,
      w: SLIDE_W - 1,
      h: 0.35,
      fontSize: 10,
      color: MUTED_COLOR,
      fontFace: "Arial",
    });
  }
}

function alignmentLabel(isAligned) {
  if (isAligned === true) return "Aligned";
  if (isAligned === false) return "Misaligned";
  return "Needs Review";
}

function normalizeExportEntries(validCreatives) {
  return validCreatives
    .map((item) => {
      const payload = item.analysisData || getEntryPayload(item);
      if (!isValidStrategicPayload(payload)) return null;
      const creative = item.creative || item;
      return { creative, data: payload };
    })
    .filter(Boolean)
    .sort(compareStrategicEntries);
}

function addCoverSlide(prs, entries, meta, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const platformLabel = PLATFORM_LABELS[meta?.platform] || meta?.platform || "Programmatic";
  addHeader(
    prs,
    slide,
    "Adigator Creative Validation Report",
    `Goal: ${meta?.goal || "awareness"}  |  Vertical: ${meta?.verticalLabel || meta?.vertical || "general"}  |  Platform: ${platformLabel}`,
  );

  slide.addText("Display / Image Creative Intelligence", {
    x: 0.6,
    y: 1.55,
    w: 8,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: "67E8F9",
    fontFace: "Arial",
  });

  slide.addText(`Creatives analyzed: ${entries.length}`, {
    x: 0.6,
    y: 2.05,
    w: 8,
    h: 0.35,
    fontSize: 11,
    color: "E2E8F0",
    fontFace: "Arial",
  });

  if (meta?.overview) {
    const { readyCount, reviewCount, misalignedCount, totalCount } = meta.overview;
    slide.addText(
      `Launch readiness: ${readyCount}/${totalCount} ready · ${reviewCount} review · ${misalignedCount} misaligned`,
      { x: 0.6, y: 2.45, w: 10, h: 0.35, fontSize: 10, color: "CBD5E1", fontFace: "Arial" },
    );
    if (meta.overview.launchRisks?.length) {
      meta.overview.launchRisks.slice(0, 4).forEach((risk, index) => {
        slide.addText(risk.replace(/^⚠️\s*/, "• "), {
          x: 0.8,
          y: 2.95 + index * 0.34,
          w: 11.5,
          h: 0.3,
          fontSize: 9,
          color: "FCA5A5",
          fontFace: "Arial",
        });
      });
    }
  }

  addFooter(slide, slideNum, totalSlides);
}

function addOverviewSlide(prs, meta, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  addHeader(prs, slide, "Campaign Overview", meta?.overview?.sections?.briefing?.headline || "Analysis summary");

  let y = 1.35;
  const briefing = meta?.overview?.sections?.briefing;
  if (briefing?.narrative) {
    slide.addText(briefing.narrative, {
      x: 0.6,
      y,
      w: SLIDE_W - 1.2,
      h: 0.9,
      fontSize: 10,
      color: "CBD5E1",
      fontFace: "Arial",
      breakLine: true,
    });
    y += 1.0;
  }

  const health = meta?.overview?.sections?.campaignHealth;
  if (health) {
    slide.addText(`Campaign Health: ${health.healthScore}/100 — ${health.riskLevel?.label || "Assessed"}`, {
      x: 0.6,
      y,
      w: SLIDE_W - 1.2,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fontFace: "Arial",
    });
    y += 0.4;

    (health.strengths || []).slice(0, 3).forEach((item) => {
      slide.addText(`✓ ${item}`, {
        x: 0.8,
        y,
        w: SLIDE_W - 1.4,
        h: 0.28,
        fontSize: 9,
        color: "86EFAC",
        fontFace: "Arial",
        breakLine: true,
      });
      y += 0.32;
    });

    (health.weaknesses || []).slice(0, 3).forEach((item) => {
      slide.addText(`⚠ ${item}`, {
        x: 0.8,
        y,
        w: SLIDE_W - 1.4,
        h: 0.28,
        fontSize: 9,
        color: "FCA5A5",
        fontFace: "Arial",
        breakLine: true,
      });
      y += 0.32;
    });
  }

  addFooter(slide, slideNum, totalSlides);
}

function addRankingSlide(prs, entries, meta, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  addHeader(prs, slide, "Strategic Alignment Priority", `Template: ${meta?.templateName || "Campaign"}`);

  let y = 1.4;
  entries.forEach((entry, index) => {
    const payload = getEntryPayload(entry) || {};
    const label = getStrategicRankLabel(payload);
    const score = getStrategicAlignmentScore(payload);
    const goal = getGoalAlignment(payload);
    const vertical = getVerticalAlignment(payload);

    slide.addShape(prs.ShapeType.roundRect, {
      x: 0.6,
      y,
      w: SLIDE_W - 1.2,
      h: 0.72,
      fill: { color: "111827", transparency: 10 },
      line: { color: "334155" },
      radius: 0.06,
    });

    slide.addText(`${index + 1}. ${entry.creative.name || `Creative ${index + 1}`}`, {
      x: 0.85,
      y: y + 0.1,
      w: 5.5,
      h: 0.22,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fontFace: "Arial",
    });

    slide.addText(`${label} · Score ${score ?? "N/A"}/100`, {
      x: 0.85,
      y: y + 0.36,
      w: 5.5,
      h: 0.22,
      fontSize: 8,
      color: "A5F3FC",
      fontFace: "Arial",
    });

    slide.addText(
      `Goal: ${alignmentLabel(goal?.is_aligned)} · Vertical: ${alignmentLabel(vertical?.is_aligned)}`,
      {
        x: 6.5,
        y: y + 0.22,
        w: 6.2,
        h: 0.22,
        fontSize: 8,
        align: "right",
        color: "E2E8F0",
        fontFace: "Arial",
      },
    );

    y += 0.82;
  });

  addFooter(slide, slideNum, totalSlides);
}

function addCreativeSlide(prs, entry, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const payload = getEntryPayload(entry) || {};
  const flow = getStrategicFlow(payload);
  const rankLabel = getStrategicRankLabel(payload);
  const score = getStrategicAlignmentScore(payload);

  addHeader(
    prs,
    slide,
    entry.creative.name || "Creative Analysis",
    `${rankLabel} · Strategic Alignment ${score ?? "N/A"}/100 · ${entry.creative.size || ""}`,
  );

  const imageW = 4.6;
  const imageH = 3.1;
  const imageX = 0.6;
  const imageY = 1.2;

  if (entry.creative.url) {
    try {
      slide.addImage({
        data: imgSrc(entry.creative.url),
        x: imageX,
        y: imageY,
        w: imageW,
        h: imageH,
        sizing: { type: "contain", w: imageW, h: imageH },
      });
    } catch {
      slide.addText("Creative image unavailable", {
        x: imageX,
        y: imageY + 1.2,
        w: imageW,
        h: 0.4,
        fontSize: 10,
        color: "94A3B8",
      });
    }
  }

  let y = 1.2;
  slide.addText("STRATEGIC SUMMARY", {
    x: 5.4,
    y,
    w: 7.4,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  y += 0.38;

  const summaryFields = [
    ["Main Risk", flow.mainStrategicProblem],
    ["Campaign Fit", flow.campaignFit],
    ["Inventory Fit", flow.inventoryFit],
    ["Business Impact", flow.businessConsequence],
    ["Expected Improvement", flow.expectedImprovement],
  ];

  for (const [label, value] of summaryFields) {
    slide.addText(`${label}: ${value || "—"}`, {
      x: 5.4,
      y,
      w: 7.4,
      h: 0.42,
      fontSize: 8,
      color: "CBD5E1",
      fontFace: "Arial",
      breakLine: true,
    });
    y += 0.46;
  }

  addFooter(slide, slideNum, totalSlides);
}

function addAlignmentSlide(prs, entry, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const payload = getEntryPayload(entry) || {};
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);
  const signals = getExtractionSignals(payload) || payload.extraction_signals || {};
  const attention = payload.attention_analysis || {};

  addHeader(prs, slide, `Alignment & Signals: ${entry.creative.name || "Creative"}`, "Goal, vertical, and extraction intelligence");

  let y = 1.3;
  slide.addText("GOAL ALIGNMENT", {
    x: 0.6,
    y,
    w: 6,
    h: 0.28,
    fontSize: 10,
    bold: true,
    color: "67E8F9",
    fontFace: "Arial",
  });
  y += 0.32;
  slide.addText(`Status: ${alignmentLabel(goal?.is_aligned)} · Selected: ${goal?.selected_goal || "—"} · Detected stage: ${goal?.detected_goal_stage || "—"}`, {
    x: 0.6,
    y,
    w: 12,
    h: 0.25,
    fontSize: 8,
    color: "CBD5E1",
    fontFace: "Arial",
  });
  y += 0.3;
  slide.addText(goal?.reason || goal?.ai_goal_feedback || "—", {
    x: 0.6,
    y,
    w: 12,
    h: 0.5,
    fontSize: 8,
    color: "E2E8F0",
    fontFace: "Arial",
    breakLine: true,
  });
  y += 0.55;

  slide.addText("VERTICAL ALIGNMENT", {
    x: 0.6,
    y,
    w: 6,
    h: 0.28,
    fontSize: 10,
    bold: true,
    color: "67E8F9",
    fontFace: "Arial",
  });
  y += 0.32;
  slide.addText(
    `Status: ${alignmentLabel(vertical?.is_aligned)} · Selected: ${vertical?.selected_vertical || "—"} · Detected: ${vertical?.detected_vertical || "unknown"} · Fit ${vertical?.fit_score ?? "—"}%`,
    { x: 0.6, y, w: 12, h: 0.25, fontSize: 8, color: "CBD5E1", fontFace: "Arial" },
  );
  y += 0.3;
  slide.addText(vertical?.reason || vertical?.strategic_interpretation || "—", {
    x: 0.6,
    y,
    w: 12,
    h: 0.55,
    fontSize: 8,
    color: "E2E8F0",
    fontFace: "Arial",
    breakLine: true,
  });
  y += 0.6;

  slide.addText("EXTRACTION SIGNALS", {
    x: 0.6,
    y,
    w: 6,
    h: 0.28,
    fontSize: 10,
    bold: true,
    color: "67E8F9",
    fontFace: "Arial",
  });
  y += 0.32;

  const signalLines = [
    signals.headline ? `Headline: ${signals.headline}` : null,
    signals.cta ? `CTA: ${signals.cta}` : null,
    signals.primary_message ? `Message: ${signals.primary_message}` : null,
    signals.text_density ? `Text density: ${signals.text_density}` : null,
    signals.dominant_visual_cue ? `Visual cue: ${signals.dominant_visual_cue}` : null,
    attention.primary_focal_point ? `Focal point: ${attention.primary_focal_point}` : null,
    vertical?.product_category ? `Product category: ${vertical.product_category}` : null,
    vertical?.advertising_behavior ? `Ad behavior: ${vertical.advertising_behavior}` : null,
  ].filter(Boolean);

  if (!signalLines.length) {
    slide.addText("No extraction signals available.", {
      x: 0.6,
      y,
      w: 12,
      h: 0.3,
      fontSize: 8,
      color: "94A3B8",
      fontFace: "Arial",
    });
  } else {
    signalLines.slice(0, 6).forEach((line) => {
      slide.addText(line, {
        x: 0.6,
        y,
        w: 12,
        h: 0.28,
        fontSize: 8,
        color: "CBD5E1",
        fontFace: "Arial",
        breakLine: true,
      });
      y += 0.3;
    });
  }

  addFooter(slide, slideNum, totalSlides);
}

function addInterventionsSlide(prs, entry, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const payload = getEntryPayload(entry) || {};
  const recommendations = getValidatedRecommendations(payload);
  const aiIssues = payload?.ai_analysis?.issues || [];

  addHeader(prs, slide, `Recommended Fixes: ${entry.creative.name || "Creative"}`, "Priority interventions from strategic analysis");

  let y = 1.3;

  if (recommendations.length === 0 && !aiIssues.length) {
    slide.addText("No priority fixes identified — creative meets strategic thresholds.", {
      x: 0.6,
      y: 2.5,
      w: SLIDE_W - 1.2,
      h: 0.5,
      fontSize: 11,
      color: "86EFAC",
      fontFace: "Arial",
    });
  } else {
    for (const rec of recommendations.slice(0, 3)) {
      slide.addShape(prs.ShapeType.roundRect, {
        x: 0.6,
        y,
        w: SLIDE_W - 1.2,
        h: 1.15,
        fill: { color: "111827", transparency: 10 },
        line: { color: "334155" },
        radius: 0.06,
      });

      slide.addText(`Issue: ${rec.issue || "N/A"}`, {
        x: 0.8,
        y: y + 0.08,
        w: SLIDE_W - 1.6,
        h: 0.24,
        fontSize: 10,
        bold: true,
        color: "FFFFFF",
        fontFace: "Arial",
        breakLine: true,
      });

      slide.addText(`Why it hurts: ${rec.why_it_hurts || "N/A"}`, {
        x: 0.8,
        y: y + 0.34,
        w: SLIDE_W - 1.6,
        h: 0.22,
        fontSize: 8,
        color: "FCA5A5",
        fontFace: "Arial",
        breakLine: true,
      });

      slide.addText(`Fix: ${rec.recommended_change || rec.action || "N/A"}`, {
        x: 0.8,
        y: y + 0.58,
        w: SLIDE_W - 1.6,
        h: 0.22,
        fontSize: 8,
        color: "86EFAC",
        fontFace: "Arial",
        breakLine: true,
      });

      y += 1.3;
    }

    if (aiIssues.length && y < 5.5) {
      slide.addText("Additional AI findings:", {
        x: 0.6,
        y,
        w: 6,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: "A5F3FC",
        fontFace: "Arial",
      });
      y += 0.3;
      aiIssues.slice(0, 2).forEach((issue) => {
        slide.addText(`• ${issue.message}`, {
          x: 0.8,
          y,
          w: SLIDE_W - 1.4,
          h: 0.25,
          fontSize: 8,
          color: "CBD5E1",
          fontFace: "Arial",
          breakLine: true,
        });
        y += 0.28;
      });
    }
  }

  addFooter(slide, slideNum, totalSlides);
}

function buildStrategicDeck(prs, validCreatives, templateName, meta = {}) {
  const entries = normalizeExportEntries(validCreatives);

  if (entries.length === 0) {
    const slide = prs.addSlide();
    addSlideBackground(slide);
    addHeader(prs, slide, "Adigator Validation Report", "Run AI analysis before exporting — no analysis payloads found.");
    addFooter(slide, 1, 1);
    return;
  }

  const slidesPerCreative = 3;
  const totalSlides = 3 + entries.length * slidesPerCreative;
  let slideNum = 1;

  addCoverSlide(prs, entries, { ...meta, templateName }, slideNum++, totalSlides);
  addOverviewSlide(prs, { ...meta, templateName }, slideNum++, totalSlides);
  addRankingSlide(prs, entries, { ...meta, templateName }, slideNum++, totalSlides);

  entries.forEach((entry) => {
    addCreativeSlide(prs, entry, slideNum++, totalSlides);
    addAlignmentSlide(prs, entry, slideNum++, totalSlides);
    addInterventionsSlide(prs, entry, slideNum++, totalSlides);
  });
}

/**
 * @param {Object[]} validCreatives - array of { id, name, url, size, analysisData? }
 * @param {"single"|"multiple"} viewMode
 * @param {string} templateName
 * @param {Object} meta - { goal, platform, vertical, verticalLabel, overview }
 */
export async function exportToPptx(validCreatives, viewMode = "multiple", templateName = "Template", meta = {}) {
  const prs = new pptxgen();
  prs.layout = "LAYOUT_WIDE";
  prs.author = "Adigator Advertising Intelligence";
  prs.company = "Adigator";
  prs.subject = "Advertising Intelligence Report";
  prs.title = `Adigator Validation Report — ${templateName}`;

  buildStrategicDeck(prs, validCreatives, templateName, meta);

  const filename = `Adigator_Advertising_Intelligence_${viewMode === "single" ? "Single" : `${validCreatives.length}Creatives`}.pptx`;
  await prs.writeFile({ fileName: filename });
  return filename;
}
