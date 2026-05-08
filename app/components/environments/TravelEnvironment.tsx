"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

const DESTINATIONS = [
  { name: "Santorini, Greece", price: "From $1,240 / 7 nights", rating: "4.9 ⭐", tag: "Trending" },
  { name: "Kyoto, Japan", price: "From $2,180 / 10 nights", rating: "4.8 ⭐", tag: "Bestseller" },
  { name: "Maldives", price: "From $3,450 / 5 nights", rating: "5.0 ⭐", tag: "Luxury" },
  { name: "Barcelona, Spain", price: "From $890 / 6 nights", rating: "4.7 ⭐", tag: "Popular" },
];

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 700);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Sponsored</span>
        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div className="overflow-hidden shadow-sm" style={{ width: maxW, height: dispH }}>
        <img src={creativeUrl} alt="Sponsored" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

export default function TravelEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Top-rated destinations for summer 2026 — hand-picked by travel experts";
  const publisher = content.publisherName ?? "Wanderlust Guide";
  const related = content.uiModules.find((m) => m.type === "sidebar-widget");
  const isMobile = device === "mobile";

  return (
    <div className="bg-[#f8f7f4] font-sans min-h-screen border border-gray-200 rounded-xl overflow-hidden shadow-xl">
      {/* Hero header */}
      <div className="relative">
        <div className="w-full h-44 bg-linear-to-br from-cyan-500 via-blue-500 to-indigo-600 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-white text-2xl font-black tracking-tight mb-1">{publisher}</div>
          <p className="text-blue-100 text-sm mb-4">Discover · Plan · Book your perfect journey</p>
          {/* Search bar */}
          <div className={`bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 ${isMobile ? "w-full max-w-xs" : "w-full max-w-2xl"}`}>
            <span>📍</span>
            <input readOnly value="Where do you want to go?" className="flex-1 text-gray-500 text-sm bg-transparent outline-none cursor-pointer" />
            <span className="text-gray-400">·</span>
            <span className="text-gray-400 text-sm whitespace-nowrap">May 15 – May 22</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-400 text-sm whitespace-nowrap">2 guests</span>
            <button className="bg-linear-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl ml-2">Search</button>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {slotType === "leaderboard" && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex justify-center">
          <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "" : "flex gap-6"}`}>
        {/* Main content */}
        <main className={isMobile ? "w-full" : "flex-1 min-w-0"}>
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {["All", "Beaches", "Cities", "Mountains", "Luxury", "Budget", "Adventure"].map((f, i) => (
              <span key={f} className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${i === 0 ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600"} transition`}>
                {f}
              </span>
            ))}
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-1">{headline}</h2>
          <p className="text-sm text-gray-500 mb-4">Showing 47 hand-curated destinations · Updated daily</p>

          {/* Destination grid */}
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-2"}`}>
            {DESTINATIONS.map((dest, i) => (
              <>
                {i === 2 && slotType === "product-tile" && (
                  <div key="ad-tile" className="rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-50 cursor-pointer group">
                    <div className="relative">
                      <img src={creativeUrl} alt="Sponsored" className="w-full object-cover" style={{ height: 180 }} />
                      <span className="absolute top-3 left-3 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Sponsored
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-800 text-sm">Featured Destination Deal</p>
                      <p className="text-xs text-gray-400 mt-0.5">Promoted · {creativeSize}</p>
                    </div>
                  </div>
                )}
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-200 cursor-pointer group hover:shadow-lg transition">
                  <div className="relative w-full bg-linear-to-br from-blue-100 to-cyan-100 flex items-center justify-center" style={{ height: 180 }}>
                    <span className="text-5xl opacity-30">🌍</span>
                    <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${dest.tag === "Luxury" ? "bg-amber-500" : dest.tag === "Trending" ? "bg-red-500" : dest.tag === "Bestseller" ? "bg-green-500" : "bg-blue-500"}`}>
                      {dest.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-gray-900 text-base group-hover:text-blue-600 transition">{dest.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{dest.rating}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">Starting</p>
                        <p className="font-black text-blue-600 text-sm">{dest.price}</p>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 bg-linear-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition">
                      View Deals →
                    </button>
                  </div>
                </div>
              </>
            ))}
          </div>

          {/* Inline ad */}
          {slotType === "inline" && (
            <div className="mt-6">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="w-72 shrink-0 space-y-5">
            {slotType === "sidebar" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Last-Minute Deals</p>
              <div className="space-y-3">
                {["Bali, Indonesia · $780/5n", "Prague, Czech Republic · $540/4n", "Dubai, UAE · $1,100/5n"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-12 h-10 bg-linear-to-br from-blue-100 to-cyan-100 rounded-xl shrink-0 flex items-center justify-center text-xl">✈️</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition">{item.split("·")[0].trim()}</p>
                      <p className="text-xs font-bold text-blue-600">{item.split("·")[1]?.trim()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {related && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{related.label ?? "Inspiration"}</p>
                <div className="space-y-2">
                  {related.items?.map((item, i) => (
                    <p key={i} className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition border-b border-gray-100 pb-1.5">{item.text}</p>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
