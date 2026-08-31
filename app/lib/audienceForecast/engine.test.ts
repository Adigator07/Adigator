import { describe, expect, it } from "vitest";

import { buildAudienceAvailabilityForecast } from "@/app/lib/audienceForecast/engine";

describe("buildAudienceAvailabilityForecast", () => {
  it("returns volume, impression opportunity, confidence, and recommendations", () => {
    const forecast = buildAudienceAvailabilityForecast({
      location: "London",
      startDate: "2026-08-21",
      endDate: "2026-08-28",
      vertical: "travel",
      weatherSummary: "Mostly clear near London",
      eventHints: ["Premier League weekend"],
    });

    expect(forecast.audienceAvailability.estimatedPeople).toBeGreaterThan(0);
    expect(forecast.expectedImpressionOpportunities).toBeGreaterThan(0);
    expect(forecast.confidenceScore).toBeGreaterThan(40);
    expect(forecast.recommendedDays.length).toBeGreaterThan(0);
    expect(forecast.recommendedChannels.length).toBeGreaterThan(0);
    expect(forecast.recommendations[0].steps.length).toBeGreaterThan(0);
  });

  it("adds holiday and weather risks", () => {
    const forecast = buildAudienceAvailabilityForecast({
      location: "New York",
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      weatherSummary: "Snow likely near New York",
    });
    expect(forecast.risks.some((risk) => /holiday/i.test(risk.title))).toBe(true);
    expect(forecast.risks.some((risk) => /weather/i.test(risk.title))).toBe(true);
  });
});
