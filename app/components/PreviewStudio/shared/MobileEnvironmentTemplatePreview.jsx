"use client";

import { useState } from "react";
import { GOOGLE, FACEBOOK, INSTAGRAM } from "@/app/lib/platformDesignTokens";
import { getCreativeAspectRatio, parseSize, pickBestAdSlot } from "@/app/components/PreviewStudio/previewUtils";
import { FeedPost } from "@/app/components/PreviewStudio/MetaAds/environments/FacebookFeedEnvironment";
import {
  AdImage,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "@/app/components/PreviewStudio/shared/envShared";
import { getCreativeSourceSize } from "@/app/lib/creativeFitAnalysis";

const MOBILE_NEWS_SLOTS = [
  { id: "mobile-banner", width: 320, height: 50, size: "320x50" },
  { id: "mobile-inline", width: 300, height: 250, size: "300x250" },
];

const YOUTUBE_SIDEBAR_SLOTS = [
  { id: "medium", width: 300, height: 250, size: "300x250" },
  { id: "large", width: 300, height: 600, size: "300x600" },
];

const ENVIRONMENT_BADGES = {
  google_search: { label: "Google Search", className: "bg-blue-500/20 text-blue-100 border-blue-400/30" },
  youtube: { label: "YouTube", className: "bg-red-500/20 text-red-100 border-red-400/30" },
  news_site: { label: "News / Display Network", className: "bg-slate-500/20 text-slate-100 border-slate-400/30" },
  mobile_app: { label: "Mobile App / AdMob", className: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30" },
  google_shopping: { label: "Google Shopping", className: "bg-green-500/20 text-green-100 border-green-400/30" },
  google_discover: { label: "Google Discover", className: "bg-orange-500/20 text-orange-100 border-orange-400/30" },
  gmail: { label: "Gmail Promotions", className: "bg-amber-500/20 text-amber-100 border-amber-400/30" },
  google_maps: { label: "Google Maps", className: "bg-teal-500/20 text-teal-100 border-teal-400/30" },
  facebook_feed: { label: "Facebook Feed", className: "bg-[#1877F2]/20 text-blue-100 border-blue-400/30" },
  facebook_feed_desktop: { label: "Facebook Feed", className: "bg-[#1877F2]/20 text-blue-100 border-blue-400/30" },
  instagram_feed: { label: "Instagram Feed", className: "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30" },
  instagram_story: { label: "Instagram Stories", className: "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30" },
  facebook_story: { label: "Facebook Stories", className: "bg-[#1877F2]/20 text-blue-100 border-blue-400/30" },
  instagram_reels: { label: "Instagram Reels", className: "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30" },
  messenger: { label: "Messenger", className: "bg-[#1877F2]/20 text-blue-100 border-blue-400/30" },
  audience_network: { label: "Audience Network", className: "bg-violet-500/20 text-violet-100 border-violet-400/30" },
  facebook_marketplace: { label: "Facebook Marketplace", className: "bg-[#1877F2]/20 text-blue-100 border-blue-400/30" },
  instagram_explore: { label: "Instagram Explore", className: "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30" },
};

function MobileTemplateFrame({ children }) {
  return (
    <PhoneFrame width={390} height={780} className="mx-auto border-[10px]">
      <div className="flex min-h-full items-start justify-center overflow-y-auto bg-[#eceff1] p-4">
        <div className="w-full max-w-[360px]">{children}</div>
      </div>
    </PhoneFrame>
  );
}

function SearchAdTemplate({ creative }) {
  const headlines = [creative.headline, creative.headline2, creative.headline3].filter(Boolean).join(" · ");
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm" style={{ fontFamily: GOOGLE.font, color: GOOGLE.body }}>
      <span className="text-[11px] font-semibold" style={{ color: GOOGLE.sponsored }}>Sponsored</span>
      <p className="mt-1 text-sm" style={{ color: GOOGLE.urlGreen }}>{creative.displayUrl || "www.example.com › products"}</p>
      <h3 className="mt-1 text-lg font-medium" style={{ color: GOOGLE.link }}>{headlines}</h3>
      <p className="mt-1 text-sm">{creative.description}</p>
      {creative.description2 ? <p className="text-sm">{creative.description2}</p> : null}
      <button type="button" className="mt-3 rounded bg-[#1a73e8] px-4 py-2 text-xs font-semibold text-white">
        {creative.cta || "Shop Now"}
      </button>
    </div>
  );
}

function InstagramFeedCard({ creative }) {
  const aspectRatio = getCreativeAspectRatio(creative);
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: INSTAGRAM.border, fontFamily: INSTAGRAM.font }}>
      <div className="flex items-center justify-between px-3 py-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: INSTAGRAM.text }}>{creative.pageName || creative.headline}</p>
          <p className="text-[10px]" style={{ color: INSTAGRAM.secondary }}>Sponsored</p>
        </div>
        <span className="text-gray-400">···</span>
      </div>
      <MediaFrame creative={creative} aspectRatio={aspectRatio} />
      <p className="px-3 py-2 text-sm"><span className="font-semibold">{creative.pageName || "brand"} </span>{creative.primaryText || creative.description}</p>
      <button type="button" className="mx-3 mb-3 w-[calc(100%-1.5rem)] rounded-lg bg-[#0095f6] py-2 text-sm font-semibold text-white">
        {creative.cta || "Shop Now"}
      </button>
    </div>
  );
}

