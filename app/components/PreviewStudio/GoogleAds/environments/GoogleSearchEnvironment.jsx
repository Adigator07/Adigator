"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import {
  AdImage, AdChoicesMark, EnvironmentPreviewCard, GoogleLogo, ScaledEnvironment,
} from "../../shared/envShared";

const ORGANIC = [
  { url: "example.com/guide", title: "Complete Guide to Smart Shopping", desc: "Learn how to compare products, read reviews, and find the best deals online." },
  { url: "example.com/reviews", title: "Top Rated Products This Season", desc: "Expert reviews and buyer recommendations updated weekly." },
  { url: "example.com/blog", title: "How to Choose the Right Product", desc: "A practical checklist for making confident purchase decisions." },
];

function DisplayAdUnit({ creative, width, height }) {
  return (
    <div className="relative border border-[#dadce0] bg-white overflow-hidden" style={{ width, height }}>
      <AdImage creative={creative} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2 text-white">
        <p className="text-xs font-semibold line-clamp-2">{creative.headline}</p>
        <span className="mt-1 inline-block rounded bg-[#1a73e8] px-2 py-0.5 text-[10px]">{creative.cta}</span>
      </div>
      <AdChoicesMark className="absolute top-1 right-1 bg-white/80 px-1 rounded" />
    </div>
  );
}

export default function GoogleSearchEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const headlines = [creative.headline, creative.headline2, creative.headline3].filter(Boolean).join(" · ");
  const keyword = creative.headline?.split(" ")[0] || "products";

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Google Search"
      badgeClassName="bg-blue-500/20 text-blue-100 border-blue-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={920} naturalHeight={720} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ fontFamily: GOOGLE.font, background: GOOGLE.bg, color: GOOGLE.body, width: 920, minHeight: 720 }}>
          <div className="flex items-center gap-6 px-6 pt-5 pb-3">
            <GoogleLogo />
            <div className="flex-1 flex items-center rounded-full border px-4 py-2 shadow-sm" style={{ borderColor: GOOGLE.searchBorder }}>
              <span className="text-sm text-gray-700">{keyword} best deals</span>
              <span className="ml-auto text-gray-400">✕ | 🎤 | 📷</span>
            </div>
          </div>
          <div className="flex gap-6 px-8 border-b text-sm" style={{ borderColor: "#ebebeb" }}>
            {["All", "Images", "Videos", "News", "Shopping"].map((tab, i) => (
              <span key={tab} className={`pb-3 ${i === 0 ? "border-b-2 border-[#1a73e8] text-[#1a73e8]" : "text-gray-600"}`}>{tab}</span>
            ))}
          </div>
          <p className="px-8 py-3 text-xs text-gray-500">About 24,300,000 results (0.42 seconds)</p>
          <div className="px-8 pb-4">
            <span className="text-[11px] font-semibold" style={{ color: GOOGLE.sponsored }}>Sponsored</span>
            <p className="text-sm mt-1" style={{ color: GOOGLE.urlGreen }}>{creative.displayUrl || "www.example.com › products"}</p>
            <h3 className="text-xl mt-0.5 hover:underline cursor-default" style={{ color: GOOGLE.link }}>{headlines}</h3>
            <p className="text-sm mt-1">{creative.description}</p>
            {creative.description2 ? <p className="text-sm">{creative.description2}</p> : null}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm" style={{ color: GOOGLE.link }}>
              <span>{creative.cta || "Shop Now"}</span>
              <span>Free Shipping</span>
              <span>Customer Reviews</span>
              <span>Contact Us</span>
            </div>
          </div>
          {ORGANIC.map((item) => (
            <div key={item.url} className="px-8 py-3 border-t" style={{ borderColor: "#f1f3f4" }}>
              <p className="text-sm" style={{ color: GOOGLE.urlGreen }}>{item.url}</p>
              <p className="text-lg" style={{ color: GOOGLE.link }}>{item.title}</p>
              <p className="text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}

export { DisplayAdUnit };
