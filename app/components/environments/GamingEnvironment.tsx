"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const GAMES = [
  { name: "Apex Nexus", genre: "Battle Royale", players: "2.1M playing", rating: 4.7, tag: "HOT", gradient: "from-emerald-600 to-teal-700", tagColor: "bg-emerald-500" },
  { name: "Shadow Protocol", genre: "FPS Tactical", players: "847K playing", rating: 4.5, tag: "NEW", gradient: "from-red-700 to-rose-800", tagColor: "bg-red-500" },
  { name: "Chrono Drift", genre: "RPG Open World", players: "1.3M playing", rating: 4.9, tag: "TOP RATED", gradient: "from-violet-700 to-purple-800", tagColor: "bg-violet-500" },
  { name: "Iron Fleet", genre: "Strategy", players: "560K playing", rating: 4.4, tag: "SALE 50%", gradient: "from-blue-700 to-indigo-800", tagColor: "bg-blue-500" },
  { name: "Neon Runners", genre: "Racing Arcade", players: "391K playing", rating: 4.6, tag: "TRENDING", gradient: "from-orange-600 to-amber-700", tagColor: "bg-orange-500" },
  { name: "Galaxy Command", genre: "RTS Sci-Fi", players: "228K playing", rating: 4.3, tag: "CLASSIC", gradient: "from-cyan-700 to-sky-800", tagColor: "bg-cyan-500" },
];

const TOURNAMENTS = [
  { name: "World Apex Championship", prize: "$500K", status: "LIVE", teams: 32, game: "Apex Nexus" },
  { name: "Shadow League Season 4", prize: "$200K", status: "Qualifying", teams: 128, game: "Shadow Protocol" },
  { name: "Chrono Open Finals", prize: "$1M", status: "Starting Soon", teams: 16, game: "Chrono Drift" },
];

export default function GamingEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "GameVault", device);
  const pubName = content.publisherName || "GameVault";

  return (
    <article className="min-h-[1400px] font-sans" style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #0f1628 50%, #0d0d1a 100%)", color: "#e2e8f0" }}>
      {/* Neon header */}
      <header className="border-b sticky top-0 z-20 backdrop-blur-md" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(13,13,26,0.95)" }}>
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black" style={{ background: "linear-gradient(to right, #34d399, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pubName}</div>
          {!isMobile && (
            <nav className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
              {["Store", "Library", "Community", "Tournaments", "News", "Support"].map((n) => (
                <a key={n} href="#" className="hover:text-white transition">{n}</a>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-3">
            <button className="text-xs font-bold px-3 py-1.5 rounded-lg border transition" style={{ borderColor: "rgba(52,211,153,0.3)", color: "#34d399" }}>Sign In</button>
            <button className="text-xs font-bold px-3 py-1.5 rounded-lg text-black" style={{ background: "linear-gradient(to right, #34d399, #06b6d4)" }}>Play Free</button>
          </div>
        </div>
        {/* Banner ad */}
        <div className="border-t px-4 py-2 md:px-8" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl">
            <p className="text-[9px] uppercase tracking-widest text-center mb-1" style={{ color: "#34d399" }}>Sponsored</p>
            <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
          </div>
        </div>
      </header>

      {/* Leaderboard */}
      <section className="border-b px-4 py-4 md:px-8" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Hero featured game */}
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900/60 to-teal-900/40 border" style={{ borderColor: "rgba(52,211,153,0.2)" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-700/10" />
          <div className={`relative p-6 ${isMobile ? "" : "grid grid-cols-[1fr_300px] gap-6"} items-center`}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Featured Game</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-3">{GAMES[0].name}</h2>
              <p className="text-sm text-slate-400 mb-2">{GAMES[0].genre}</p>
              <p className="text-emerald-400 text-sm font-semibold mb-5">{GAMES[0].players}</p>
              <div className="flex gap-3 flex-wrap">
                <button className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black px-6 py-3 rounded-xl transition">Play Now. Free</button>
                <button className="border border-white/20 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition">Watch Trailer</button>
              </div>
            </div>
            <div className="h-48 rounded-xl bg-gradient-to-br from-emerald-600/40 to-teal-700/40 flex items-center justify-center mt-4 md:mt-0">
              <p className="text-slate-500 text-sm">Game Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className={`mx-auto max-w-6xl px-4 pb-6 md:px-8 ${isMobile ? "space-y-5" : "grid grid-cols-[1fr_260px] gap-6"}`}>
        <main className="space-y-6">
          {/* Game cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Popular Games</h3>
              <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition">View all →</a>
            </div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
              {GAMES.slice(0, 3).map((g) => (
                <div key={g.name} className="rounded-xl overflow-hidden border cursor-pointer group transition hover:border-emerald-500/40" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                  <div className={`h-32 bg-gradient-to-br ${g.gradient} relative`}>
                    <span className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded ${g.tagColor}`}>{g.tag}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{g.genre}</p>
                    <p className="text-sm font-bold text-white">{g.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{g.players}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-400 text-xs">★</span>
                      <span className="text-xs text-slate-400">{g.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inline ad */}
          <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
            <p className="text-[9px] uppercase tracking-widest text-center mb-2" style={{ color: "#34d399" }}>Rewarded Ad</p>
            <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
            {GAMES.slice(3).map((g) => (
              <div key={g.name} className="rounded-xl overflow-hidden border cursor-pointer group transition hover:border-emerald-500/40" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                <div className={`h-32 bg-gradient-to-br ${g.gradient} relative`}>
                  <span className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded ${g.tagColor}`}>{g.tag}</span>
                </div>
                <div className="p-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{g.genre}</p>
                  <p className="text-sm font-bold text-white">{g.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{g.players}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-xs text-slate-400">{g.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Native ad — in-game reward promo */}
          <div className="rounded-2xl overflow-hidden border grid md:grid-cols-2" style={{ borderColor: "rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.05)" }}>
            <div className="p-5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Sponsored · In-Game Offer</span>
              <h3 className="text-xl font-black text-white mt-2 mb-2">Unlock the Battle Pass</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Get 1,500 coins, 3 exclusive skins, and unlimited season access. Limited time deal.</p>
              <button className="mt-4 text-black text-xs font-black px-5 py-2.5 rounded-xl transition" style={{ background: "linear-gradient(to right, #34d399, #06b6d4)" }}>Claim Offer</button>
            </div>
            <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
          </div>
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="space-y-5 self-start sticky top-[100px]">
            <div className="rounded-2xl p-4 border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Live Tournaments</h4>
              {TOURNAMENTS.map((t) => (
                <div key={t.name} className="py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status === "LIVE" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}>{t.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{t.game} · {t.prize} prize</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-center mb-1" style={{ color: "#34d399" }}>Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
            <div className="rounded-2xl p-4 border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Your Stats</h4>
              {[{ label: "Matches Played", val: "248" }, { label: "Win Rate", val: "61%" }, { label: "Hours", val: "1,204" }, { label: "Rank", val: "Diamond" }].map((s) => (
                <div key={s.label} className="flex justify-between py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="text-xs font-bold text-emerald-400">{s.val}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      <footer className="border-t px-4 py-6 md:px-8 mt-2" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.4)" }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-black text-xl" style={{ background: "linear-gradient(to right, #34d399, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pubName}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            {["Terms", "Privacy", "DMCA", "Advertise", "Support", "Careers"].map((l) => <a key={l} href="#" className="hover:text-slate-400 transition">{l}</a>)}
          </div>
          <p className="text-xs text-slate-700">© 2026 {pubName}</p>
        </div>
      </footer>
    </article>
  );
}