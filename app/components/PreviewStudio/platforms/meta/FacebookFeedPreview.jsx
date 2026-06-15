"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { dummyPosts, dummyStories } from "../../dummy/metaDummy";

function StoryCircle({ story }) {
  return (
    <div className="flex flex-col items-center shrink-0 w-16">
      <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
        <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: story.color }}>{story.initials}</div>
      </div>
      <span className="text-[10px] mt-1 truncate w-full text-center">{story.name}</span>
    </div>
  );
}

export default function FacebookFeedPreview({ headline, description, cta, imageUrl, logoUrl, brandName }) {
  const organic = dummyPosts[0];
  const below = dummyPosts[1];

  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-[#f0f2f5] min-h-[700px]">
        <header className="bg-[#1877f2] px-3 py-2 flex items-center justify-between text-white">
          <span className="font-bold text-lg">facebook</span>
          <span className="text-sm">🔍 ➕ 💬</span>
        </header>
        <div className="flex gap-2 px-2 py-3 overflow-x-auto bg-white border-b border-gray-200">
          {dummyStories.map((s) => <StoryCircle key={s.name} story={s} />)}
        </div>
        <div className="bg-white mt-2 p-3 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: organic.color }}>{organic.initials}</div>
            <div>
              <p className="text-sm font-semibold">{organic.name}</p>
              <p className="text-xs text-gray-500">{organic.time}</p>
            </div>
          </div>
          <p className="text-sm mb-2">{organic.text}</p>
          <div className="h-48 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg" />
        </div>
        <div className="bg-white mt-2 border-b border-gray-200">
          <div className="p-3 flex items-center gap-2">
            <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={40} />
            <div>
              <p className="text-sm font-semibold">{brandName}</p>
              <SponsoredBadge />
            </div>
          </div>
          <p className="px-3 pb-2 text-sm">{description}</p>
          <UserImage imageUrl={imageUrl} className="w-full aspect-[1.91/1]" />
          <div className="px-3 py-2 bg-gray-50 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase">{brandName}</p>
              <p className="text-sm font-semibold">{headline}</p>
            </div>
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm font-semibold">{cta}</button>
          </div>
          <div className="flex justify-around py-2 text-sm text-gray-600 border-t border-gray-100">
            <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
          </div>
        </div>
        <div className="bg-white mt-2 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: below.color }}>{below.initials}</div>
            <p className="text-sm font-semibold">{below.name}</p>
          </div>
          <p className="text-sm">{below.text}</p>
        </div>
      </div>
    </PreviewFrame>
  );
}
