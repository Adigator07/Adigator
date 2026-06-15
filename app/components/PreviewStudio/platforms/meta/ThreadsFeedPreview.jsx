"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { dummyThreadsPosts } from "../../dummy/metaDummy";

export default function ThreadsFeedPreview({ headline, description, cta, imageUrl, logoUrl, brandName }) {
  const posts = [dummyThreadsPosts[0], dummyThreadsPosts[2]];

  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-white min-h-[667px]">
        <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg">@</span>
          <span className="font-bold">Threads</span>
          <span>✏</span>
        </header>
        {posts.slice(0, 1).map((post) => (
          <div key={post.username} className="px-4 py-3 border-b border-gray-100">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: post.color }}>{post.initials}</div>
              <div>
                <p className="text-sm"><strong>{post.username}</strong> <span className="text-gray-400">{post.time}</span></p>
                <p className="text-sm mt-1">{post.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-3">
            <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={36} />
            <div className="flex-1">
              <p className="text-sm"><strong>{brandName}</strong> <SponsoredBadge label="Sponsored" className="inline" /> <span className="text-gray-400">· 1h</span></p>
              <p className="text-sm mt-1">{description}</p>
              {imageUrl ? <UserImage imageUrl={imageUrl} className="w-full rounded-lg mt-2 max-h-48" /> : null}
              <div className="flex gap-4 mt-2 text-gray-500 text-lg">
                <span>♡</span><span>💬</span><span>↗</span><span className="ml-auto">···</span>
              </div>
            </div>
          </div>
        </div>
        {posts.slice(1).map((post) => (
          <div key={post.username} className="px-4 py-3 border-b border-gray-100">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: post.color }}>{post.initials}</div>
              <div>
                <p className="text-sm"><strong>{post.username}</strong> <span className="text-gray-400">{post.time}</span></p>
                <p className="text-sm mt-1">{post.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}
