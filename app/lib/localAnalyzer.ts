import Tesseract from "tesseract.js";

// ── 1. BRIGHTNESS + CONTRAST (FRONTEND) ──
function analyzeImage(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { brightness: 50, contrast: 50 };

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let totalBrightness = 0;
  
  // Calculate brightness
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
  }

  const avgBrightness = totalBrightness / (data.length / 4);

  // Calculate contrast (standard deviation of brightness)
  let sumSqDiff = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const brightness = (r + g + b) / 3;
    const diff = brightness - avgBrightness;
    sumSqDiff += diff * diff;
  }
  const variance = sumSqDiff / (data.length / 4);
  const stdDev = Math.sqrt(variance);

  // Normalize to 0-100 (max std dev is roughly 127)
  const contrastScore = Math.min(100, Math.round((stdDev / 127) * 100));

  return {
    brightness: Math.round((avgBrightness / 255) * 100),
    contrast: contrastScore
  };
}

// ── 2. TEXT DETECTION (OCR) ──
async function detectText(imageUrl: string) {
  try {
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: m => console.log(m) // Optional: log progress
    });
    const text = result.data.text;
    return {
      text,
      textLength: text.length
    };
  } catch (err) {
    console.error("OCR Error:", err);
    return { text: "", textLength: 0 };
  }
}

// ── 3. CTA DETECTION (RULE-BASED) ──
function detectCTA(text: string) {
  const ctaWords = ["buy", "shop", "click", "order", "try", "sign up", "learn", "get", "start"];
  const found = ctaWords.some(word => text.toLowerCase().includes(word));
  return found;
}

// ── 4. TEXT CLARITY ──
function textClarity(textLength: number) {
  if (textLength < 50) return 90;
  if (textLength < 120) return 70;
  return 50;
}

// ── 5. GOAL ALIGNMENT ──
function goalScore(goal: string, cta: boolean, textLength: number) {
  if (goal === "awareness") {
    return textLength < 80 ? 85 : 60;
  }
  if (goal === "conversion") {
    return cta ? 90 : 50;
  }
  if (goal === "consideration") {
      return (textLength > 30 && textLength < 150) ? 80 : 60;
  }
  return 75;
}

// ── 6. FINAL ANALYSIS FUNCTION ──
export async function analyzeCreativeLocal(imageUrl: string, goal: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = async () => {
      try {
        const brightnessData = analyzeImage(img);
        const textData = await detectText(imageUrl);

        const cta = detectCTA(textData.text);
        const clarity = textClarity(textData.textLength);
        const goalFit = goalScore(goal, cta, textData.textLength);
        
        let ctaStrength = "none";
        if (cta) ctaStrength = textData.textLength < 100 ? "strong" : "medium";

        let textDensity = "medium";
        if (textData.textLength < 50) textDensity = "low";
        else if (textData.textLength > 150) textDensity = "high";

        const overall = Math.round(
          (brightnessData.brightness + brightnessData.contrast + clarity + goalFit + (cta ? 90 : 50)) / 5
        );

        const suggestions = [
          !cta && "Add a strong CTA (e.g., 'Buy Now', 'Learn More')",
          clarity < 70 && "Reduce text clutter to improve legibility",
          brightnessData.brightness < 40 && "Increase overall image brightness",
          brightnessData.contrast < 40 && "Increase contrast to make elements pop",
          (goal === "conversion" && !cta) && "Conversion campaigns critically need a CTA"
        ].filter(Boolean) as string[];

        if (suggestions.length === 0) {
            suggestions.push("Creative looks solid for this goal!");
        }

        resolve({
          brightness: brightnessData.brightness,
          contrast: brightnessData.contrast,
          cta_presence: cta,
          cta_strength: ctaStrength,
          text_clarity: clarity,
          text_density: textDensity,
          layout_score: Math.round((brightnessData.brightness + clarity) / 2),
          visual_quality: brightnessData.brightness,
          goal_fit: goalFit,
          overall_score: overall,
          suggestions: suggestions.slice(0, 5),
          goal: goal,
          source: "local-ai"
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for local analysis"));
    };
    img.src = imageUrl;
  });
}
