import { NextResponse } from "next/server";
import {
  mapVideoAnalysisToStrategicPayload,
  runVideoCreativeAnalysis,
} from "@/app/lib/engines/videoAnalysis";

export const runtime = "nodejs";
export const maxDuration = 120;

function parseNumber(value: FormDataEntryValue | null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const goal = String(formData.get("goal") || "video_views");
    const platform = String(formData.get("platform") || "meta_ads");
    const vertical = String(formData.get("vertical") || "unknown");
    const campaignBrief = String(formData.get("campaign_brief") || "");
    const campaignProductFocus = String(formData.get("campaign_product_focus") || "");
    const landingUrl = String(formData.get("landing_url") || "");
    const creativeName = String(formData.get("creative_name") || "Video creative");

    const metadata = {
      mimeType: String(formData.get("mime_type") || "video/mp4"),
      fileSizeBytes: parseNumber(formData.get("file_size_bytes")),
      width: parseNumber(formData.get("width")),
      height: parseNumber(formData.get("height")),
      durationSeconds: parseNumber(formData.get("duration_seconds")),
      fileName: String(formData.get("file_name") || creativeName),
    };

    const frameEntries = formData
      .getAll("frames")
      .filter((entry): entry is File => entry instanceof File);

    if (!frameEntries.length) {
      return NextResponse.json({ error: "At least one extracted video frame is required." }, { status: 400 });
    }

    const frames = await Promise.all(
      frameEntries.map(async (file, index) => {
        const timeLabel = String(formData.get(`frame_time_${index}`) || `00:0${index}`);
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          timeLabel,
          buffer,
          mimeType: file.type || "image/jpeg",
        };
      }),
    );

    const videoAnalysis = await runVideoCreativeAnalysis({
      frames,
      metadata,
      goal,
      platform,
      vertical,
      campaignBrief,
      campaignProductFocus,
      landingUrl,
    });

    const strategicPayload = mapVideoAnalysisToStrategicPayload(videoAnalysis, creativeName, {
      goal,
      vertical,
      campaignBrief,
    });

    return NextResponse.json({
      success: true,
      data: strategicPayload,
      video_analysis: videoAnalysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
