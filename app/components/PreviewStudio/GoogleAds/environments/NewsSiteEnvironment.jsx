"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import { pickBestAdSlot } from "../../previewUtils";
import {
  AdChoicesMark,
  AdImage,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  GoogleLogo,
  ScaledEnvironment,
} from "../../shared/envShared";

const NEWS_SLOTS = [
  { id: "leaderboard", label: "Leaderboard · 728×90", width: 728, height: 90, size: "728x90" },
  { id: "inline", label: "In-Content · 300×250", width: 300, height: 250, size: "300x250" },
  { id: "sidebar", label: "Sidebar · 300×250", width: 300, height: 250, size: "300x250" },
  { id: "halfpage", label: "Half Page · 300×600", width: 300, height: 600, size: "300x600" },
  { id: "footer", label: "Footer · 728×90", width: 728, height: 90, size: "728x90" },
];

export default function NewsSiteEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const primarySlot = pickBestAdSlot(creative.size, NEWS_SLOTS) || NEWS_SLOTS[1];

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="News / Display Network"
      badgeClassName="bg-slate-500/20 text-slate-100 border-slate-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={1100} naturalHeight={880} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ width: 1100, background: "#fff", fontFamily: GOOGLE.font, color: "#222" }}>
          <header className="border-b px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-serif font-bold">The Daily Tribune</p>
              <nav className="flex gap-4 text-xs text-gray-600 mt-1">
                {["Home", "Politics", "Business", "Tech", "Sports"].map((l) => <span key={l}>{l}</span>)}
              </nav>
            </div>
            <button type="button" className="rounded bg-black text-white px-4 py-1.5 text-xs">Subscribe</button>
          </header>
          <p className="px-6 py-2 text-xs text-gray-500">Home &gt; Technology &gt; Article</p>
          <div className="flex px-6 gap-6 pb-6">
            <main className="flex-[0_0_68%] min-w-0">
              <DisplayAdSlot
                creative={creative}
                width={728}
                height={90}
                label="Leaderboard · 728×90"
                showAd={primarySlot.id === "leaderboard"}
              />
              <h1 className="text-3xl font-serif font-bold leading-tight mt-2">
                How {creative.vertical || "Technology"} Brands Are Winning Attention in 2026
              </h1>
              <p className="text-sm text-gray-500 mt-2">By Staff Writer · March 26, 2026 · 6 min read</p>
              <p className="mt-4 text-[15px] leading-7 text-gray-700">
                Marketers are shifting budgets toward high-intent placements as consumer attention fragments across mobile feeds, premium publishers, and video environments.
              </p>
              <DisplayAdSlot
                creative={creative}
                width={300}
                height={250}
                label="In-Content · 300×250"
                showAd={primarySlot.id === "inline"}
                className="my-4"
              />
              {primarySlot.id === "inline" ? (
                <div className="my-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Your creative is shown in the in-content slot above — scaled to fit the placement.
                </div>
              ) : null}
              <p className="text-[15px] leading-7 text-gray-700">
                Industry analysts note that creative clarity, brand recall, and fast-loading assets remain the strongest predictors of display performance across news and lifestyle publishers.
              </p>
              <DisplayAdSlot
                creative={creative}
                width={728}
                height={90}
                label="Footer · 728×90"
                showAd={primarySlot.id === "footer"}
              />
            </main>
            <aside className="flex-[0_0_32%] min-w-0">
              <p className="text-sm font-bold mb-2">Trending</p>
              {["Market shifts reshape ad spend", "New privacy rules explained", "Creative testing playbook", "Publisher CPM trends"].map((t) => (
                <p key={t} className="text-xs text-[#1a0dab] mb-2 leading-snug">{t}</p>
              ))}
              <DisplayAdSlot
                creative={creative}
                width={300}
                height={250}
                label="Sidebar · 300×250"
                showAd={primarySlot.id === "sidebar"}
                className="mt-3"
              />
              <DisplayAdSlot
                creative={creative}
                width={300}
                height={600}
                label="Half Page · 300×600"
                showAd={primarySlot.id === "halfpage"}
                className="mt-3"
              />
            </aside>
          </div>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}

export function DisplayAdUnit({ creative, width, height }) {
  return (
    <div className="relative border border-[#dadce0] bg-white overflow-hidden" style={{ width, height }}>
      <AdImage creative={creative} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-2 right-2 text-white">
        <p className="text-xs font-semibold line-clamp-2">{creative.headline}</p>
        <span className="mt-1 inline-block rounded bg-[#1a73e8] px-2 py-0.5 text-[10px]">{creative.cta || "Learn More"}</span>
      </div>
      <AdChoicesMark className="absolute top-1 right-1 bg-white/90 px-1 rounded" />
    </div>
  );
}
