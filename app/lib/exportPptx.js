/**
 * exportPptx.js
 * Exports the slide preview as a real .pptx file using pptxgenjs.
 *
 * viewMode: "single"   → 1 slide with all creatives in a grid
 * viewMode: "multiple" → 1 slide per creative
 */

import pptxgen from "pptxgenjs";

// Slide dimensions (16:9 widescreen in inches)
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;

// Theme colours
const BG_COLOR = "0F172A";
const ACCENT_COLOR = "7C3AED";
const TEXT_COLOR = "FFFFFF";
const MUTED_COLOR = "94A3B8";

/**
 * Convert a data-URL or http URL to a usable pptxgenjs image src.
 * pptxgenjs accepts data-URLs directly.
 */
function imgSrc(url) {
  return url; // data:image/... URLs work fine
}

/**
 * Draw a rounded rectangle background on a slide (approximated with a filled rect).
 */
function addSlideBackground(slide) {
  slide.background = { color: BG_COLOR };
}

/**
 * Add Adigator branding footer on every slide.
 */
function addFooter(slide, slideNum, totalSlides) {
  slide.addText("Adigator Creative Studio", {
    x: 0.3,
    y: SLIDE_H - 0.4,
    w: 4,
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

/**
 * Single-slide export: All creatives integrated into a mock template layout.
 */
function buildSingleSlide(prs, validCreatives, templateName) {
  const slide = prs.addSlide();
  
  // Set light background for template feel
  slide.background = { color: "F8FAFC" }; 

  // ── MOCK TEMPLATE HEADER ──
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: 0.8,
    fill: { color: "0F172A" },
  });
  
  slide.addText(`ADIGATOR ${templateName.toUpperCase()}`, {
    x: 0.5, y: 0.15, w: 5, h: 0.5,
    fontSize: 24, bold: true, color: "3B82F6", fontFace: "Arial",
  });
  
  slide.addText("HOME      ABOUT      SERVICES      CONTACT", {
    x: SLIDE_W - 4.5, y: 0.25, w: 4, h: 0.3,
    fontSize: 10, bold: true, color: "94A3B8", align: "right", fontFace: "Arial",
  });

  const count = validCreatives.length;
  if (count === 0) {
    slide.addText("No valid creatives to display.", {
      x: 1, y: 3, w: SLIDE_W - 2, h: 1,
      fontSize: 14, color: "64748B", align: "center"
    });
    addFooter(slide, 1, 1);
    return;
  }

  // ── DYNAMIC TEMPLATE LAYOUT ENGINE ──
  // We place creatives into logical zones (Top Banner, Sidebar, Main Content)
  
  // 1. Top Banner Zone (e.g. 728x90, 970x250)
  const topBanner = validCreatives.find(c => c.size.includes("728") || c.size.includes("970"));
  
  // 2. Sidebar Zone (e.g. 160x600, 300x600)
  const sidebarAd = validCreatives.find(c => c !== topBanner && (c.size.includes("160") || c.size.includes("600") || c.size.includes("1050")));
  
  // 3. Main Content Zone (the rest, usually 300x250, 320x50, etc)
  const remainingAds = validCreatives.filter(c => c !== topBanner && c !== sidebarAd);

  let currentY = 1.0;

  // Render Top Banner if exists
  if (topBanner) {
    const w = 7.28;
    const h = 0.90;
    slide.addText("Advertisement", { x: (SLIDE_W - w) / 2, y: currentY, w, h: 0.15, fontSize: 8, color: "94A3B8", align: "center" });
    try {
      slide.addImage({ data: imgSrc(topBanner.url), x: (SLIDE_W - w) / 2, y: currentY + 0.15, w, h, sizing: { type: "contain" } });
    } catch (e) {}
    currentY += h + 0.4;
  }

  // Render Layout Split (Left Main Content, Right Sidebar)
  const leftW = sidebarAd ? SLIDE_W - 3.5 : SLIDE_W - 1.0;
  
  // Mock Article Content in Main Zone
  slide.addText("Featured Content & News", {
    x: 0.5, y: currentY, w: leftW - 1, h: 0.4,
    fontSize: 20, bold: true, color: "0F172A"
  });
  slide.addShape(prs.ShapeType.rect, {
    x: 0.5, y: currentY + 0.4, w: leftW - 1, h: 0.02,
    fill: { color: "CBD5E1" }
  });

  // Distribute remaining ads in the content area
  if (remainingAds.length > 0) {
    const startX = 0.5;
    const startY = currentY + 0.6;
    let rx = startX;
    let ry = startY;
    
    remainingAds.forEach((ad, i) => {
      const [nw, nh] = ad.size.split("x").map(Number);
      // Scale down so it fits
      const maxW = 3.0; 
      const scale = Math.min(maxW / (nw || 300), 1);
      const w = (nw || 300) * scale * 0.01; // rough inch conversion
      const h = (nh || 250) * scale * 0.01;
      
      slide.addText("Sponsored", { x: rx, y: ry, w, h: 0.15, fontSize: 8, color: "94A3B8" });
      try {
        slide.addImage({ data: imgSrc(ad.url), x: rx, y: ry + 0.15, w, h, sizing: { type: "contain" } });
      } catch (e) {}
      
      rx += w + 0.5;
      if (rx + w > leftW) {
        rx = startX;
        ry += h + 0.3;
      }
    });
  }

  // Render Sidebar Ad
  if (sidebarAd) {
    const sx = SLIDE_W - 3.0;
    const sy = currentY;
    const [nw, nh] = sidebarAd.size.split("x").map(Number);
    const maxW = 2.5;
    const scale = Math.min(maxW / (nw || 300), 1);
    const w = (nw || 300) * scale * 0.01;
    const h = (nh || 600) * scale * 0.01;
    
    slide.addShape(prs.ShapeType.rect, {
      x: sx - 0.2, y: sy - 0.2, w: maxW, h: SLIDE_H - sy,
      fill: { color: "F1F5F9" } // Sidebar background
    });
    
    slide.addText("Advertisement", { x: sx, y: sy, w, h: 0.15, fontSize: 8, color: "94A3B8", align: "center" });
    try {
      slide.addImage({ data: imgSrc(sidebarAd.url), x: sx, y: sy + 0.15, w, h, sizing: { type: "contain" } });
    } catch (e) {}
  }

  addFooter(slide, 1, 1);
}

/**
 * Multiple-slides export: one slide per creative.
 */
function buildMultipleSlides(prs, validCreatives, templateName) {
  const total = validCreatives.length;

  validCreatives.forEach((creative, i) => {
    const slide = prs.addSlide();
    addSlideBackground(slide);

    // Accent bar top-left
    slide.addShape(prs.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.06,
      h: SLIDE_H,
      fill: { color: ACCENT_COLOR },
      line: { color: ACCENT_COLOR },
    });

    // Creative name
    slide.addText(creative.name || `Creative ${i + 1}`, {
      x: 0.4,
      y: 0.2,
      w: SLIDE_W - 2,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: TEXT_COLOR,
      fontFace: "Arial",
    });

    // Size + template badge
    slide.addText(`${creative.size}  ·  ${templateName}`, {
      x: 0.4,
      y: 0.68,
      w: SLIDE_W - 1,
      h: 0.3,
      fontSize: 10,
      color: MUTED_COLOR,
      fontFace: "Arial",
    });

    // Separator
    slide.addShape(prs.ShapeType.rect, {
      x: 0.4,
      y: 1.05,
      w: SLIDE_W - 0.8,
      h: 0.02,
      fill: { color: "334155" },
      line: { color: "334155" },
    });

    // Creative image centred
    const maxW = SLIDE_W - 1.2;
    const maxH = SLIDE_H - 2.0;

    const [natW, natH] = creative.size.split("x").map(Number);
    let imgW = maxW;
    let imgH = (natH / natW) * imgW;
    if (imgH > maxH) {
      imgH = maxH;
      imgW = (natW / natH) * imgH;
    }
    const imgX = (SLIDE_W - imgW) / 2;
    const imgY = 1.2 + (maxH - imgH) / 2;

    if (creative.url) {
      try {
        slide.addImage({
          data: imgSrc(creative.url),
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          sizing: { type: "contain", w: imgW, h: imgH },
        });
      } catch {
        slide.addShape(prs.ShapeType.rect, {
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          fill: { color: "1E293B" },
          line: { color: "334155" },
        });
        slide.addText("Image unavailable", {
          x: imgX,
          y: imgY + imgH / 2 - 0.2,
          w: imgW,
          h: 0.4,
          fontSize: 12,
          color: MUTED_COLOR,
          align: "center",
        });
      }
    }

    addFooter(slide, i + 1, total);
  });
}

/**
 * Main export function.
 *
 * @param {Object[]} validCreatives - array of creative objects { id, name, url, size }
 * @param {"single"|"multiple"} viewMode
 * @param {string} templateName - human-readable template name (e.g. "Newspaper")
 */
export async function exportToPptx(validCreatives, viewMode = "multiple", templateName = "Template") {
  const prs = new pptxgen();

  // Presentation metadata
  prs.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches (16:9)
  prs.author = "Adigator Creative Studio";
  prs.company = "Adigator";
  prs.subject = "Creative Preview";
  prs.title = `Adigator — ${templateName} Preview`;

  if (viewMode === "single") {
    buildSingleSlide(prs, validCreatives, templateName);
  } else {
    buildMultipleSlides(prs, validCreatives, templateName);
  }

  const filename = `Adigator_${templateName}_${viewMode === "single" ? "SingleSlide" : `${validCreatives.length}Slides`}.pptx`;
  await prs.writeFile({ fileName: filename });
  return filename;
}
