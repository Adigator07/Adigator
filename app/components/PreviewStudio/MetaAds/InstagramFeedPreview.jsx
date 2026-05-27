"use client";

import { PreviewCardShell } from "../PreviewShared";
import { MetaAvatar, MetaImageBlock } from "./metaPreviewShared";

export default function InstagramFeedPreview({ creative, onCopy, onEdit }) {
  return (
    <PreviewCardShell creative={creative} platformLabel="Instagram Feed" onCopy={onCopy} onEdit={onEdit}>
      <div className="max-w-sm rounded-xl border border-[#dbdbdb] bg-white font-[system-ui,-apple-system,BlinkMacSystemFont,sans-serif] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <MetaAvatar label={creative.headline} />
            <div>
              <p className="text-sm font-semibold text-black">{creative.headline || "brandname"}</p>
              <p className="text-[10px] text-[#8e8e8e]">Sponsored</p>
            </div>
          </div>
          <span className="text-black text-lg">···</span>
        </div>
        <MetaImageBlock creative={creative} className="aspect-square w-full" />
        <div className="px-3 py-2">
          <div className="flex items-center gap-4 text-xl">
            <span>♡</span><span>💬</span><span>↗</span>
            <span className="ml-auto">⌁</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-black">1,248 likes</p>
          <p className="mt-1 text-sm text-black">
            <span className="font-semibold">{creative.headline || "brandname"} </span>
            {creative.description}
          </p>
          <button type="button" className="mt-3 w-full rounded-lg bg-[#0095f6] py-2 text-sm font-semibold text-white">
            {creative.cta || "Shop Now"}
          </button>
        </div>
      </div>
    </PreviewCardShell>
  );
}