function StoryReelTemplate({ creative }) {
  const aspectRatio = getCreativeAspectRatio(creative);
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl bg-black"
      style={{ aspectRatio, maxWidth: 360 }}
    >
      <AdImage creative={creative} className="absolute inset-0 h-full w-full" fit="contain" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
        <p className="text-sm font-semibold">{creative.pageName || creative.headline}</p>
        <p className="mt-1 text-xs text-white/80">Sponsored</p>
        {creative.primaryText || creative.description ? (
          <p className="mt-2 line-clamp-2 text-sm">{creative.primaryText || creative.description}</p>
        ) : null}
        <button type="button" className="mt-3 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black">
          {creative.cta || "Shop Now"}
        </button>
      </div>
    </div>
  );
}

function GmailPromoTemplate({ creative }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ fontFamily: GOOGLE.font }}>
      <MediaFrame creative={creative} aspectRatio="2.5 / 1" fit="contain" />
      <div className="p-4">
        <h2 className="text-base font-semibold">{creative.headline}</h2>
        <p className="mt-1 text-sm text-gray-600">{creative.description}</p>
        <button type="button" className="mt-3 rounded bg-[#1a73e8] px-4 py-2 text-xs font-medium text-white">
          {creative.cta || "Shop Now"}
        </button>
      </div>
    </div>
  );
}

function MobileAppAdTemplate({ creative }) {
  const isInterstitial = creative.type === "interstitial_ad" || creative.size === "320x480";
  const sourceSize = getCreativeSourceSize(creative) || creative.size;
  const dims = parseSize(sourceSize);
  const width = isInterstitial ? 320 : (dims?.width || 320);
  const height = isInterstitial ? 480 : (dims?.height && dims.height <= 100 ? dims.height : 50);

  return (
    <DisplayAdSlot
      creative={creative}
      width={width}
      height={height}
      showLabel={false}
      showAd
      fitMode="contain"
      showFitNotice={false}
    />
  );
}

function GenericDisplayTemplate({ creative }) {
  const sourceSize = getCreativeSourceSize(creative) || creative.size;
  const dims = parseSize(sourceSize) || { width: 300, height: 250 };
  return (
    <DisplayAdSlot creative={creative} width={dims.width} height={dims.height} showLabel={false} showAd fitMode="contain" />
  );
}

function renderMobileTemplate(environmentKey, creative) {
  const sourceSize = creative.sourceCreativeSize || creative.size;

  switch (environmentKey) {
    case "google_search":
      return <SearchAdTemplate creative={creative} />;
    case "youtube": {
      const sidebarSlot = pickBestAdSlot(sourceSize, YOUTUBE_SIDEBAR_SLOTS) || YOUTUBE_SIDEBAR_SLOTS[0];
      if (creative.type === "youtube_instream" || creative.type === "youtube_bumper") {
        return <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />;
      }
      return (
        <DisplayAdSlot
          creative={creative}
          width={sidebarSlot.width}
          height={sidebarSlot.height}
          showLabel={false}
          showAd
          fitMode="contain"
        />
      );
    }
    case "news_site": {
      const slot = pickBestAdSlot(sourceSize, MOBILE_NEWS_SLOTS) || MOBILE_NEWS_SLOTS[1];
      return (
        <DisplayAdSlot
          creative={creative}
          width={slot.width}
          height={slot.height}
          showLabel={false}
          showAd
          fitMode="contain"
        />
      );
    }
    case "mobile_app":
      return <MobileAppAdTemplate creative={creative} />;
    case "gmail":
      return <GmailPromoTemplate creative={creative} />;
    case "google_discover":
    case "google_shopping":
    case "google_maps":
    case "audience_network":
    case "facebook_marketplace":
    case "instagram_explore":
      return <GenericDisplayTemplate creative={creative} />;
    case "facebook_feed":
    case "facebook_feed_desktop":
      return <FeedPost creative={creative} isAd />;
    case "instagram_feed":
      return <InstagramFeedCard creative={creative} />;
    case "instagram_story":
    case "facebook_story":
    case "instagram_reels":
      return <StoryReelTemplate creative={creative} />;
    case "messenger":
      return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: FACEBOOK.border, fontFamily: FACEBOOK.font }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sponsored Message</p>
          <div className="mt-3 overflow-hidden rounded-xl">
            <MediaFrame creative={creative} aspectRatio={getCreativeAspectRatio(creative)} fit="contain" />
          </div>
          <p className="mt-3 text-sm font-semibold" style={{ color: FACEBOOK.text }}>{creative.headline}</p>
          <p className="mt-1 text-sm" style={{ color: FACEBOOK.secondary }}>{creative.description}</p>
          <button type="button" className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: FACEBOOK.primary }}>
            {creative.cta || "Send Message"}
          </button>
        </div>
      );
    default:
      return <GenericDisplayTemplate creative={creative} />;
  }
}

export default function MobileEnvironmentTemplatePreview({
  creative,
  environmentKey,
  deviceMode = "mobile",
  onCopy,
  onEdit,
}) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const badge = ENVIRONMENT_BADGES[environmentKey] || {
    label: creative.placement || "Ad Preview",
    className: "bg-gray-500/20 text-gray-100 border-gray-400/30",
  };

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge={badge.label}
      badgeClassName={badge.className}
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      hideSizeLabel
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment
        naturalWidth={390}
        naturalHeight={780}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        <MobileTemplateFrame>
          {renderMobileTemplate(environmentKey, creative)}
        </MobileTemplateFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
