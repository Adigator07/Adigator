"use client";

import { PreviewCardShell } from "../PreviewShared";
import { GoogleImageBlock } from "./googlePreviewShared";

export default function GoogleAppPreview({ creative, onCopy, onEdit }) {
  const rating = Number(creative.rating) || 4.7;

  return (
    <PreviewCardShell creative={creative} platformLabel="Google App Install" onCopy={onCopy} onEdit={onEdit}>
      <div className="max-w-sm rounded-2xl border border-[#dadce0] bg-white p-4 font-[Roboto,Arial,sans-serif] shadow-sm">
        <div className="flex items-start gap-3">
          <GoogleImageBlock creative={creative} className="h-16 w-16 rounded-2xl shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-medium text-[#202124] truncate">{creative.headline}</h4>
            <p className="text-xs text-[#5f6368] truncate">{creative.description || "Developer Name"}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#fbbc04]">
              {"★".repeat(Math.round(rating))}
              <span className="text-[#5f6368]">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="rounded-full bg-[#1a73e8] px-5 py-2 text-sm font-semibold text-white">
            {creative.cta || "Install"}
          </button>
          <span className="rounded border border-[#dadce0] px-2 py-1 text-[10px] font-semibold text-[#5f6368]">
            Google Play
          </span>
        </div>
        <div className="mt-4 flex gap-2 overflow-hidden rounded-xl bg-[#f8f9fa] p-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 w-14 shrink-0 rounded-lg bg-slate-200" />
          ))}
        </div>
      </div>
    </PreviewCardShell>
  );
}
