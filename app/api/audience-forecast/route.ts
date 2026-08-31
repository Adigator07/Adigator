import { NextRequest, NextResponse } from "next/server";
import { buildAudienceAvailabilityForecast } from "@/app/lib/audienceForecast/engine";
import { fetchLocationWeatherSummary } from "@/app/lib/audienceForecast/weather";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const location = String(body?.location || "").trim();
    const startDate = String(body?.startDate || "").trim();
    const endDate = String(body?.endDate || "").trim();
    const vertical = String(body?.vertical || "").trim() || undefined;
    if (!location || !startDate || !endDate) {
      return NextResponse.json({ error: "Location, start date, and end date are required." }, { status: 400 });
    }

    const weatherSummary = await fetchLocationWeatherSummary(location, startDate, endDate);
    const eventHints = Array.isArray(body?.eventHints)
      ? body.eventHints.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : [];

    const forecast = buildAudienceAvailabilityForecast({
      location,
      startDate,
      endDate,
      vertical,
      weatherSummary,
      eventHints,
    });

    return NextResponse.json({ forecast });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forecast failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
