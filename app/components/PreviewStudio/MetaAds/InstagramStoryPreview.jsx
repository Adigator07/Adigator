"use client";

import { PreviewCardShell, ScaledAdFrame } from "../PreviewShared";
import { MetaAvatar, MetaImageBlock } from "./metaPreviewShared";

export default function InstagramStoryPreview({ creative, onCopy, onEdit }) {
  const width = 375;
  const height = 812;

  return (
    <PreviewCardShell creative={creative} platformLabel="Instagram Stories" onCopy={onCopy} onEdit={onEdit}>
      <ScaledAdFrame width={width} height={height}>
        <div className="relative overflow-hidden rounded-2xl bg-black text-white" style={{ width, height }}>
          <MetaImageBlock creative={creative} className="absolute inset-0" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute top-3 inset-x-3 flex gap-1">
            {[1, 2, 3].map((segment) => (
              <div key={segment} className="h-1 flex-1 rounded-full bg-white/35 overflow-hidden">
                <div className={`h-full bg-white ${segment === 1 ? "w-2/3" : "w-0"}`} />
              </div>
            ))}
          </div>
          <div className="absolute top-8 left-3 flex items-center gap-2">
            <MetaAvatar label={creative.headline} />
            <div>
              <p className="text-sm font-semibold">{creative.headline || "brandname"}</p>
              <p className="text-[10px] text-white/80">Sponsored</p>
            </div>
          </div>
          <div className="absolute bottom-24 inset-x-4">
            <p className="text-lg font-semibold drop-shadow">{creative.description || creative.headline}</p>
          </div>
          <div className="absolute bottom-8 inset-x-4 flex flex-col items-center gap-2">
            <button type="button" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">
              {creative.cta || "Swipe Up"}
            </button>
            <span className="text-white/80 text-xs">⌃</span>
          </div>
        </div>
      </ScaledAdFrame>
    </PreviewCardShell>
  );
}
