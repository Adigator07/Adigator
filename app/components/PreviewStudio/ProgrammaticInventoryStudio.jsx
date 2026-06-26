"use client";

import { useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import PreviewFrame from "./shared/PreviewFrame";
import { SponsoredBadge, UserImage } from "./shared/previewUi";
import {
  INVENTORY_LABELS,
  resolveProgrammaticSlot,
} from "./shared/programmaticInventorySlots";
import { newsArticle } from "./dummy/programmaticDummy";

function AdSlot({ width, height, imageUrl, headline, label }) {
  return (
    <div
      className="relative border border-dashed border-purple-400/50 bg-purple-50/80 overflow-hidden rounded"
      style={{ width, height, maxWidth: "100%" }}
    >
      <div className="absolute top-0 left-0 z-10">
        <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-600 text-white px-1.5 py-0.5 rounded-br">
          {label}
        </span>
      </div>
      {imageUrl ? (
        <UserImage imageUrl={imageUrl} className="w-full h-full" fit="cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-purple-400 font-medium">
          {width}×{height}
        </div>
      )}
    </div>
  );
}

function NewsPublisherLayout({ slot, imageUrl, headline, device }) {
  const article = newsArticle;
  const isMobile = device === "mobile";

  return (
    <PreviewFrame width={isMobile ? 390 : 1024}>
      <div className="bg-white text-gray-900 font-serif min-h-[480px]">
        {!isMobile && (
          <div className="bg-red-700 text-white text-xs px-6 py-1.5">{article.ticker}</div>
        )}
        <header className={`border-b-2 border-black ${isMobile ? "px-4 py-3" : "px-8 py-4"}`}>
          <h1 className={`font-black tracking-tight ${isMobile ? "text-xl" : "text-3xl"}`}>{article.siteName}</h1>
        </header>

        {slot.slot === "header_leaderboard" || slot.slot === "top_leaderboard" ? (
          <div className={`${isMobile ? "px-3 py-2" : "px-8 py-3"} flex justify-center bg-slate-50`}>
            <AdSlot width={slot.width} height={slot.height} imageUrl={imageUrl} headline={headline} label="Leaderboard" />
          </div>
        ) : null}

        <div className={`flex ${isMobile ? "flex-col px-4 py-4 gap-4" : "px-8 py-6 gap-8"}`}>
          <article className="flex-1 min-w-0">
            <h2 className={`font-bold mb-2 leading-tight ${isMobile ? "text-xl" : "text-2xl"}`}>{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-3">{article.author}</p>
            <p className="text-sm leading-relaxed mb-4">{article.paragraphs[0]}</p>

            {(slot.slot === "inline_article" || slot.slot === "in_content_mrec" || slot.slot === "hero_billboard") && (
              <div className="my-4 flex justify-center">
                <AdSlot
                  width={slot.width}
                  height={slot.height}
                  imageUrl={imageUrl}
                  headline={headline}
                  label={slot.slot === "hero_billboard" ? "Billboard" : "In-Article"}
                />
              </div>
            )}

            <p className="text-sm leading-relaxed">{article.paragraphs[1]}</p>
          </article>

          {!isMobile && (slot.slot === "sidebar_mrec" || slot.slot === "sidebar_halfpage") ? (
            <aside className="shrink-0">
              <SponsoredBadge />
              <AdSlot
                width={slot.width}
                height={slot.height}
                imageUrl={imageUrl}
                headline={headline}
                label={slot.slot === "sidebar_halfpage" ? "Half Page" : "MREC"}
              />
            </aside>
          ) : null}
        </div>

        {isMobile && (slot.slot === "mobile_banner" || slot.slot === "mobile_strip" || slot.slot === "mobile_footer") ? (
          <div className="sticky bottom-0 border-t bg-white px-3 py-2 flex justify-center">
            <AdSlot width={slot.width} height={slot.height} imageUrl={imageUrl} headline={headline} label="Mobile Banner" />
          </div>
        ) : null}
      </div>
    </PreviewFrame>
  );
}

function GenericInventoryLayout({ slot, imageUrl, headline, inventory, device }) {
  const isMobile = device === "mobile";
  const inventoryLabel = INVENTORY_LABELS[inventory] || "Publisher Site";

  return (
    <PreviewFrame width={isMobile ? 390 : 1024}>
      <div className="bg-slate-50 min-h-[400px]">
        <div className="bg-slate-800 text-white px-4 py-2 text-xs font-semibold">{inventoryLabel}</div>
        <div className={`${isMobile ? "p-4" : "p-8"} space-y-4`}>
          <div className="h-4 w-2/3 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-5/6 bg-slate-100 rounded" />
          <div className="flex justify-center py-4">
            <AdSlot width={slot.width} height={slot.height} imageUrl={imageUrl} headline={headline} label={slot.label} />
          </div>
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-4/5 bg-slate-100 rounded" />
        </div>
      </div>
    </PreviewFrame>
  );
}

function InventoryPreview({ slot, imageUrl, headline, device }) {
  if (slot.inventory === "news_articles" || slot.inventory === "blogs") {
    return <NewsPublisherLayout slot={slot} imageUrl={imageUrl} headline={headline} device={device} />;
  }
  return (
    <GenericInventoryLayout
      slot={slot}
      imageUrl={imageUrl}
      headline={headline}
      inventory={slot.inventory}
      device={device}
    />
  );
}

export default function ProgrammaticInventoryStudio({ sourceCreatives = [], brandName }) {
  const [device, setDevice] = useState("desktop");

  const creativeSlots = useMemo(() => {
    return sourceCreatives.map((creative) => {
      const size = creative.size || "300x250";
      const slot = resolveProgrammaticSlot(size, device);
      return {
        creative,
        slot,
        imageUrl: creative.url || creative.fullUrl,
        headline: creative.name || brandName || "Your Ad",
      };
    });
  }, [sourceCreatives, device, brandName]);

  if (!sourceCreatives.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-500 text-sm">
        Upload creatives in Step 2 to preview them across programmatic inventory slots.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Programmatic Inventory Preview</h3>
          <p className="text-sm text-gray-500 mt-1">
            Each creative size is shown in a matching publisher placement, not forced into a single template.
          </p>
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${
              device === "desktop" ? "bg-sky-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Monitor size={16} /> Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${
              device === "mobile" ? "bg-sky-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Smartphone size={16} /> Mobile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {creativeSlots.map(({ creative, slot, imageUrl, headline }) => (
          <div key={creative.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <p className="font-bold text-gray-900">{creative.name || "Creative"}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {slot.label} → {INVENTORY_LABELS[slot.inventory] || slot.inventory} · {device === "mobile" ? "Mobile" : "Desktop"} view
                </p>
              </div>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{creative.size}</span>
            </div>
            <div className="overflow-auto max-h-[70vh] rounded-xl border border-gray-100 bg-gray-50 p-3">
              <InventoryPreview slot={slot} imageUrl={imageUrl} headline={headline} device={device} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
