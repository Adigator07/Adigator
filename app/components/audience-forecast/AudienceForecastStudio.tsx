"use client";

import { useState } from "react";
import Link from "next/link";
import { CloudSun, MapPin, Sparkles } from "lucide-react";
import type { AudienceForecastResult } from "@/app/lib/audienceForecast/engine";

const VERTICALS = [
  { id: "", label: "General" },
  { id: "travel", label: "Travel" },
  { id: "hotels", label: "Hotels" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "fashion", label: "Fashion" },
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "finance", label: "Finance" },
  { id: "entertainment", label: "Entertainment" },
];

export default function AudienceForecastStudio() {
  const today = new Date().toISOString().slice(0, 10);
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [location, setLocation] = useState("London");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(week);
  const [vertical, setVertical] = useState("travel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState<AudienceForecastResult | null>(null);

  const runForecast = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/audience-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, startDate, endDate, vertical }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Forecast failed.");
      setForecast(payload.forecast);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Audience Availability Forecast</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-800">Plan media when people are actually available</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Choose a location and flight dates. Adigator combines holidays, weather, weekend patterns, and market size to estimate audience availability before you launch.
          </p>
        </div>
        <Link href="/dashboard/health" className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800">
          Campaign Health
        </Link>
      </div>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Location
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City or region"
              className="mt-1 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-800" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            End date
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-800" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vertical
            <select value={vertical} onChange={(event) => setVertical(event.target.value)} className="mt-1 w-full rounded-xl border border-sky-200 px-3 py-2 text-sm text-slate-800">
              {VERTICALS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => void runForecast()}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Sparkles size={16} />
          {loading ? "Forecasting…" : "Generate forecast"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {forecast ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience availability</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{forecast.audienceAvailability.index}/100</p>
              <p className="text-sm text-slate-500">{forecast.audienceAvailability.label}</p>
              <p className="mt-2 text-sm font-semibold text-sky-800">{forecast.audienceAvailability.estimatedPeople.toLocaleString()} estimated people</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impression opportunities</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{forecast.expectedImpressionOpportunities.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Expected reachable ad views in this flight</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Forecast confidence</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{forecast.confidenceScore}%</p>
              <p className="text-sm text-slate-500">Based on calendar, weather, and market signals</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800">When to run</h2>
              <p className="mt-2 text-sm text-slate-600"><strong>Days:</strong> {forecast.recommendedDays.join(", ")}</p>
              <p className="mt-1 text-sm text-slate-600"><strong>Times:</strong> {forecast.recommendedTimes.join(" · ")}</p>
              <ul className="mt-3 space-y-2">
                {forecast.recommendedChannels.map((channel) => (
                  <li key={channel.channel} className="text-sm text-slate-700">
                    <span className="font-semibold">{channel.channel}.</span> {channel.reason}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800">Availability risks</h2>
              <ul className="mt-3 space-y-3">
                {forecast.risks.map((risk) => (
                  <li key={risk.title}>
                    <p className="text-sm font-semibold text-slate-800">{risk.title}</p>
                    <p className="text-sm text-slate-600">{risk.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-800">Recommendations</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {forecast.recommendations.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  <ol className="mt-2 list-decimal pl-5 text-xs text-slate-500">
                    {item.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-600">
              <CloudSun size={16} />
              <h2 className="font-bold">Signals used</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.signals.map((signal) => (
                <span key={signal} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                  <MapPin size={12} /> {signal}
                </span>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
