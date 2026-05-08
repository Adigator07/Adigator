"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

const MATCHES = [
  { teams: ["Arsenal", "Man City"], score: ["2", "1"], status: "FT", league: "Premier League" },
  { teams: ["Lakers", "Celtics"], score: ["108", "104"], status: "4Q 3:42", league: "NBA" },
  { teams: ["Federer", "Djokovic"], score: ["6-4", "7-5"], status: "Completed", league: "Wimbledon" },
];

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 700);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-medium">Advertisement</span>
        <span className="text-[9px] text-gray-400 bg-gray-800/60 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div className="overflow-hidden border border-gray-700/50" style={{ width: maxW, height: dispH }}>
        <img src={creativeUrl} alt="Ad" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

export default function SportsEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Arsenal seals stunning comeback in title showdown at Emirates Stadium";
  const trending = content.uiModules.find((m) => m.type === "trending");
  const publisher = content.publisherName ?? "SportsPulse Live";
  const isMobile = device === "mobile";

  return (
    <div className="bg-[#0d1117] font-sans min-h-screen border border-gray-700/50 rounded-xl overflow-hidden shadow-xl text-white">
      {/* Masthead */}
      <header className="border-b border-gray-700/50 bg-[#0d1117] px-6 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-lg font-black bg-linear-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{publisher}</div>
            </div>
          </div>
          {!isMobile && (
            <nav className="flex items-center gap-1 text-xs font-semibold">
              {["Football", "Basketball", "Tennis", "F1", "Cricket", "eSports"].map((n, i) => (
                <span key={n} className={`px-3 py-1.5 rounded-lg cursor-pointer ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400 hover:text-white hover:bg-white/5"} transition`}>
                  {n}
                </span>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full border border-red-500/30">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </div>
          </div>
        </div>
      </header>

      {/* Leaderboard */}
      {slotType === "leaderboard" && (
        <div className="bg-gray-900 border-b border-gray-700/50 px-6 py-3 flex justify-center">
          <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
        </div>
      )}

      {/* Live score bar */}
      <div className={`border-b border-gray-700/50 px-4 py-3 overflow-x-auto ${isMobile ? "" : ""}`}>
        <div className="flex items-center gap-3 min-w-max">
          {MATCHES.map((m, i) => (
            <div key={i} className={`flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5 cursor-pointer hover:border-yellow-500/40 transition shrink-0 ${i === 0 ? "border-yellow-500/50" : ""}`}>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{m.league}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">{m.teams[0]}</span>
                  <div className="flex items-center gap-1.5 bg-gray-900 rounded-lg px-2 py-1">
                    <span className="text-base font-black text-yellow-400">{m.score[0]}</span>
                    <span className="text-gray-600 text-xs">–</span>
                    <span className="text-base font-black text-white">{m.score[1]}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{m.teams[1]}</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${m.status.includes("Q") || m.status === "LIVE" ? "text-green-400" : "text-gray-500"}`}>{m.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "" : "flex gap-6"}`}>
        {/* Main content */}
        <main className={isMobile ? "w-full" : "flex-1 min-w-0"}>
          {/* Hero article */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden mb-5">
            <div className="w-full h-48 bg-linear-to-br from-yellow-900/30 to-orange-900/30 flex items-center justify-center">
              <span className="text-6xl opacity-30">⚽</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">MATCH REPORT</span>
                <span className="text-gray-500 text-xs">2h ago</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight mb-2">{headline}</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                A breathtaking second-half performance saw the home side overturn a first-half deficit, with decisive goals in the 73rd and 88th minutes sealing a vital three points in the title race.
              </p>
            </div>
          </div>

          {/* Inline ad */}
          {(slotType === "inline" || slotType === "native-recommendation") && (
            <div className="mb-5">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}

          {/* More stories */}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">More Stories</p>
          <div className="space-y-3">
            {[
              { title: "NBA Finals: Celtics hold on in overtime thriller", label: "Basketball", time: "35m" },
              { title: "F1: Verstappen on pole as Hamilton challenges in qualifying", label: "Formula 1", time: "1h" },
              { title: "Transfer window: Top 10 moves to watch this summer", label: "Football", time: "2h" },
            ].map((story, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-800/30 border border-gray-700/30 rounded-xl p-3 cursor-pointer hover:border-yellow-500/30 transition">
                <div className="w-16 h-12 bg-gray-700/60 rounded-lg flex items-center justify-center text-2xl shrink-0">⚡</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">{story.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-yellow-400 uppercase">{story.label}</span>
                    <span className="text-gray-500 text-[10px]">· {story.time} ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="w-72 shrink-0 space-y-4">
            {slotType === "sidebar" && (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3">
                <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
              </div>
            )}
            {trending && (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                  {trending.label ?? "Trending"}
                </p>
                <div className="space-y-3">
                  {trending.items?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 cursor-pointer group">
                      <span className="text-xl font-black text-gray-700 leading-none w-6 shrink-0 group-hover:text-yellow-400 transition">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-200 leading-snug group-hover:text-yellow-400 transition">{item.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.secondary}</p>
                      </div>
                    </div>
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
