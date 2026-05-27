"use client";

import { useState } from "react";
import { PreviewCardShell } from "../PreviewShared";
import { MetaImageBlock } from "./metaPreviewShared";

export default function CarouselPreview({ creative, onCopy, onEdit }) {
  const cards = Array.isArray(creative.cards) && creative.cards.length
    ? creative.cards
    : [
        { title: creative.headline, description: creative.description, cta: creative.cta, imageUrl: creative.imageUrl },
        { title: "Feature 2", description: "Secondary offer", cta: creative.cta, imageUrl: "" },
        { title: "Feature 3", description: "Third card message", cta: creative.cta, imageUrl: "" },
      ];
  const [index, setIndex] = useState(0);
  const active = cards[index];

  return (
    <PreviewCardShell creative={creative} platformLabel="Carousel" onCopy={onCopy} onEdit={onEdit}>
      <div className="max-w-md rounded-xl border border-[#dddfe2] bg-white overflow-hidden font-[Helvetica_Neue,Helvetica,Arial,sans-serif]">
        <div className="px-3 py-2 text-sm font-semibold text-[#050505]">{creative.headline || "Brand"} · Sponsored</div>
        <div className="relative">
          <MetaImageBlock creative={{ ...creative, imageUrl: active.imageUrl }} className="aspect-square w-full" />
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + cards.length) % cards.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-white text-xs"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % cards.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-white text-xs"
          >
            ›
          </button>
        </div>
        <div className="px-3 py-3 border-t border-[#dddfe2]">
          <p className="text-sm font-semibold text-[#050505]">{active.title}</p>
          <p className="text-xs text-[#65676b] mt-1">{active.description}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[#1877f2]">
            {active.cta || creative.cta || "Learn More"}
          </button>
        </div>
        <div className="flex justify-center gap-1 pb-3">
          {cards.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`h-1.5 w-1.5 rounded-full ${dotIndex === index ? "bg-[#1877f2]" : "bg-[#ccd0d5]"}`}
            />
          ))}
        </div>
      </div>
    </PreviewCardShell>
  );
}
