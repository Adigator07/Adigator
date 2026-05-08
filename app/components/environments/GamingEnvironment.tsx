"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 600);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-emerald-500/60 font-medium">Sponsored</span>
        <span className="text-[9px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded font-mono border border-gray-700/50">{creativeSize}</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-700/50" style={{ width: maxW, height: dispH }}>
        <img src={creativeUrl} alt="Ad" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

const GAMES = [
  { name: "Cyber Siege: Rebirth", genre: "Action RPG", rating: "9.2", players: "84.2K online" },
  { name: "Stellar Drift", genre: "Space Sim", rating: "8.8", players: "42.1K online" },
  { name: "Shadow Protocol", genre: "Tactical FPS", rating: "9.5", players: "128K online" },
];

export default function GamingEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const publisher = content.publisherName ?? "GameVault";
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Shadow Protocol dominates weekly charts with record-breaking player count";
  const isMobile = device === "mobile";

  return (
    <div className="bg-[#070a0f] font-sans min-h-screen border border-emerald-900/30 rounded-xl overflow-hidden shadow-xl text-white">
      {/* Masthead */}
      <header className="border-b border-emerald-900/30 bg-[#070a0f]/90 backdrop-blur px-6 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm font-black text-black">G</div>
            <div className="text-lg font-black text-white tracking-tight">{publisher}</div>
          </div>
          {!isMobile && (
            <nav className="flex items-center gap-1 text-xs font-semibold">
              {["🎮 Games", "🏆 Rankings", "🔴 Live Streams", "📰 News", "🛒 Store"].map((n, i) => (
                <span key={n} className={`px-3 py-1.5 rounded-lg cursor-pointer ${i === 0 ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-white/5"} transition`}>
                  {n}
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              24.8K Live
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen interstitial overlay */}
      {slotType === "interstitial" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center">
          <div className="relative max-w-lg w-full mx-4">
            <div className="absolute -top-8 right-0 flex items-center gap-2">
              <span className="text-xs text-gray-400">Skip ad in 5s</span>
              <button className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs hover:bg-gray-600 transition">✕</button>
            </div>
            <div className="border-2 border-emerald-500/50 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20">
              <img src={creativeUrl} alt="Interstitial Ad" className="w-full object-cover" />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">Advertisement · {creativeSize}</p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {slotType === "leaderboard" && (
        <div className="bg-gray-900/60 border-b border-gray-800 px-6 py-3 flex justify-center">
          <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "" : "flex gap-6"}`}>
        <main className={isMobile ? "w-full" : "flex-1 min-w-0"}>
          {/* Hero */}
          <div className="relative rounded-2xl overflow-hidden mb-6 border border-gray-700/50 bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="w-full h-52 bg-gradient-to-br from-emerald-900/30 via-gray-900 to-gray-800 flex items-center justify-center">
              <span className="text-8xl opacity-15">🎮</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2 inline-block">
                TOP STORY
              </span>
              <h1 className="text-xl font-black text-white leading-tight">{headline}</h1>
            </div>
          </div>

          {/* Inline ad */}
          {(slotType === "inline" || slotType === "feed-card") && (
            <div className="mb-5 bg-gray-900/60 border border-gray-700/40 rounded-xl p-4">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}

          {/* Game cards */}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Featured Games</p>
          <div className="space-y-3">
            {GAMES.map((game, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-900/60 border border-gray-700/40 rounded-xl p-3 cursor-pointer hover:border-emerald-500/40 transition">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🕹️</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{game.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{game.genre}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-yellow-400 font-bold">★ {game.rating}</span>
                    <span className="text-xs text-emerald-400 font-medium">{game.players}</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex-shrink-0">Play</button>
              </div>
            ))}
          </div>
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 space-y-4">
            {slotType === "sidebar" && (
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-3">
                <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
              </div>
            )}
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">🔴 Live Now</p>
              <div className="space-y-3">
                {["xGamer_Pro · 48.2K viewers", "ShadowWolf · 31.7K viewers", "NightOwl_GG · 19.4K viewers"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{s.split("·")[0].trim()}</p>
                      <p className="text-[10px] text-red-400 font-medium">{s.split("·")[1]?.trim()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">🏆 Weekly Rankings</p>
              {["Shadow Protocol", "Cyber Siege", "Stellar Drift"].map((g, i) => (
                <div key={g} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-lg font-black text-gray-700 w-5">{i + 1}</span>
                  <span className="text-sm text-gray-300 font-medium">{g}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
