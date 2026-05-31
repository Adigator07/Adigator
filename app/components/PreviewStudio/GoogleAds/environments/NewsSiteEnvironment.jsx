"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import { pickBestAdSlot } from "../../previewUtils";
import {
  DeviceChrome,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  ScaledDeviceEnvironment,
} from "../../shared/envShared";

const NEWS_SLOTS = [
  { id: "leaderboard", width: 728, height: 90, size: "728x90" },
  { id: "inline", width: 300, height: 250, size: "300x250" },
  { id: "sidebar", width: 300, height: 250, size: "300x250" },
  { id: "halfpage", width: 300, height: 600, size: "300x600" },
  { id: "footer", width: 728, height: 90, size: "728x90" },
];

const MOBILE_NEWS_SLOTS = [
  { id: "mobile-banner", width: 320, height: 50, size: "320x50" },
  { id: "mobile-inline", width: 300, height: 250, size: "300x250" },
];

function GoogleDisplaySlot({ creative, slot, showAd, placeholderIndex }) {
  return (
    <DisplayAdSlot
      creative={creative}
      width={slot.width}
      height={slot.height}
      showLabel={false}
      showAd={showAd}
      fitMode="contain"
      showFitNotice={showAd}
      placeholderIndex={placeholderIndex}
    />
  );
}

function MobileNewsLayout({ creative, primarySlot }) {
  return (
    <DeviceChrome isMobile width={390} height={780}>
      <div className="flex h-full flex-col bg-white" style={{ fontFamily: GOOGLE.font, color: "#222" }}>
      <div className="flex justify-between px-5 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
      <header className="border-b px-4 py-3">
        <p className="text-lg font-serif font-bold">The Daily Tribune</p>
        <div className="mt-2 flex gap-3 overflow-x-auto text-[11px] text-gray-600">
          {["Home", "Tech", "Business", "Sports"].map((l) => <span key={l} className="shrink-0">{l}</span>)}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <GoogleDisplaySlot
          creative={creative}
          slot={MOBILE_NEWS_SLOTS[0]}
          showAd={primarySlot.id === "mobile-banner"}
          placeholderIndex={0}
        />
        <h1 className="text-xl font-serif font-bold leading-tight">
          How {creative.vertical || "Technology"} Brands Are Winning Attention in 2026
        </h1>
        <p className="text-xs text-gray-500">By Staff Writer · 6 min read</p>
        <p className="text-sm leading-6 text-gray-700">
          Marketers are shifting budgets toward high-intent mobile placements as attention fragments across feeds and apps.
        </p>
        <GoogleDisplaySlot
          creative={creative}
          slot={MOBILE_NEWS_SLOTS[1]}
          showAd={primarySlot.id === "mobile-inline"}
          placeholderIndex={1}
        />
        <p className="text-sm leading-6 text-gray-700">
          Fast-loading assets and clear brand recall remain the strongest predictors of mobile display performance.
        </p>
      </div>
    </div>
    </DeviceChrome>
  );
}

function DesktopNewsLayout({ creative, primarySlot }) {
  return (
    <DeviceChrome isMobile={false} width={1100} height={880}>
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
          <GoogleDisplaySlot
            creative={creative}
            slot={NEWS_SLOTS[0]}
            showAd={primarySlot.id === "leaderboard"}
            placeholderIndex={0}
          />
          <h1 className="text-3xl font-serif font-bold leading-tight mt-2">
            How {creative.vertical || "Technology"} Brands Are Winning Attention in 2026
          </h1>
          <p className="text-sm text-gray-500 mt-2">By Staff Writer · March 26, 2026 · 6 min read</p>
          <p className="mt-4 text-[15px] leading-7 text-gray-700">
            Marketers are shifting budgets toward high-intent placements as consumer attention fragments across mobile feeds, premium publishers, and video environments.
          </p>
          <div className="my-4">
            <GoogleDisplaySlot
              creative={creative}
              slot={NEWS_SLOTS[1]}
              showAd={primarySlot.id === "inline"}
              placeholderIndex={1}
            />
          </div>
          <p className="text-[15px] leading-7 text-gray-700">
            Industry analysts note that creative clarity, brand recall, and fast-loading assets remain the strongest predictors of display performance across news and lifestyle publishers.
          </p>
          <GoogleDisplaySlot
            creative={creative}
            slot={NEWS_SLOTS[4]}
            showAd={primarySlot.id === "footer"}
            placeholderIndex={4}
          />
        </main>
        <aside className="flex-[0_0_32%] min-w-0">
          <p className="text-sm font-bold mb-2">Trending</p>
          {["Market shifts reshape ad spend", "New privacy rules explained", "Creative testing playbook", "Publisher CPM trends"].map((t) => (
            <p key={t} className="text-xs text-[#1a0dab] mb-2 leading-snug">{t}</p>
          ))}
          <div className="mt-3">
            <GoogleDisplaySlot
              creative={creative}
              slot={NEWS_SLOTS[2]}
              showAd={primarySlot.id === "sidebar"}
              placeholderIndex={2}
            />
          </div>
          <div className="mt-3">
            <GoogleDisplaySlot
              creative={creative}
              slot={NEWS_SLOTS[3]}
              showAd={primarySlot.id === "halfpage"}
              placeholderIndex={3}
            />
          </div>
        </aside>
      </div>
    </div>
    </DeviceChrome>
  );
}

export default function NewsSiteEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const isMobile = deviceMode !== "desktop";
  const primarySlot = isMobile
    ? pickBestAdSlot(creative.sourceCreativeSize || creative.size, MOBILE_NEWS_SLOTS) || MOBILE_NEWS_SLOTS[1]
    : pickBestAdSlot(creative.sourceCreativeSize || creative.size, NEWS_SLOTS) || NEWS_SLOTS[1];

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="News / Display Network"
      badgeClassName="bg-slate-500/20 text-slate-100 border-slate-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
      hideSizeLabel
    >
      <ScaledDeviceEnvironment
        deviceMode={deviceMode}
        mobile={{ width: 390, height: 780 }}
        desktop={{ width: 1100, height: 880 }}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        {({ isMobile: mobileView }) => (
          mobileView
            ? <MobileNewsLayout creative={creative} primarySlot={primarySlot} />
            : <DesktopNewsLayout creative={creative} primarySlot={primarySlot} />
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
