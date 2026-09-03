/**
 * exportPptx.js
 * Exports strategic intelligence reports as .pptx with full analysis detail.
 */

import pptxgen from "pptxgenjs";
import { getCreativeBlob, previewKey } from "./creativeAssetStore";
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
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") && trimmed.includes("base64,")) {
    return trimmed;
  }
  return null;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

async function fetchUrlAsDataUri(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") && trimmed.includes("base64,")) {
    return trimmed;
  }
  if (!trimmed.startsWith("blob:") && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  try {
    const response = await fetch(trimmed);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    return imgSrc(dataUrl);
  } catch {
    return null;
  }
}

async function resolveCreativeExportImage(creative) {
  if (!creative || typeof creative !== "object") return null;

  const inlineCandidates = [
    creative.pptxImageData,
    creative.previewDataUrl,
    creative.url,
    creative.fullUrl,
    creative.imageDataUrl,
    creative.image,
  ];

  for (const candidate of inlineCandidates) {
    const normalized = imgSrc(candidate);
    if (normalized) return normalized;
  }

  if (creative.id) {
    try {
      const previewBlob = await getCreativeBlob(previewKey(creative.id));
      const fullBlob = previewBlob || await getCreativeBlob(creative.id);
      if (fullBlob) {
        const dataUrl = await blobToDataUrl(fullBlob);
        const normalized = imgSrc(dataUrl);
        if (normalized) return normalized;
      }
    } catch {
      // fall through to URL fetch
    }
  }

  for (const candidate of inlineCandidates) {
    const resolved = await fetchUrlAsDataUri(candidate);
    if (resolved) return resolved;
  }

  return null;
}

export async function hydrateCreativesForExport(validCreatives) {
  return Promise.all(
    validCreatives.map(async (item) => {
      const creative = item.creative || item;
      const pptxImageData = await resolveCreativeExportImage(creative);
      if (!pptxImageData) {
        return item;
      }
      if (item.creative) {
        return {
          ...item,
          creative: { ...creative, pptxImageData },
        };
      }
      return { ...item, pptxImageData };
    }),
  );
}

function addSlideBackground(slide) {
  slide.background = { color: BG_COLOR };
}

