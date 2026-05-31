"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const MATCHES = [
  { home: "Manchester City", away: "Arsenal", homeScore: 2, awayScore: 1, status: "LIVE 74'", league: "Premier League", homeColor: "bg-sky-500", awayColor: "bg-red-500" },
  { home: "Real Madrid", away: "Bayern Munich", homeScore: 3, awayScore: 2, status: "FT", league: "UEFA Champions League", homeColor: "bg-white", awayColor: "bg-red-600" },
  { home: "Lakers", away: "Celtics", homeScore: 108, awayScore: 104, status: "Q4 2:14", league: "NBA Playoffs", homeColor: "bg-yellow-500", awayColor: "bg-green-600" },
  { home: "Chiefs", away: "Eagles", homeScore: 24, awayScore: 17, status: "HT", league: "NFL Week 8", homeColor: "bg-red-600", awayColor: "bg-slate-700" },
];

const TOP_SCORERS = [
  { name: "Erling Haaland", club: "Man City", goals: 28, img: "bg-sky-500" },
  { name: "Kylian Mbappé", club: "Real Madrid", goals: 31, img: "bg-blue-600" },
  { name: "Vinicius Jr.", club: "Real Madrid", goals: 22, img: "bg-blue-700" },
];

const HEADLINES = [
  { tag: "Transfer News", title: "Chelsea agree record £180M deal for Brazilian midfielder", time: "15m ago" },
  { tag: "Injury Update", title: "Ronaldo ruled out for 3 weeks with hamstring strain", time: "42m ago" },
  { tag: "Analysis", title: "How Guardiola's high press is dominating European football", time: "1h ago" },
  { tag: "Draft", title: "2026 NFL Draft: Every pick, every trade, full first-round recap", time: "2h ago" },
];

export default function SportsEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "SportsPulse", device);
  const pubName = content.publisherName || "SportsPulse";

  return (
    <article className="min-h-[1400px] bg-slate-900 text-white font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-white/10 sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black text-white">
            <span className="text-red-500">{pubName.slice(0, 6)}</span>{pubName.slice(6)}
          </div>
          {!isMobile && (
            <nav className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {["Scores", "Football", "Basketball", "NFL", "Tennis", "Formula 1", "Fantasy"].map((n) => (
                <a key={n} href="#" className="hover:text-white transition">{n}</a>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
        {/* Ticker */}
        <div className="bg-red-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center gap-3 overflow-hidden">
          <span className="bg-white text-red-600 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shrink-0">Live Scores</span>
          <span className="truncate">Man City 2–1 Arsenal (74') · Real Madrid 3–2 Bayern (FT) · Lakers 108–104 Celtics (Q4) · Chiefs 24–17 Eagles (HT)</span>
        </div>
      </header>

      {/* Banner ad */}
      <section className="bg-slate-950 border-b border-white/10 px-4 py-3 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center mb-1">Sponsored</p>
          <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Leaderboard */}
      <section className="border-b border-white/10 px-4 py-4 md:px-8 bg-slate-800">
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Main content */}
      <div className={`mx-auto max-w-6xl px-4 py-5 md:px-8 ${isMobile ? "space-y-5" : "grid grid-cols-[1fr_280px] gap-6"}`}>
        <main className="space-y-5">
          {/* Featured match */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live Now</span>
              <span className="text-slate-500 text-xs">· {MATCHES[0].league}</span>
            </div>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${MATCHES[0].homeColor} mx-auto mb-2 flex items-center justify-center text-slate-900 font-black text-xs`}>HC</div>
                <p className="text-sm font-bold text-white">{MATCHES[0].home}</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-black text-white">{MATCHES[0].homeScore}<span className="text-slate-500 mx-2">—</span>{MATCHES[0].awayScore}</p>
                <div className="mt-2 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
                  <p className="text-red-400 text-xs font-bold">{MATCHES[0].status}</p>
                </div>
              </div>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${MATCHES[0].awayColor} mx-auto mb-2 flex items-center justify-center text-white font-black text-xs`}>AC</div>
                <p className="text-sm font-bold text-white">{MATCHES[0].away}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 border-t border-white/10 pt-4 text-center">
              <div><p className="text-lg font-black text-white">68%</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Possession</p></div>
              <div><p className="text-lg font-black text-white">14–8</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">Shots</p></div>
              <div><p className="text-lg font-black text-white">5–3</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">On Target</p></div>
            </div>
          </div>

          {/* Other match cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {MATCHES.slice(1).map((m) => (
              <div key={`${m.home}-${m.away}`} className="bg-slate-800 border border-white/10 rounded-xl p-4 hover:border-white/20 transition cursor-pointer">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">{m.league}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white truncate">{m.home}</p>
                  <p className="text-base font-black text-white whitespace-nowrap">{m.homeScore}–{m.awayScore}</p>
                  <p className="text-xs font-semibold text-slate-400 truncate text-right">{m.away}</p>
                </div>
                <div className={`mt-2 text-center text-[9px] font-bold uppercase tracking-wider ${m.status === "FT" ? "text-slate-500" : "text-amber-400"}`}>{m.status}</div>
              </div>
            ))}
          </div>

          {/* Inline ad */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 text-center">Sponsored</p>
            <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
          </div>

          {/* News headlines */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">Latest Headlines</h3>
            {HEADLINES.map((h) => (
              <div key={h.title} className="flex items-start gap-3 py-2 border-b border-white/5 hover:bg-white/5 rounded px-2 cursor-pointer transition">
                <span className="bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5">{h.tag}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white leading-snug">{h.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{h.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Native feed slot */}
          <div className="grid md:grid-cols-2 gap-4 bg-slate-800 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Sponsored</span>
              <h3 className="text-lg font-black text-white mt-2 mb-2">Fantasy Sports Draft Kit 2026</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Expert picks, live projections, and draft tools for all major leagues. Get the edge this season.</p>
              <button className="mt-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition">Get Draft Kit</button>
            </div>
            <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
          </div>
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="space-y-5 self-start sticky top-[88px]">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-white/10 pb-2">Top Scorers</h4>
              {TOP_SCORERS.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 py-2 border-b border-white/5">
                  <span className="text-xl font-black text-slate-700">{i + 1}</span>
                  <div className={`w-8 h-8 rounded-full ${p.img}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.club}</p>
                  </div>
                  <span className="text-sm font-black text-amber-400">{p.goals}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>

            <div className="bg-slate-800 border border-white/10 rounded-2xl p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Today's Schedule</h4>
              {[{ time: "18:30", match: "Barcelona vs Atlético" }, { time: "20:45", match: "PSG vs Juventus" }, { time: "21:00", match: "Warriors vs Heat" }].map((s) => (
                <div key={s.match} className="flex items-center gap-3 py-1.5 border-b border-white/5">
                  <span className="text-[11px] font-mono text-amber-400 shrink-0">{s.time}</span>
                  <p className="text-xs text-slate-300">{s.match}</p>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      <footer className="bg-slate-950 border-t border-white/10 px-4 py-6 md:px-8 mt-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-black text-white text-xl"><span className="text-red-500">{pubName.slice(0, 6)}</span>{pubName.slice(6)}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {["About", "Advertise", "Privacy", "Terms", "RSS", "Careers"].map((l) => <a key={l} href="#" className="hover:text-white transition">{l}</a>)}
          </div>
          <p className="text-xs text-slate-600">© 2026 {pubName}</p>
        </div>
      </footer>
    </article>
  );
}