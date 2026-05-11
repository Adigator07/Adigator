/**
 * exportPptx.js
 * Exports orchestrator-driven strategic intelligence reports as .pptx.
 *
 * All exported slides use orchestrator fields only.
 */

import pptxgen from "pptxgenjs";
import {
  compareStrategicEntries,
  getEntryPayload,
  getStrategicAlignmentScore,
  getStrategicFlow,
  getStrategicRankLabel,
  getStrategicRecommendationText,
  isValidStrategicPayload,
  getBehavioralResponse,
  getValidatedRecommendations,
} from "./strategicPresentation";

const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const BG_COLOR = "0F172A";
const ACCENT_COLOR = "0EA5E9";
const TEXT_COLOR = "FFFFFF";
const MUTED_COLOR = "94A3B8";

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

function addWrappedLine(slide, label, value, y) {
  const text = `${label}: ${value || "Strategic analysis incomplete"}`;
  slide.addText(text, {
    x: 0.6,
    y,
    w: SLIDE_W - 1.2,
    h: 0.42,
    fontSize: 10,
    color: "CBD5E1",
    fontFace: "Arial",
    breakLine: true,
  });
}

function addCoverSlide(prs, entries, meta, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  addHeader(
    prs,
    slide,
    "Behavioral Intelligence Report",
    `Campaign Goal: ${meta?.goal || "awareness"}  |  Platform: ${meta?.platform || "programmatic"}`
  );

  slide.addText("Enterprise Behavioral Advertising Intelligence System", {
    x: 0.6,
    y: 1.6,
    w: 6.5,
    h: 0.5,
    fontSize: 16,
    bold: true,
    color: "67E8F9",
    fontFace: "Arial",
  });

  slide.addText(`Validated strategic reviews: ${entries.length}`, {
    x: 0.6,
    y: 2.1,
    w: 6.5,
    h: 0.35,
    fontSize: 11,
    color: "E2E8F0",
    fontFace: "Arial",
  });

  slide.addText("Intelligence Flow", {
    x: 0.6,
    y: 2.8,
    w: 4,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });

  const flowLines = [
    "1. Audience Psychology & Mental State",
    "2. Strategic Context & Problem",
    "3. Business Impact Analysis",
    "4. Attention Flow Dynamics",
    "5. Behavioral Interventions",
    "6. Expected Improvement",
    "7. Strategic Alignment Summary",
  ];

  flowLines.forEach((line, index) => {
    slide.addText(line, {
      x: 0.8,
      y: 3.2 + index * 0.36,
      w: 6.4,
      h: 0.3,
      fontSize: 10,
      color: "CBD5E1",
      fontFace: "Arial",
    });
  });

  addFooter(slide, 1, totalSlides);
}

function addRankingSlide(prs, entries, meta, totalSlides) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  addHeader(prs, slide, "Strategic Alignment Priority", `Template Context: ${meta?.templateName || "Strategic"}`);

  let y = 1.4;
  entries.forEach((entry, index) => {
    const payload = getEntryPayload(entry) || {};
    const label = getStrategicRankLabel(payload);
    const score = getStrategicAlignmentScore(payload);

    slide.addShape(prs.ShapeType.roundRect, {
      x: 0.6,
      y,
      w: SLIDE_W - 1.2,
      h: 0.62,
      fill: { color: "111827", transparency: 10 },
      line: { color: "334155" },
      radius: 0.06,
    });

    slide.addText(`${index + 1}. ${entry.creative.name || `Creative ${index + 1}`}`, {
      x: 0.85,
      y: y + 0.14,
      w: 6.2,
      h: 0.22,
      fontSize: 11,
      bold: true,
      color: "FFFFFF",
      fontFace: "Arial",
    });

    slide.addText(label, {
      x: 7.2,
      y: y + 0.14,
      w: 3.1,
      h: 0.22,
      fontSize: 9,
      color: "A5F3FC",
      fontFace: "Arial",
    });

    slide.addText(`Strategic Alignment: ${score ?? "N/A"}/100`, {
      x: 10.4,
      y: y + 0.14,
      w: 2.3,
      h: 0.22,
      fontSize: 9,
      align: "right",
      color: "E2E8F0",
      fontFace: "Arial",
    });

    y += 0.74;
  });

  addFooter(slide, 2, totalSlides);
}

