"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

export interface EnvironmentProps {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

export type PlacementKey =
  | "header-banner"
  | "top-leaderboard"
  | "sidebar-sticky"
  | "inline-article"
  | "native-feed";

export const SLOT_DIMENSIONS: Record<PlacementKey, { width: number; height: number }> = {
  "header-banner": { width: 728, height: 90 },
  "top-leaderboard": { width: 970, height: 250 },
  "sidebar-sticky": { width: 160, height: 600 },
  "inline-article": { width: 300, height: 250 },
  "native-feed": { width: 1080, height: 1080 },
};

export const FALLBACK_CREATIVES = {
  banner728x90: [
    "/fallback-creatives/banner-728x90/promo-1.svg",
    "/fallback-creatives/banner-728x90/promo-2.svg",
  ],
  inline300x250: [
    "/fallback-creatives/inline-300x250/inline-1.svg",
    "/fallback-creatives/inline-300x250/inline-2.svg",
  ],
  sidebar160x600: [
    "/fallback-creatives/sidebar-160x600/side-1.svg",
    "/fallback-creatives/sidebar-160x600/side-2.svg",
  ],
  hero970x250: [
    "/fallback-creatives/hero-970x250/hero-1.svg",
    "/fallback-creatives/hero-970x250/hero-2.svg",
  ],
  mobile320x50: [
    "/fallback-creatives/mobile-320x50/mobile-1.svg",
    "/fallback-creatives/mobile-320x50/mobile-2.svg",
  ],
  native1080x1080: [
    "/fallback-creatives/native-1080x1080/native-1.svg",
    "/fallback-creatives/native-1080x1080/native-2.svg",
  ],
};

export function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickFallbackFromPool(pool: string[], seed: string): string {
  if (pool.length === 0) return "";
  return pool[hashSeed(seed) % pool.length];
}

export function pickPlacement(creativeSize: string, slotType: SlotType): PlacementKey {
  switch (creativeSize) {
    case "160x600":
    case "300x600":
      return "sidebar-sticky";
    case "300x250":
    case "336x280":
      return "inline-article";
    case "728x90":
    case "468x60":
    case "320x50":
    case "320x100":
      return "header-banner";
    case "970x250":
      return "top-leaderboard";
    case "1080x1080":
      return "native-feed";
    default:
      if (slotType === "sidebar") return "sidebar-sticky";
      if (slotType === "leaderboard") return "top-leaderboard";
      if (slotType === "banner") return "header-banner";
      if (slotType === "feed-card" || slotType === "native-recommendation") return "native-feed";
      return "inline-article";
  }
}

export function useFallbackMap(
  publisherName: string | undefined,
  brandName: string,
  device: "desktop" | "tablet" | "mobile"
): Record<PlacementKey, string> {
  return useMemo(() => {
    const seedBase = `${publisherName || brandName}-${device}`;
    return {
      "header-banner": pickFallbackFromPool(
        device === "mobile" ? FALLBACK_CREATIVES.mobile320x50 : FALLBACK_CREATIVES.banner728x90,
        `${seedBase}-header-banner`
      ),
      "top-leaderboard": pickFallbackFromPool(FALLBACK_CREATIVES.hero970x250, `${seedBase}-top-leaderboard`),
      "sidebar-sticky": pickFallbackFromPool(FALLBACK_CREATIVES.sidebar160x600, `${seedBase}-sidebar-sticky`),
      "inline-article": pickFallbackFromPool(FALLBACK_CREATIVES.inline300x250, `${seedBase}-inline-article`),
      "native-feed": pickFallbackFromPool(FALLBACK_CREATIVES.native1080x1080, `${seedBase}-native-feed`),
    };
  }, [publisherName, brandName, device]);
}

export function WebsiteAdSlot({
  slot,
  activePlacement,
  creativeUrl,
  creativeSize,
  fallbackSrc,
  className,
  fit = "contain",
}: {
  slot: PlacementKey;
  activePlacement: PlacementKey;
  creativeUrl: string;
  creativeSize: string;
  fallbackSrc: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const targetSize = SLOT_DIMENSIONS[slot];
  const isUsingUserCreative = slot === activePlacement && Boolean(creativeUrl);
  const renderSrc = isUsingUserCreative ? creativeUrl : fallbackSrc;

  return (
    <div className={className} style={{ width: "100%", maxWidth: `${targetSize.width}px` }}>
      <div
        className="flex items-center justify-center overflow-hidden bg-slate-100"
        style={{ width: "100%", aspectRatio: `${targetSize.width} / ${targetSize.height}` }}
      >
        <AnimatePresence mode="wait">
          {renderSrc ? (
            <motion.img
              key={`${renderSrc}-${slot}`}
              src={renderSrc}
              alt="Sponsored"
              className="max-h-full max-w-full"
              style={{ objectFit: isUsingUserCreative ? "contain" : "cover" }}
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.45 }}
              transition={{ duration: 0.22 }}
            />
          ) : (
            <motion.div
              key={`fallback-${slot}`}
              className="h-full w-full bg-slate-800/20"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.4 }}
              transition={{ duration: 0.22 }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Mobile view: creative ad unit only — no publisher website chrome. */
export function ProgrammaticMobileAdPreview({
  creativeUrl,
  creativeSize,
  slotType,
  publisherName,
  device = "mobile",
}: {
  creativeUrl: string;
  creativeSize: string;
  slotType: SlotType;
  publisherName?: string;
  device?: "desktop" | "tablet" | "mobile";
}) {
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(publisherName, "Publisher", device);

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="overflow-hidden rounded-[2rem] border-[10px] border-gray-900 bg-[#eceff1] shadow-xl">
        <div className="flex min-h-[280px] items-center justify-center p-5">
          <WebsiteAdSlot
            slot={activePlacement}
            activePlacement={activePlacement}
            creativeUrl={creativeUrl}
            creativeSize={creativeSize}
            fallbackSrc={fallback[activePlacement]}
            fit="contain"
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
