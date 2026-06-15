"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { UserImage } from "../../shared/previewUi";

export default function AppPreview({ headline, description, cta, imageUrl }) {
  return (
    <PreviewFrame width={375} className="rounded-[2rem] border-8 border-gray-900">
      <div className="relative bg-gray-100 min-h-[667px] overflow-hidden" style={{ fontFamily: "'Google Sans', Arial, sans-serif" }}>
        <div className="flex items-center justify-between px-6 pt-2 pb-1 text-[10px] font-semibold text-gray-900">
          <span>9:41</span>
          <span>📶 🔋</span>
        </div>

        <div className="px-4 py-6 opacity-30 pointer-events-none">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 h-48 flex items-center justify-center text-white font-bold text-lg">
            Puzzle Quest
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="aspect-square rounded-xl bg-white shadow" />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[320px] shadow-2xl">
            <button type="button" className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center">×</button>
            <UserImage imageUrl={imageUrl} className="w-full h-44" />
            <div className="p-4">
              <h3 className="font-bold text-gray-900">{headline}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">{description}</p>
              <button type="button" className="mt-3 w-full rounded-lg bg-[#1a73e8] py-2.5 text-sm font-semibold text-white">{cta}</button>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