function addFooter(slide, slideNum, totalSlides) {
  slide.addText("Adigator IQ Advertising Intelligence System", {
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
    "Adigator IQ Creative Validation Report",
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

  if (entry.creative.url || entry.creative.pptxImageData) {
    const imageData = imgSrc(entry.creative.pptxImageData || entry.creative.url);
    if (imageData) {
      try {
        slide.addImage({
          data: imageData,
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
    } else {
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
    addHeader(prs, slide, "Adigator IQ Validation Report", "Run AI analysis before exporting — no analysis payloads found.");
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

const PREVIEW_TEMPLATE_LABELS = {
  news: "News Articles",
  blog: "Blog",
  native_display: "Native Display",
  health: "Health",
  newspaper: "News website layout",
  ecommerce: "E-commerce product page",
  health_legacy: "Native ad placement",
  technology: "Product landing page",
  business: "Feature comparison layout",
  entertainment: "Video platform preview",
};

function parsePreviewCacheKey(entryKey) {
  const parts = String(entryKey || "").split("|");
  return {
    templateId: parts[0] || "news",
    device: parts[1] || "desktop",
    creativeId: parts[2] || "",
    creativeSize: parts[3] || "",
    goal: parts[4] || "",
    creativeVertical: parts[5] || "",
  };
}

function templateLabel(templateId) {
  return PREVIEW_TEMPLATE_LABELS[templateId] || templateId.replace(/_/g, " ");
}

function deviceLabel(device) {
  if (device === "mobile") return "Mobile";
  if (device === "tablet") return "Tablet";
  return "Desktop";
}

function extractPreviewHeadline(output) {
  const env = output?.generatedEnvironment;
  if (!env) return "";
  const headlineBlock = (env.contextBlocks || []).find((b) => b.type === "headline");
  if (headlineBlock?.text) return headlineBlock.text;
  if (env.pageTitle) return env.pageTitle;
  if (env.landingPage?.hero?.headline) return env.landingPage.hero.headline;
  return "";
}

function extractPreviewContextLines(output, max = 6) {
  const env = output?.generatedEnvironment;
  if (!env) return [];

  const lines = [];
  if (env.publisherName) lines.push(`Publisher: ${env.publisherName}`);
  if (env.layoutType) lines.push(`Layout: ${env.layoutType.replace(/_/g, " ")}`);

  (env.contextBlocks || []).slice(0, 4).forEach((block) => {
    if (block.text) {
      lines.push(`${block.type}: ${block.text}${block.secondary ? ` — ${block.secondary}` : ""}`);
    }
  });

  (env.uiModules || []).slice(0, 2).forEach((mod) => {
    if (mod.label) lines.push(`${mod.type}: ${mod.label}`);
    (mod.items || []).slice(0, 2).forEach((item) => {
      if (item.text) lines.push(`  • ${item.text}`);
    });
  });

  const mapping = output?.creativeMapping;
  if (mapping?.slotDescription) lines.push(`Placement: ${mapping.slotDescription}`);

  const validation = output?.validation;
  if (validation?.overallStatus) {
    lines.push(`Validation: ${validation.overallStatus.toUpperCase()}`);
  }

  return lines.slice(0, max);
}

function addPreviewStudioCoverSlide(prs, meta, cacheEntries, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  addHeader(
    prs,
    slide,
    "Preview Studio Visual Report",
    `${meta?.campaignName || "Campaign"}  ·  ${meta?.verticalLabel || meta?.vertical || "General"}`,
  );

  slide.addText("Contextual preview snapshots across templates, devices, and placements", {
    x: 0.6,
    y: 1.55,
    w: 11,
    h: 0.4,
    fontSize: 13,
    color: "67E8F9",
    fontFace: "Arial",
  });

  slide.addText(`Creatives: ${meta?.creativeCount || 0}  ·  Preview variants: ${cacheEntries.length}`, {
    x: 0.6,
    y: 2.05,
    w: 10,
    h: 0.35,
    fontSize: 11,
    color: "E2E8F0",
    fontFace: "Arial",
  });

  const templates = [...new Set(cacheEntries.map((e) => e.templateId))];
  slide.addText(`Templates: ${templates.map(templateLabel).join(" · ")}`, {
    x: 0.6,
    y: 2.45,
    w: 11.5,
    h: 0.35,
    fontSize: 10,
    color: "CBD5E1",
    fontFace: "Arial",
  });

  addFooter(slide, slideNum, totalSlides);
}

function addPreviewCreativeDividerSlide(prs, creative, index, total, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  addHeader(
    prs,
    slide,
    `Creative ${index + 1} of ${total}`,
    creative?.name || "Untitled Creative",
  );

  slide.addText(creative?.size || "", {
    x: 0.6,
    y: 1.5,
    w: 6,
    h: 0.35,
    fontSize: 12,
    color: "94A3B8",
    fontFace: "Arial",
  });

  if (creative?.previewVertical) {
    slide.addText(`Detected vertical: ${creative.previewVertical.replace(/_/g, " ")}`, {
      x: 0.6,
      y: 1.9,
      w: 8,
      h: 0.35,
      fontSize: 10,
      color: "CBD5E1",
      fontFace: "Arial",
    });
  }

  addFooter(slide, slideNum, totalSlides);
}

function addPreviewSnapshotSlide(prs, entry, creative, slideNum, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const headline = extractPreviewHeadline(entry.output);
  const subtitle = [
    templateLabel(entry.templateId),
    deviceLabel(entry.device),
    entry.creativeSize,
    entry.creativeVertical ? entry.creativeVertical.replace(/_/g, " ") : null,
  ].filter(Boolean).join("  ·  ");

  addHeader(
    prs,
    slide,
    creative?.name || "Preview Snapshot",
    subtitle,
  );

  const frameX = 0.55;
  const frameY = 1.15;
  const frameW = 6.2;
  const frameH = 5.6;

  slide.addShape(prs.ShapeType.roundRect, {
    x: frameX,
    y: frameY,
    w: frameW,
    h: frameH,
    fill: { color: "FFFFFF" },
    line: { color: "334155", pt: 1 },
    radius: 0.08,
  });

  slide.addShape(prs.ShapeType.rect, {
    x: frameX,
    y: frameY,
    w: frameW,
    h: 0.35,
    fill: { color: "E2E8F0" },
    line: { color: "E2E8F0" },
  });

  slide.addText(envBrowserDots(), {
    x: frameX + 0.15,
    y: frameY + 0.08,
    w: 1,
    h: 0.2,
    fontSize: 7,
    color: "64748B",
    fontFace: "Arial",
  });

  const imageData = imgSrc(creative?.pptxImageData);
  const imageInsetX = frameX + 0.35;
  const imageInsetY = frameY + 0.55;
  const imageW = frameW - 0.7;
  const imageH = 2.4;

  if (imageData) {
    try {
      slide.addImage({
        data: imageData,
        x: imageInsetX,
        y: imageInsetY,
        w: imageW,
        h: imageH,
        sizing: { type: "contain", w: imageW, h: imageH },
      });
    } catch {
      slide.addText("Creative image unavailable", {
        x: imageInsetX,
        y: imageInsetY + 1,
        w: imageW,
        h: 0.3,
        fontSize: 9,
        color: "64748B",
        fontFace: "Arial",
      });
    }
  }

  if (headline) {
    slide.addText(headline, {
      x: imageInsetX,
      y: imageInsetY + imageH + 0.15,
      w: imageW,
      h: 0.45,
      fontSize: 11,
      bold: true,
      color: "0F172A",
      fontFace: "Arial",
      breakLine: true,
    });
  }

  const publisher = entry.output?.generatedEnvironment?.publisherName;
  if (publisher) {
    slide.addText(publisher, {
      x: imageInsetX,
      y: imageInsetY + imageH + 0.62,
      w: imageW,
      h: 0.25,
      fontSize: 8,
      color: "64748B",
      fontFace: "Arial",
    });
  }

  slide.addShape(prs.ShapeType.roundRect, {
    x: 7.1,
    y: 1.15,
    w: 5.7,
    h: 5.6,
    fill: { color: "111827", transparency: 8 },
    line: { color: "334155" },
    radius: 0.06,
  });

  slide.addText("PREVIEW CONTEXT", {
    x: 7.35,
    y: 1.35,
    w: 5,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: "67E8F9",
    fontFace: "Arial",
  });

  let y = 1.65;
  extractPreviewContextLines(entry.output, 8).forEach((line) => {
    slide.addText(line, {
      x: 7.35,
      y,
      w: 5.2,
      h: 0.32,
      fontSize: 8,
      color: "CBD5E1",
      fontFace: "Arial",
      breakLine: true,
    });
    y += 0.34;
  });

  const decision = entry.output?.previewDecision;
  if (decision?.reason && y < 6.2) {
    slide.addText(`Why this environment: ${decision.reason}`, {
      x: 7.35,
      y: Math.min(y + 0.2, 5.9),
      w: 5.2,
      h: 0.55,
      fontSize: 7,
      color: "94A3B8",
      fontFace: "Arial",
      breakLine: true,
    });
  }

  addFooter(slide, slideNum, totalSlides);
}

function envBrowserDots() {
  return "● ● ●";
}

function buildPreviewStudioDeck(prs, validCreatives, meta = {}) {
  const cache = meta.previewStudioCache;
  const cacheEntries = [];

  if (cache?.entries && typeof cache.entries === "object") {
    Object.entries(cache.entries).forEach(([entryKey, cacheEntry]) => {
      if (!cacheEntry?.output) return;
      const parsed = parsePreviewCacheKey(entryKey);
      cacheEntries.push({
        entryKey,
        output: cacheEntry.output,
        generatedAt: cacheEntry.generatedAt,
        ...parsed,
      });
    });
  }

  const creativeById = new Map(
    validCreatives.map((item) => {
      const creative = item.creative || item;
      return [creative.id, { ...item, creative }];
    }),
  );

  if (cacheEntries.length === 0) {
    buildStrategicDeck(prs, validCreatives, meta.templateName || "Template", meta);
    return;
  }

  cacheEntries.sort((a, b) => {
    const nameA = creativeById.get(a.creativeId)?.creative?.name || a.creativeId;
    const nameB = creativeById.get(b.creativeId)?.creative?.name || b.creativeId;
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    if (a.templateId !== b.templateId) return a.templateId.localeCompare(b.templateId);
    return a.device.localeCompare(b.device);
  });

  const creativeIds = [...new Set(cacheEntries.map((e) => e.creativeId))];
  const totalSlides = 1 + creativeIds.length + cacheEntries.length;
  let slideNum = 1;

  addPreviewStudioCoverSlide(
    prs,
    { ...meta, creativeCount: creativeIds.length },
    cacheEntries,
    slideNum++,
    totalSlides,
  );

  creativeIds.forEach((creativeId, index) => {
    const item = creativeById.get(creativeId);
    if (item) {
      addPreviewCreativeDividerSlide(prs, item.creative, index, creativeIds.length, slideNum++, totalSlides);
    }
    cacheEntries
      .filter((entry) => entry.creativeId === creativeId)
      .forEach((entry) => {
        addPreviewSnapshotSlide(prs, entry, item?.creative, slideNum++, totalSlides);
      });
  });
}

/**
 * @param {Object[]} validCreatives - array of { id, name, url, size, analysisData? }
 * @param {"single"|"multiple"} viewMode
 * @param {string} templateName
 * @param {Object} meta - { goal, platform, vertical, verticalLabel, overview, previewStudioCache, reportKind }
 */
export async function exportToPptx(validCreatives, viewMode = "multiple", templateName = "Template", meta = {}) {
  const prs = new pptxgen();
  prs.layout = "LAYOUT_WIDE";
  prs.author = "Adigator IQ Advertising Intelligence";
  prs.company = "Adigator IQ";
  prs.subject = meta.reportKind === "preview_studio"
    ? "Preview Studio Visual Report"
    : "Advertising Intelligence Report";
  prs.title = meta.reportKind === "preview_studio"
    ? `Adigator IQ Preview Studio — ${meta.campaignName || templateName}`
    : `Adigator IQ Validation Report — ${templateName}`;

  const hydratedCreatives = await hydrateCreativesForExport(validCreatives);

  if (meta.reportKind === "preview_studio" && meta.previewStudioCache?.entries) {
    buildPreviewStudioDeck(prs, hydratedCreatives, { ...meta, templateName });
  } else {
    buildStrategicDeck(prs, hydratedCreatives, templateName, meta);
  }

  const filename = meta.reportKind === "preview_studio"
    ? `AdigatorIQ_Preview_Studio_${validCreatives.length}Creatives.pptx`
    : `AdigatorIQ_Advertising_Intelligence_${viewMode === "single" ? "Single" : `${validCreatives.length}Creatives`}.pptx`;
  await prs.writeFile({ fileName: filename });
  return filename;
}
