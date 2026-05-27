"use client";

import { PreviewCardShell } from "../PreviewShared";
import { GoogleImageBlock } from "./googlePreviewShared";

export default function GoogleShoppingPreview({ creative, onCopy, onEdit }) {
  const rating = Number(creative.rating) || 4.6;

  return (
    <PreviewCardShell creative={creative} platformLabel="Google Shopping" onCopy={onCopy} onEdit={onEdit}>
      <div className="max-w-xs rounded-xl border border-[#dadce0] bg-white p-3 font-[Roboto,Arial,sans-serif] shadow-sm">
        <GoogleImageBlock creative={creative} className="aspect-square rounded-lg mb-3" />
        <p className="text-[10px] uppercase tracking-wide text-[#5f6368]">Sponsored</p>
        <h4 className="mt-1 text-sm font-medium text-[#202124] line-clamp-2">{creative.headline}</h4>
        <p className="mt-1 text-lg font-bold text-[#202124]">{creative.price || "$49.99"}</p>
        <p className="text-xs text-[#5f6368]">{creative.description || "Official Store"}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-[#fbbc04]">
          {"★".repeat(Math.round(rating))}
          <span className="text-[#5f6368] ml-1">{rating.toFixed(1)} (128)</span>
        </div>
      </div>
    </PreviewCardShell>
  );
}
