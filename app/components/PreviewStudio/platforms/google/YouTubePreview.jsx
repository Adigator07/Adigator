"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyImagePlaceholder, UserImage } from "../../shared/previewUi";
import { dummyYouTubeComments, dummyYouTubeVideos } from "../../dummy/googleDummy";

export default function YouTubePreview({ headline, cta, imageUrl, brandName }) {
  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="bg-[#f9f9f9] text-gray-900 min-h-[720px]">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <span className="text-red-600 font-bold text-xl">▶ YouTube</span>
          <div className="flex-1 max-w-xl rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-500">
            Search running tips...
          </div>
          <span className="text-gray-500 text-sm">🔔 📹 👤</span>
        </header>

        <div className="flex p-6 gap-6">
          <div className="flex-1">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-6xl">▶</div>
              <div className="absolute bottom-4 left-4 right-4 max-w-sm bg-black/85 rounded-lg p-3 flex gap-3">
                <div className="w-[120px] h-[68px] shrink-0 rounded overflow-hidden">
                  <UserImage imageUrl={imageUrl} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0 text-white">
                  <p className="text-xs font-semibold line-clamp-2">{headline}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{brandName}</p>
                  <button type="button" className="mt-1.5 rounded bg-[#1a73e8] px-2 py-0.5 text-[10px] font-semibold">{cta}</button>
                </div>
                <span className="absolute top-2 right-2 text-[10px] text-gray-300 bg-black/50 px-2 py-0.5 rounded">Skip Ad ▶</span>
              </div>
            </div>

            <h1 className="text-xl font-semibold mt-4">10 Best Running Techniques for Beginners</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-9 h-9 rounded-full bg-orange-500" />
              <div>
                <p className="text-sm font-semibold">FitnessFirst</p>
                <p className="text-xs text-gray-500">1.2M subscribers</p>
              </div>
              <button type="button" className="ml-auto rounded-full bg-black text-white px-4 py-1.5 text-sm font-semibold">Subscribe</button>
            </div>

            <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
              {dummyYouTubeComments.map((c) => (
                <div key={c.user} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">{c.user} <span className="font-normal text-gray-500">· 2 days ago</span></p>
                    <p className="text-sm">{c.text}</p>
                    <p className="text-xs text-gray-500 mt-1">👍 {c.likes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="w-72 shrink-0 space-y-3">
            {dummyYouTubeVideos.map((v) => (
              <div key={v.title} className="flex gap-2">
                <DummyImagePlaceholder width={120} height={68} color="#374151" className="rounded shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-2 leading-tight">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{v.channel}</p>
                  <p className="text-xs text-gray-500">{v.views} · {v.ago}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
