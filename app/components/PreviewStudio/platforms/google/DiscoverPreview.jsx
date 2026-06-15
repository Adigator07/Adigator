"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { UserImage } from "../../shared/previewUi";
import { dummyDiscoverCards } from "../../dummy/googleDummy";

function DiscoverCard({ card, isUser, headline, brandName, cta, imageUrl }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 mb-3">
      <div className="h-44 relative">
        {isUser ? (
          <UserImage imageUrl={imageUrl} className="w-full h-full" />
        ) : (
          <div className="w-full h-full" style={{ background: card.color }} />
        )}
        {isUser ? (
          <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white font-semibold">Sponsored</span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="text-[10px] text-gray-500 uppercase">{isUser ? brandName : card.publisher}</p>
        <p className="text-sm font-semibold mt-0.5 line-clamp-2">{isUser ? headline : card.headline}</p>
        {isUser ? (
          <button type="button" className="mt-2 rounded-full border border-[#1a73e8] px-4 py-1 text-xs font-semibold text-[#1a73e8]">{cta}</button>
        ) : null}
      </div>
    </div>
  );
}

export default function DiscoverPreview({ headline, description, cta, imageUrl, brandName }) {
  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="bg-[#f1f3f4] min-h-[667px]">
        <header className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-200">
          <span className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold text-[#4285F4]">G</span>
          <span className="font-semibold text-gray-800">Discover</span>
        </header>
        <div className="p-3">
          <DiscoverCard card={dummyDiscoverCards[0]} />
          <DiscoverCard card={dummyDiscoverCards[1]} />
          <DiscoverCard isUser headline={headline} brandName={brandName} cta={cta} imageUrl={imageUrl} />
          <DiscoverCard card={dummyDiscoverCards[2]} />
          <DiscoverCard card={dummyDiscoverCards[3]} />
        </div>
      </div>
    </PreviewFrame>
  );
}
