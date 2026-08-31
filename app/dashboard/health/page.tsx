"use client";

import dynamic from "next/dynamic";

function PageSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-4 p-1">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-sky-100" />
      <p className="text-sm text-slate-500">{title}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

const CampaignHealthDashboard = dynamic(
  () => import("@/app/components/campaign-health/CampaignHealthDashboard"),
  { loading: () => <PageSkeleton title="Opening Campaign Health…" />, ssr: false },
);

export default function CampaignHealthPage() {
  return <CampaignHealthDashboard />;
}
