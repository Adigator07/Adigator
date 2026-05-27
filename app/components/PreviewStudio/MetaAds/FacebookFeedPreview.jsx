"use client";

import { PreviewCardShell } from "../PreviewShared";
import { MetaAvatar, MetaImageBlock } from "./metaPreviewShared";

export default function FacebookFeedPreview({ creative, onCopy, onEdit }) {
  return (
    <PreviewCardShell creative={creative} platformLabel="Facebook Feed" onCopy={onCopy} onEdit={onEdit}>
      <div className="max-w-md rounded-xl border border-[#dddfe2] bg-[#f0f2f5] p-3 font-[Helvetica_Neue,Helvetica,Arial,sans-serif]">
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <MetaAvatar label={creative.headline} />
              <div>
                <p className="text-sm font-semibold text-[#050505]">{creative.headline || "Page Name"}</p>
                <p className="text-xs text-[#65676b]">Sponsored · 2h</p>
              </div>
            </div>
            <span className="text-[#65676b] text-lg leading-none">···</span>
          </div>
          <p className="px-3 pb-2 text-sm text-[#050505]">{creative.description}</p>
          <MetaImageBlock creative={creative} className="aspect-[1.91/1] w-full" />
          <div className="border-t border-[#dddfe2] px-3 py-2">
            <p className="text-xs uppercase text-[#65676b]">{creative.placement}</p>
            <p className="text-sm font-semibold text-[#050505]">{creative.headline2 || creative.headline}</p>
            <p className="text-xs text-[#65676b] line-clamp-2">{creative.description2 || creative.description}</p>
          </div>
          <div className="border-t border-[#dddfe2] px-3 py-2 flex justify-end">
            <button type="button" className="rounded-md bg-[#e4e6eb] px-4 py-2 text-sm font-semibold text-[#050505]">
              {creative.cta || "Shop Now"}
            </button>
          </div>
          <div className="border-t border-[#dddfe2] px-3 py-2 flex items-center justify-around text-xs font-semibold text-[#65676b]">
            <span>Like</span>
            <span>Comment</span>
            <span>Share</span>
          </div>
        </div>
      </div>
    </PreviewCardShell>
  );
}
