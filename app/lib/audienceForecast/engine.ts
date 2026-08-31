export type AudienceForecastInput = {
  location: string;
  startDate: string;
  endDate: string;
  vertical?: string;
  weatherSummary?: string;
  eventHints?: string[];
};

export type AudienceForecastResult = {
  location: string;
  startDate: string;
  endDate: string;
  audienceAvailability: {
    index: number;
    estimatedPeople: number;
    label: string;
  };
  expectedImpressionOpportunities: number;
  confidenceScore: number;
  recommendedDays: string[];
  recommendedTimes: string[];
  recommendedChannels: Array<{ channel: string; reason: string }>;
  risks: Array<{ title: string; detail: string; severity: "high" | "medium" | "low" }>;
  recommendations: Array<{ title: string; detail: string; steps: string[] }>;
  signals: string[];
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Recurring public-holiday month-day keys used for planning heuristics. */
const HOLIDAYS: Record<string, string[]> = {
  "01-01": ["New Year's Day"],
  "01-26": ["Republic Day (India)"],
  "02-14": ["Valentine's Day"],
  "03-17": ["St. Patrick's Day"],
  "05-01": ["Labour Day"],
  "07-04": ["Independence Day (US)"],
  "08-15": ["Independence Day (India)"],
  "10-31": ["Halloween"],
  "11-11": ["Veterans Day / Armistice"],
  "12-25": ["Christmas"],
  "12-26": ["Boxing Day"],
  "12-31": ["New Year's Eve"],
};

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function eachDate(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end && days.length < 62) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function monthDay(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function locationMultiplier(location: string): number {
  const text = location.toLowerCase();
  if (/new york|london|mumbai|delhi|los angeles|tokyo|paris|dubai|singapore/.test(text)) return 1.35;
  if (/city|metro|capital/.test(text)) return 1.15;
  if (/beach|resort|goa|bali|miami/.test(text)) return 1.2;
  return 1;
}

function verticalMultiplier(vertical?: string): number {
  switch (vertical) {
    case "travel":
    case "hotels":
      return 1.12;
    case "retail":
    case "ecommerce":
    case "fashion":
      return 1.08;
    case "sports":
      return 1.1;
    default:
      return 1;
  }
}

export function buildAudienceAvailabilityForecast(input: AudienceForecastInput): AudienceForecastResult {
  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);
  if (!start || !end || end < start) {
    throw new Error("Enter a valid location and campaign date range.");
  }

  const days = eachDate(start, end);
  const locationBoost = locationMultiplier(input.location);
  const verticalBoost = verticalMultiplier(input.vertical);
  const holidayNames: string[] = [];
  let weekendDays = 0;
  let weekdayDays = 0;
  let availabilitySum = 0;

  for (const day of days) {
    const weekday = day.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    if (isWeekend) weekendDays += 1;
    else weekdayDays += 1;
    const holidays = HOLIDAYS[monthDay(day)] || [];
    holidayNames.push(...holidays);
    let dayIndex = isWeekend ? 72 : 88;
    if (holidays.length) dayIndex += /christmas|new year|independence/i.test(holidays.join(" ")) ? -8 : 6;
    if (/rain|storm|snow/i.test(input.weatherSummary || "")) dayIndex -= 10;
    if (/clear|sunny|mild/i.test(input.weatherSummary || "")) dayIndex += 4;
    availabilitySum += Math.max(35, Math.min(100, dayIndex));
  }

  const avgIndex = Math.round(availabilitySum / Math.max(1, days.length));
  const eventBoost = Math.min(12, (input.eventHints || []).length * 3);
  const index = Math.max(28, Math.min(98, Math.round(avgIndex + eventBoost)));
  const estimatedPeople = Math.round(180_000 * locationBoost * verticalBoost * (index / 100) * Math.min(days.length, 14) / 7);
  const expectedImpressionOpportunities = Math.round(estimatedPeople * 2.4 * (index / 100));
  const confidence = Math.max(
    42,
    Math.min(92, 58 + (input.weatherSummary ? 8 : 0) + (holidayNames.length ? 6 : 0) + (input.eventHints?.length ? 10 : 0) - Math.max(0, days.length - 21)),
  );

  const recommendedDays = weekendDays >= weekdayDays
    ? ["Friday", "Saturday", "Sunday"]
    : ["Tuesday", "Wednesday", "Thursday"];
  if (holidayNames.length) recommendedDays.unshift("Holiday eves");

  const recommendedTimes = /travel|hotels|food/.test(input.vertical || "")
    ? ["07:00–09:00", "12:00–14:00", "19:00–22:00"]
    : ["08:00–11:00", "12:00–14:00", "18:00–21:00"];

  const recommendedChannels = [
    { channel: "Google Search", reason: "Captures high-intent queries when people are actively planning." },
    { channel: "Demand Gen / YouTube", reason: "Reaches available audiences during evening and weekend video sessions." },
    { channel: "Display / Open web", reason: "Extends reach across news and weather inventory on high-availability days." },
  ];

  const risks: AudienceForecastResult["risks"] = [];
  if (holidayNames.length) {
    risks.push({
      title: "Holiday disruption",
      severity: "medium",
      detail: `The flight includes ${Array.from(new Set(holidayNames)).slice(0, 3).join(", ")}, which can reduce weekday commute audiences and raise CPMs.`,
    });
  }
  if (/rain|storm|snow/i.test(input.weatherSummary || "")) {
    risks.push({
      title: "Severe weather",
      severity: "high",
      detail: "Weather signals suggest lower outdoor mobility. Shift budget to in-home channels (video, apps, news).",
    });
  }
  if (days.length > 28) {
    risks.push({
      title: "Long flight dilutes timing",
      severity: "low",
      detail: "Availability will change across a long date range. Split into weekly flights for tighter scheduling.",
    });
  }
  if (!risks.length) {
    risks.push({
      title: "Auction congestion",
      severity: "low",
      detail: "Peak recommended hours can be competitive. Use frequency caps and dayparting instead of even delivery.",
    });
  }

  const signals = [
    `${days.length} day flight in ${input.location}`,
    `${weekendDays} weekend day(s), ${weekdayDays} weekday(s)`,
    holidayNames.length ? `Holidays: ${Array.from(new Set(holidayNames)).join(", ")}` : "No major listed holidays in range",
    input.weatherSummary ? `Weather: ${input.weatherSummary}` : "Weather not yet attached",
    ...(input.eventHints || []).slice(0, 4),
  ];

  const recommendations: AudienceForecastResult["recommendations"] = [
    {
      title: "Concentrate budget on high-availability dayparts",
      detail: `Audience availability is ${index}/100. Prioritize ${recommendedDays.join(", ")} at ${recommendedTimes[0]} and ${recommendedTimes[2]}.`,
      steps: [
        "Set ad scheduling in Google Ads to the recommended days and times.",
        "Raise bids 10–20% only on those dayparts.",
        "Keep a small always-on budget for learning.",
      ],
    },
    {
      title: "Match channel mix to when people are available",
      detail: "Search captures intent; video and display capture available attention when mobility or weather changes.",
      steps: recommendedChannels.map((channel) => `Allocate budget to ${channel.channel}: ${channel.reason}`),
    },
  ];

  if (holidayNames.length) {
    recommendations.push({
      title: "Plan creative for holiday context",
      detail: "Holiday periods change both volume and intent. Use timely offers rather than generic always-on copy.",
      steps: [
        "Launch holiday-specific headlines 2–3 days before the event.",
        "Pause low-intent prospecting if CPMs spike without conversion lift.",
      ],
    });
  }

  return {
    location: input.location.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    audienceAvailability: {
      index,
      estimatedPeople,
      label: index >= 80 ? "High availability" : index >= 60 ? "Moderate availability" : "Constrained availability",
    },
    expectedImpressionOpportunities,
    confidenceScore: confidence,
    recommendedDays: Array.from(new Set(recommendedDays)),
    recommendedTimes,
    recommendedChannels,
    risks,
    recommendations,
    signals,
  };
}
