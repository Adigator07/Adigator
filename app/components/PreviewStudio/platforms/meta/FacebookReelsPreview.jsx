"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { UserImage } from "../../shared/previewUi";

export default function FacebookReelsPreview({ headline, description, cta, imageUrl, brandName }) {
  return (
    <PreviewFrame width={375} style={{ height: 667 }}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="relative w-full h-[667px] bg-black overflow-hidden">
        <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-4 right-3 text-white text-sm">🔇 ⛶</div>
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 text-white text-xs">
          <div className="text-center"><span className="text-2xl">❤️</span><p>12.4K</p></div>
          <div className="text-center"><span className="text-2xl">💬</span><p>892</p></div>
          <div className="text-center"><span className="text-2xl">↗</span><p>Share</p></div>
          <div className="text-center"><span className="text-2xl">•••</span></div>
        </div>
        <div className="absolute bottom-8 left-4 right-16 text-white">
          <p className="text-sm font-semibold">{brandName} · <span className="font-normal text-white/70">Sponsored</span></p>
          <p className="text-base font-bold mt-1">{headline}</p>
          <p className="text-sm text-white/80 line-clamp-1 mt-0.5">{description}</p>
          <button type="button" className="mt-3 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold">{cta}</button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
          <div className="h-full w-1/3 bg-white" />
        </div>
      </div>
    </PreviewFrame>
  );
}
