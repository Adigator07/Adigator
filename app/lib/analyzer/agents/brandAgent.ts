import { OcrBlock, normalizeOCRText, fuzzyIncludes } from '../utils/textUtils';

export interface BrandDetectionResult {
  detected: boolean;
  score: number;
  position: string;
  confidence: number;
  verdict?: string;
}

export function runBrandAgent(
  blocks: OcrBlock[],
  imgWidth: number,
  imgHeight: number,
  knownBrandName?: string
): BrandDetectionResult {
  console.log("BRAND INPUT:", blocks);
  
  if (blocks.length === 0) {
    return { 
      detected: false, 
      score: 0, 
      position: "unknown", 
      confidence: 0,
      verdict: "No brand elements detected."
    };
  }

  let bestScore = 0;
  let bestPos = "unknown";
  let confidence = 0;
  
  const fontSizes = blocks.map(b => b.font_size_px ?? b.bbox.height).sort((a,b)=>b-a);
  const top25 = fontSizes[Math.floor(fontSizes.length * 0.25)] ?? 0;

  for (const block of blocks) {
    let score = 0;
    const text = block.text.trim();
    
    // Ignore small tokens
    if (text.length < 2) continue;

    // Readability/Size importance (+30)
    const size = block.font_size_px ?? block.bbox.height;
    if (size >= top25 && top25 > 0) score += 30;
    
    // Position (+20)
    const relY = block.bbox.y / imgHeight;
    const relX = block.bbox.x / imgWidth;
    let pos = "center";
    if (relY < 0.2) pos = "top";
    else if (relY > 0.8) pos = "bottom";
    if (relX < 0.3) pos += "-left";
    else if (relX > 0.7) pos += "-right";
    
    if (pos.includes("top") || pos.includes("bottom") || pos.includes("-left") || pos.includes("-right")) {
       score += 20;
    }

    // Brand Match (+40)
    if (knownBrandName) {
      if (fuzzyIncludes(text, knownBrandName)) {
        score += 40;
      }
    } else {
      // If no known brand, capitalized short words in corners are likely brands
      if (text === text.toUpperCase() && text.length <= 12 && pos !== "center" && block.confidence > 80) {
        score += 40;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
      confidence = block.confidence;
    }
  }

  const finalScore = Math.min(100, bestScore);
  const detected = finalScore >= 40;

  return {
    detected,
    score: finalScore,
    position: bestPos,
    confidence,
    verdict: detected ? "Brand presence confirmed." : "Low brand visibility detected."
  };
}
