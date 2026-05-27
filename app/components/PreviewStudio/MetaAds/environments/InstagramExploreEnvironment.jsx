"use client";

import { useState } from "react";
import { INSTAGRAM } from "@/app/lib/platformDesignTokens";
import {
  BrandAvatar,
  EnvironmentPreviewCard,
  InstagramLogo,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

function ExploreGrid({ creative, onExpand }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const isAd = i === 3;
        return (
          <button
            key={i}
            type="button"
            onClick={isAd ? onExpand : undefined}
            className={`relative aspect-square overflow-hidden ${isAd ? "ring-2 ring-[#0095f6]" : ""}`}
            aria-label={isAd ? "Open sponsored post preview" : undefined}
          >
            {isAd ? (
              <>
                <MediaFrame creative={creative} aspectRatio="1 / 1" />
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">Sponsored</span>
              </>
            ) : (
              <div className="h-full w-full bg-gray-200" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ExplorePostDetail({ creative, onBack }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: INSTAGRAM.border }}>
        <button type="button" onClick={onBack} className="text-sm font-semibold text-[#0095f6]">← Explore</button>
        <span className="text-sm font-semibold">Post</span>
        <span className="w-12" />
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <BrandAvatar creative={creative} size={32} />
          <div>
            <p className="text-sm font-semibold" style={{ color: INSTAGRAM.text }}>{creative.pageName || creative.headline}</p>
            <p className="text-[10px]" style={{ color: INSTAGRAM.secondary }}>Sponsored</p>
          </div>
        </div>
        <span>···</span>
      </div>
      <MediaFrame creative={creative} aspectRatio="1 / 1" />
      <div className="px-3 py-2">
        <p className="text-xl">♡ 💬 ↗</p>
        <p className="mt-2 text-sm font-semibold">Liked by username and 2,847 others</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{creative.pageName || "brand"} </span>
          {creative.primaryText || creative.description}
        </p>
        <button type="button" className="mt-3 w-full rounded-lg bg-[#0095f6] py-2 text-sm font-semibold text-white">
          {creative.cta || "Shop Now"}
        </button>
      </div>
    </div>
  );
}

export default function InstagramExploreEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Instagram Explore"
      badgeClassName="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment
        naturalWidth={390}
        naturalHeight={700}
        interactive
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        <PhoneFrame width={390} height={700} className="border-8" style={{ fontFamily: INSTAGRAM.font }}>
          {!expanded ? (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: INSTAGRAM.border }}>
                <InstagramLogo />
                <span>🔍</span>
              </div>
              <ExploreGrid creative={creative} onExpand={() => setExpanded(true)} />
              <p className="px-3 py-2 text-center text-[10px] text-gray-400">Tap the sponsored tile to preview the full post</p>
            </>
          ) : (
            <ExplorePostDetail creative={creative} onBack={() => setExpanded(false)} />
          )}
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
