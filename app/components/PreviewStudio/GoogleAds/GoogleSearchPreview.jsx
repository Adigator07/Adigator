"use client";

import { PreviewCardShell } from "../PreviewShared";

export default function GoogleSearchPreview({ creative, onCopy, onEdit }) {
  const headlineParts = [creative.headline, creative.headline2, creative.headline3].filter(Boolean);

  return (
    <PreviewCardShell creative={creative} platformLabel="Google Search" onCopy={onCopy} onEdit={onEdit}>
      <div className="rounded-xl border border-[#dadce0] bg-white p-4 font-[Roboto,Arial,sans-serif] text-left shadow-sm">
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className="rounded border border-[#dadce0] px-1.5 py-0.5 font-bold text-[#202124]">Ad</span>
          <span className="text-[#202124] font-medium">www.google.com</span>
        </div>
        <p className="text-[#006621] text-sm truncate">
          {creative.displayUrl || "www.example.com › offers"}
        </p>
        <h3 className="mt-1 text-[#1a0dab] text-xl leading-snug hover:underline cursor-pointer">
          {headlineParts.join(" · ") || creative.headline}
        </h3>
        <p className="mt-1 text-[#4d5156] text-sm leading-relaxed">{creative.description}</p>
        {creative.description2 ? (
          <p className="text-[#4d5156] text-sm leading-relaxed">{creative.description2}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-4 text-[#1a0dab] text-sm">
          <span className="hover:underline cursor-pointer">{creative.cta || "Learn More"}</span>
          <span className="hover:underline cursor-pointer">Contact Us</span>
          <span className="hover:underline cursor-pointer">Pricing</span>
        </div>
      </div>
    </PreviewCardShell>
  );
}
