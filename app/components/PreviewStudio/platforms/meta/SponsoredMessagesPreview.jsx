"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, UserImage } from "../../shared/previewUi";
import { dummyMessengerMessages } from "../../dummy/metaDummy";

export default function SponsoredMessagesPreview({ headline, description, cta, imageUrl, logoUrl, brandName }) {
  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-white min-h-[667px] flex flex-col">
        <header className="border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={36} />
          <span className="font-semibold">{brandName}</span>
        </header>
        <div className="flex-1 p-4 space-y-3 bg-[#f0f2f5]">
          {dummyMessengerMessages.map((msg, i) => (
            <div key={i} className="flex justify-end">
              <div className="bg-[#0084ff] text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[75%]">{msg.text}</div>
            </div>
          ))}
          <div className="flex gap-2 max-w-[85%]">
            <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={28} />
            <div>
              <div className="bg-white rounded-2xl rounded-bl-sm overflow-hidden shadow-sm">
                <UserImage imageUrl={imageUrl} className="w-56 h-32" />
                <div className="p-3">
                  <p className="font-semibold text-sm">{headline}</p>
                  <p className="text-xs text-gray-600 mt-1">{description}</p>
                  <button type="button" className="mt-2 rounded-full bg-[#0084ff] px-4 py-1.5 text-xs font-semibold text-white">{cta}</button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-1">This is a sponsored message</p>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
