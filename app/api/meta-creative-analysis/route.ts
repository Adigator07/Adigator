import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 30;

interface DetectedElement {
  type: "text" | "logo" | "face" | "cta";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function normalizeImageForVision(buffer: Buffer) {
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width ?? 0;
  const shouldUpscale = width > 0 && width < 900;
  const transformed = shouldUpscale
    ? pipeline.resize({ width: 900, withoutEnlargement: false })
    : pipeline;
  const png = await transformed.png({ compressionLevel: 9 }).toBuffer();
  const normalizedMeta = await sharp(png).metadata();
  return {
    mimeType: "image/png" as const,
    base64: png.toString("base64"),
    width: normalizedMeta.width ?? width,
    height: normalizedMeta.height ?? (metadata.height ?? 0),
  };
}

function sanitizeElements(raw: unknown): DetectedElement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const type = String(record.type || "text").toLowerCase();
      const normalizedType = type.includes("logo")
        ? "logo"
        : type.includes("face") || type.includes("person")
          ? "face"
          : type.includes("cta") || type.includes("button")
            ? "cta"
            : "text";
      const x = Number(record.x);
      const y = Number(record.y);
      const width = Number(record.width);
      const height = Number(record.height);
      if (![x, y, width, height].every((v) => Number.isFinite(v))) return null;
      if (width <= 0 || height <= 0) return null;
      if (x < 0 || y < 0 || x + width > 1.05 || y + height > 1.05) return null;
      return {
        type: normalizedType as DetectedElement["type"],
        label: String(record.label || normalizedType),
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        width: Math.max(0, Math.min(1 - x, width)),
        height: Math.max(0, Math.min(1 - y, height)),
        confidence: Number.isFinite(Number(record.confidence))
          ? Math.max(0, Math.min(1, Number(record.confidence)))
          : 0.75,
      };
    })
    .filter(Boolean) as DetectedElement[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : "";

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ ok: false, error: "imageUrl or imageBase64 is required" }, { status: 400 });
    }

    const inputBuffer = imageBase64
      ? Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64")
      : await fetchImageBuffer(imageUrl);

    const normalized = await normalizeImageForVision(inputBuffer);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        source: "unavailable",
        width: normalized.width,
        height: normalized.height,
        elements: [],
        message: "OpenAI API key not configured — client heuristics only.",
      });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You detect important advertising creative elements for Meta Ads safe-zone analysis.",
            "Return JSON: { elements: [{ type, label, x, y, width, height, confidence }] }.",
            "Coordinates are normalized 0-1 relative to image width/height (top-left origin).",
            "Detect: text blocks (headline/body), logos, faces/people, CTA buttons.",
            "Include up to 10 elements. Be precise with bounding boxes.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${normalized.mimeType};base64,${normalized.base64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Detect text (OCR regions), logos, faces, and CTA buttons with bounding boxes.",
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({
        ok: true,
        source: "vision_failed",
        width: normalized.width,
        height: normalized.height,
        elements: [],
      });
    }

    const parsed = JSON.parse(raw) as { elements?: unknown };
    const elements = sanitizeElements(parsed.elements);

    return NextResponse.json({
      ok: true,
      source: "vision",
      width: normalized.width,
      height: normalized.height,
      elements,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta creative analysis failed";
    console.error("[meta-creative-analysis]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
