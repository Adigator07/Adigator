"use client";

import { PreviewCardShell, ScaledAdFrame } from "../PreviewShared";
import { MetaImageBlock } from "./metaPreviewShared";

export default function ReelsPreview({ creative, onCopy, onEdit }) {
  const width = 375;
  const height = 812;

  return (
    <PreviewCardShell creative={creative} platformLabel="Instagram Reels" onCopy={onCopy} onEdit={onEdit}>
      <ScaledAdFrame width={width} height={height}>
        <div className="relative overflow-hidden rounded-2xl bg-black text-white" style={{ width, height }}>
          <MetaImageBlock creative={creative} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          <div className="absolute top-4 left-4 rounded bg-black/40 px-2 py-1 text-[10px] font-semibold">Sponsored</div>
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-xl">
            <span>♡</span><span>💬</span><span>↗</span><span>♫</span>
          </div>
          <div className="absolute bottom-20 left-4 right-16">
            <p className="text-sm font-semibold">{creative.headline || "brandname"}</p>
            <p className="mt-1 text-sm text-white/90 line-clamp-3">{creative.description}</p>
            <p className="mt-2 text-xs text-white/70">Original audio · Brand</p>
          </div>
          <button type="button" className="absolute bottom-6 left-4 right-4 rounded-lg bg-white py-3 text-sm font-semibold text-black">
            {creative.cta || "Shop Now"}
          </button>
        </div>
      </ScaledAdFrame>
    </PreviewCardShell>
  );
}
