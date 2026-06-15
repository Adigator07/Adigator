"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { AdBadge } from "../../shared/previewUi";
import {
  dummySearchResults,
  dummySearchQuery,
} from "../../dummy/googleDummy";

function GoogleLogo() {
  return (
    <span className="text-2xl font-bold tracking-tight">
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
    </span>
  );
}

export default function SearchPreview({ headline, description, displayUrl, brandName }) {
  const above = dummySearchResults.slice(0, 3);
  const below = dummySearchResults.slice(3, 6);

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="bg-white text-gray-900 min-h-[720px]">
        <div className="flex items-center gap-6 px-8 pt-6 pb-4">
          <GoogleLogo />
          <div className="flex-1 flex items-center rounded-full border border-gray-300 px-5 py-2.5 shadow-sm">
            <span className="text-sm text-gray-700">{dummySearchQuery}</span>
            <span className="ml-auto text-gray-400 text-sm">✕ | 🎤 | 📷 | 🔍</span>
          </div>
        </div>
        <div className="flex gap-6 px-10 border-b border-gray-200 text-sm">
          {["All", "Images", "Videos", "News", "Shopping"].map((tab, i) => (
            <span key={tab} className={`pb-3 ${i === 0 ? "border-b-2 border-[#1a73e8] text-[#1a73e8]" : "text-gray-600"}`}>{tab}</span>
          ))}
        </div>
        <p className="px-10 py-3 text-xs text-gray-500">About 2,14,000,000 results (0.47 seconds)</p>

        {above.map((r) => (
          <div key={r.url} className="px-10 py-3 border-t border-gray-100">
            <p className="text-sm text-[#202124]">{r.title}</p>
            <p className="text-xs text-[#006621] mt-0.5">{r.url}</p>
            <p className="text-sm text-[#4d5156] mt-1">{r.description}</p>
          </div>
        ))}

        <div className="px-10 py-4 bg-[#f8f9fa] border-y border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <AdBadge />
            <span className="text-xs text-gray-500">{brandName}</span>
          </div>
          <p className="text-sm text-[#006621]">{displayUrl}</p>
          <h3 className="text-xl text-[#1a0dab] mt-0.5 hover:underline cursor-default">{headline}</h3>
          <p className="text-sm text-[#4d5156] mt-1">{description}</p>
        </div>

        {below.map((r) => (
          <div key={r.url} className="px-10 py-3 border-t border-gray-100">
            <p className="text-sm text-[#202124]">{r.title}</p>
            <p className="text-xs text-[#006621] mt-0.5">{r.url}</p>
            <p className="text-sm text-[#4d5156] mt-1">{r.description}</p>
          </div>
        ))}

        <div className="flex justify-center gap-2 py-8 text-sm">
          <span className="text-[#1a73e8] font-bold">G</span>
          <span className="text-[#1a73e8]">o</span>
          <span className="text-[#1a73e8]">o</span>
          <span className="text-[#1a73e8]">o</span>
          <span className="text-[#1a73e8]">o</span>
          <span className="text-[#1a73e8]">o</span>
          <span className="text-[#1a73e8]">o</span>
          <span className="text-gray-600 ml-2">Next ›</span>
        </div>
      </div>
    </PreviewFrame>
  );
}
