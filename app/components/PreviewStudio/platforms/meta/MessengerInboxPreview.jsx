"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, SponsoredBadge } from "../../shared/previewUi";
import { dummyChats } from "../../dummy/metaDummy";

export default function MessengerInboxPreview({ headline, cta, logoUrl, brandName }) {
  const before = dummyChats.slice(0, 5);
  const after = dummyChats.slice(5, 8);

  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-white min-h-[667px]">
        <header className="bg-[#0084ff] text-white px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg">Chats</span>
          <span>✏ 🔍</span>
        </header>
        {before.map((chat) => (
          <div key={chat.name} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: chat.color }}>{chat.initials}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{chat.name}</p>
              <p className="text-sm text-gray-500 truncate">{chat.message}</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{chat.time}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-blue-50/50">
          <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{brandName} <SponsoredBadge label="Sponsored" className="inline ml-1" /></p>
            <p className="text-sm text-gray-600 truncate">{headline}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#0084ff] px-3 py-1 text-xs font-semibold text-white">{cta}</span>
        </div>
        {after.map((chat) => (
          <div key={chat.name} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: chat.color }}>{chat.initials}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{chat.name}</p>
              <p className="text-sm text-gray-500 truncate">{chat.message}</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{chat.time}</span>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}
