"use client";

import dynamic from "next/dynamic";

function PageSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <div className="h-8 w-72 animate-pulse rounded-lg bg-sky-100" />
      <p className="text-sm text-slate-500">Opening Audience Forecast…</p>
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

const AudienceForecastStudio = dynamic(
  () => import("@/app/components/audience-forecast/AudienceForecastStudio"),
  { loading: () => <PageSkeleton />, ssr: false },
);

export default function AudienceForecastPage() {
  return <AudienceForecastStudio />;
}
