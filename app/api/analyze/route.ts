/**
 * POST /api/analyze
 * Accepts { imageDataUrl, goal, creativeId, useCache? }
 * Sends the base64 image directly to OpenAI Vision (no Supabase Storage needed).
 * Caches results in the Supabase `analysis_results` table.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (DB only, no Storage) ────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
const rlMap = new Map<string, { count: number; t: number }>();
function checkRL(ip: string): boolean {
  const now = Date.now();
  const e = rlMap.get(ip);
  if (!e || now - e.t > 60_000) { rlMap.set(ip, { count: 1, t: now }); return true; }
  if (e.count >= 20) return false;
  e.count++;
  return true;
}

// ── Weighted score ─────────────────────────────────────────────────────────────
function weightedScore(r: any): number {
  const ctaMap: Record<string, number> = { none: 0, weak: 33, medium: 66, strong: 100 };
  return Math.round(
    (r.visual_quality ?? 50) * 0.25 +
    (ctaMap[r.cta_strength] ?? 0) * 0.25 +
    (r.text_clarity ?? 50) * 0.20 +
    (r.layout_score ?? 50) * 0.15 +
    (r.goal_fit ?? 50) * 0.15
  );
}

// ── OpenAI Vision call ─────────────────────────────────────────────────────────
async function callOpenAI(imageDataUrl: string, goal: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Please add it to .env.local and restart the dev server (Ctrl+C then npm run dev)."
    );
  }

  const goalCtx: Record<string, string> = {
    awareness:     "AWARENESS: prioritize high visual clarity, vibrant colors, low text clutter, strong brand presence.",
    consideration: "CONSIDERATION: prioritize balanced info, clear value proposition, moderate CTA.",
    conversion:    "CONVERSION: prioritize strong CTA, high contrast, clear direct message, urgency cues.",
  };

  const prompt = `You are an expert programmatic advertising analyst. Analyze this ad creative image for a ${goalCtx[goal] ?? goal} campaign.

Return ONLY valid JSON (no markdown, no extra text) with exactly these fields:
{
  "brightness": <integer 0-100>,
  "contrast": <integer 0-100>,
  "cta_presence": <true or false>,
  "cta_strength": <"none"|"weak"|"medium"|"strong">,
  "text_clarity": <integer 0-100>,
  "text_density": <"low"|"medium"|"high">,
  "layout_score": <integer 0-100>,
  "visual_quality": <integer 0-100>,
  "goal_fit": <integer 0-100>,
  "suggestions": [<3 to 5 concise actionable strings>]
}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageDataUrl, detail: "low" },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = (json.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = content.replace(/^```json?\s*/i, "").replace(/```$/, "").trim();

  let parsed: any;
  try { parsed = JSON.parse(cleaned); }
  catch { throw new Error(`Could not parse AI response as JSON: ${content.slice(0, 200)}`); }

  const clamp = (v: any) => Math.min(100, Math.max(0, Number(v) || 50));
  const ctaStrengths = ["none", "weak", "medium", "strong"];
  const densities = ["low", "medium", "high"];

  const r = {
    brightness:    clamp(parsed.brightness),
    contrast:      clamp(parsed.contrast),
    cta_presence:  Boolean(parsed.cta_presence),
    cta_strength:  ctaStrengths.includes(parsed.cta_strength) ? parsed.cta_strength : "none",
    text_clarity:  clamp(parsed.text_clarity),
    text_density:  densities.includes(parsed.text_density) ? parsed.text_density : "medium",
    layout_score:  clamp(parsed.layout_score),
    visual_quality:clamp(parsed.visual_quality),
    goal_fit:      clamp(parsed.goal_fit),
    suggestions:   Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    goal,
    analyzed_at: new Date().toISOString(),
  };

  return { ...r, overall_score: weightedScore(r) };
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
async function getCached(creativeId: string, goal: string) {
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb
      .from("analysis_results")
      .select("*")
      .eq("creative_id", creativeId)
      .eq("goal", goal)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  } catch { return null; }
}

async function saveResult(creativeId: string, result: any) {
  try {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("analysis_results").upsert({
      creative_id: creativeId,
      goal: result.goal,
      brightness: result.brightness,
      contrast: result.contrast,
      cta_presence: result.cta_presence,
      cta_strength: result.cta_strength,
      text_clarity: result.text_clarity,
      text_density: result.text_density,
      layout_score: result.layout_score,
      visual_quality: result.visual_quality,
      goal_fit: result.goal_fit,
      overall_score: result.overall_score,
      suggestions: result.suggestions,
      analyzed_at: result.analyzed_at,
      created_at: new Date().toISOString(),
    });
  } catch { /* silent — cache save is non-critical */ }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!checkRL(ip)) {
    return Response.json({ error: "Rate limit exceeded. Please wait 60 seconds." }, { status: 429 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { imageDataUrl, goal, creativeId, useCache = true } = body;

  // Validate
  if (!["awareness", "consideration", "conversion"].includes(goal)) {
    return Response.json({ error: "goal must be: awareness | consideration | conversion" }, { status: 400 });
  }
  if (!creativeId) {
    return Response.json({ error: "creativeId is required." }, { status: 400 });
  }
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return Response.json({ error: "imageDataUrl must be a valid image data URL (data:image/...)." }, { status: 400 });
  }

  // Cache check
  if (useCache) {
    const cached = await getCached(creativeId, goal);
    if (cached) return Response.json({ ...cached, cached: true });
  }

  // Run AI
  try {
    const result = await callOpenAI(imageDataUrl, goal);
    // Save to DB async (don't block response)
    saveResult(creativeId, result);
    return Response.json({ ...result, cached: false });
  } catch (err: any) {
    console.error("[/api/analyze]", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
