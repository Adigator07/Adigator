"use client";

import { PreviewCardShell } from "../PreviewShared";
import { MetaAvatar, MetaImageBlock } from "./metaPreviewShared";

export default function MessengerPreview({ creative, onCopy, onEdit }) {
  return (
    <PreviewCardShell creative={creative} platformLabel="Messenger" onCopy={onCopy} onEdit={onEdit}>
      <div className="max-w-sm rounded-2xl border border-[#dddfe2] bg-[#f0f2f5] overflow-hidden font-[Helvetica_Neue,Helvetica,Arial,sans-serif]">
        <div className="flex items-center gap-2 border-b border-[#dddfe2] bg-white px-3 py-3">
          <MetaAvatar label={creative.headline} />
          <div>
            <p className="text-sm font-semibold text-[#050505]">{creative.headline || "Brand"}</p>
            <p className="text-xs text-[#31a24c]">Active now</p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white p-3 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-[#65676b] mb-2">Sponsored</p>
            <div className="flex gap-3">
              <MetaImageBlock creative={creative} className="h-16 w-16 rounded-lg shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#050505] line-clamp-2">{creative.headline}</p>
                <p className="text-xs text-[#65676b] mt-1 line-clamp-3">{creative.description}</p>
              </div>
            </div>
            <button type="button" className="mt-3 w-full rounded-full bg-[#0084ff] py-2 text-sm font-semibold text-white">
              {creative.cta || "Shop Now"}
            </button>
          </div>
        </div>
      </div>
    </PreviewCardShell>
  );
}