function addCreativeSlide(prs, entry, index, totalCreatives) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const payload = getEntryPayload(entry) || {};

  const flow = getStrategicFlow(payload);
  const behavioral = getBehavioralResponse(payload);
  const recommendations = getValidatedRecommendations(payload);
  const rankLabel = getStrategicRankLabel(payload);
  const score = getStrategicAlignmentScore(payload);

  addHeader(prs, slide, `${entry.creative.name || `Creative ${index + 1}`}`, `${rankLabel}  |  Strategic Alignment: ${score ?? "N/A"}/100`);

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

  // AUDIENCE PSYCHOLOGY
  slide.addText("AUDIENCE PSYCHOLOGY", {
    x: 5.4,
    y,
    w: 7.4,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  y += 0.42;

  if (behavioral) {
    const psychFields = [
      [`Emotional State`, behavioral.emotional_state],
      [`Likely Objection`, behavioral.likely_objection],
      [`Trust Gap`, behavioral.trust_gap],
      [`Expected Behavior`, behavioral.likely_behavior],
    ];

    for (const [label, value] of psychFields) {
      slide.addText(`${label}:`, {
        x: 5.4,
        y,
        w: 1.8,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: "67E8F9",
        fontFace: "Arial",
      });
      slide.addText(value || "Analysis unavailable", {
        x: 7.4,
        y,
        w: 5.4,
        h: 0.25,
        fontSize: 8,
        color: "CBD5E1",
        fontFace: "Arial",
      });
      y += 0.35;
    }
  }

  y += 0.15;

  // STRATEGIC PROBLEM
  slide.addText("STRATEGIC PROBLEM", {
    x: 5.4,
    y,
    w: 7.4,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  y += 0.42;

  slide.addText(flow.mainStrategicProblem || "Analysis incomplete", {
    x: 5.4,
    y,
    w: 7.4,
    h: 0.6,
    fontSize: 8,
    color: "CBD5E1",
    fontFace: "Arial",
    breakLine: true,
  });

  addFooter(slide, index + 3, totalCreatives + 2);
}

function addBehavioralInterventionsSlide(prs, entry, index, totalCreatives) {
  const slide = prs.addSlide();
  addSlideBackground(slide);
  const payload = getEntryPayload(entry) || {};

  const recommendations = getValidatedRecommendations(payload);
  const rankLabel = getStrategicRankLabel(payload);
  const score = getStrategicAlignmentScore(payload);

  addHeader(prs, slide, `Behavioral Interventions: ${entry.creative.name || `Creative ${index + 1}`}`, `Priority Interventions (Top 3)`);

  let y = 1.3;

  if (recommendations.length === 0) {
    slide.addText("No behavioral interventions available for this creative.", {
      x: 0.6,
      y: 2.5,
      w: SLIDE_W - 1.2,
      h: 0.5,
      fontSize: 11,
      color: "94A3B8",
      fontFace: "Arial",
    });
  } else {
    for (const rec of recommendations.slice(0, 3)) {
      slide.addShape(prs.ShapeType.roundRect, {
        x: 0.6,
        y,
        w: SLIDE_W - 1.2,
        h: 1.2,
        fill: { color: "111827", transparency: 10 },
        line: { color: "334155" },
        radius: 0.06,
      });

      slide.addText(`Issue: ${rec.issue || "N/A"}`, {
        x: 0.8,
        y: y + 0.1,
        w: SLIDE_W - 1.6,
        h: 0.24,
        fontSize: 10,
        bold: true,
        color: "FFFFFF",
        fontFace: "Arial",
      });

      slide.addText(`Barrier: ${rec.emotional_barrier || rec.why_it_hurts || "N/A"}`, {
        x: 0.8,
        y: y + 0.38,
        w: SLIDE_W - 1.6,
        h: 0.22,
        fontSize: 8,
        color: "FCA5A5",
        fontFace: "Arial",
        breakLine: true,
      });

      slide.addText(`Intervention: ${rec.recommended_change || rec.action || "N/A"}`, {
        x: 0.8,
        y: y + 0.64,
        w: SLIDE_W - 1.6,
        h: 0.22,
        fontSize: 8,
        color: "86EFAC",
        fontFace: "Arial",
        breakLine: true,
      });

      y += 1.4;
    }
  }

  addFooter(slide, index + 4, totalCreatives + 3);
}

function buildStrategicDeck(prs, validCreatives, templateName, meta = {}) {
  const entries = validCreatives
    .filter((creative) => isValidStrategicPayload(creative?.analysisData))
    .map((creative) => ({ creative, data: creative.analysisData }))
    .sort(compareStrategicEntries);

  if (entries.length === 0) {
    const slide = prs.addSlide();
    addSlideBackground(slide);
    addHeader(prs, slide, "Behavioral Intelligence Report", "No valid orchestrator payloads were available for export");
    addFooter(slide, 1, 1);
    return;
  }

  const totalSlides = entries.length * 2 + 2;
  addCoverSlide(prs, entries, { ...meta, templateName }, totalSlides);
  addRankingSlide(prs, entries, { ...meta, templateName }, totalSlides);

  entries.forEach((entry, index) => {
    addCreativeSlide(prs, entry, index, entries.length);
    addBehavioralInterventionsSlide(prs, entry, index, entries.length);
  });
}

/**
 * Main export function.
 *
 * @param {Object[]} validCreatives - array of { id, name, url, size, analysisData? }
 * @param {"single"|"multiple"} viewMode
 * @param {string} templateName
 * @param {Object} meta - { goal, platform }
 */
export async function exportToPptx(validCreatives, viewMode = "multiple", templateName = "Template", meta = {}) {
  const prs = new pptxgen();
  prs.layout   = "LAYOUT_WIDE";
  prs.author   = "Adigator Advertising Intelligence";
  prs.company  = "Adigator";
  prs.subject  = "Advertising Intelligence Report";
  prs.title    = `Adigator Behavioral Intelligence Report — ${templateName}`;

  buildStrategicDeck(prs, validCreatives, templateName, meta);

  const filename = `Adigator_Advertising_Intelligence_${viewMode === "single" ? "Single" : `${validCreatives.length}Creatives`}.pptx`;
  await prs.writeFile({ fileName: filename });
  return filename;
}
