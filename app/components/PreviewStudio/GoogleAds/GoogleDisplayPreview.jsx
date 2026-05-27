"use client";

import { PreviewCardShell, ScaledAdFrame } from "../PreviewShared";
import { GoogleImageBlock } from "./googlePreviewShared";

export default function GoogleDisplayPreview({ creative, onCopy, onEdit }) {
  const [width, height] = String(creative.size || "300x250").split("x").map(Number);
  const adWidth = width || 300;
  const adHeight = height || 250;

  return (
    <PreviewCardShell creative={creative} platformLabel="Google Display" onCopy={onCopy} onEdit={onEdit}>
      <ScaledAdFrame width={adWidth} height={adHeight}>
        <div
          className="relative overflow-hidden border border-[#dadce0] bg-white shadow-md"
          style={{ width: adWidth, height: adHeight }}
        >
          <GoogleImageBlock creative={creative} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-sm font-semibold leading-tight line-clamp-2">{creative.headline}</p>
            <button type="button" className="mt-2 rounded bg-[#1a73e8] px-3 py-1 text-[11px] font-semibold">
              {creative.cta || "Learn More"}
            </button>
          </div>
          <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white font-mono">
            {creative.size}
          </div>
        </div>
      </ScaledAdFrame>
    </PreviewCardShell>
  );
}
