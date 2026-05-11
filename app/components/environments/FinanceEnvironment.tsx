"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const KPI_CARDS = [
  { label: "Portfolio Value", value: "$248,391", change: "+2.4%", up: true, sub: "vs. last month" },
  { label: "Day Gain/Loss", value: "+$1,847", change: "+0.75%", up: true, sub: "Today's performance" },
  { label: "Dividend Income", value: "$3,204", change: "+12.1%", up: true, sub: "Year to date" },
  { label: "Risk Score", value: "Medium", change: "Stable", up: true, sub: "Balanced allocation" },
];

const HOLDINGS = [
  { ticker: "AAPL", name: "Apple Inc.", price: "$194.38", change: "+1.2%", up: true, shares: 50, value: "$9,719" },
  { ticker: "MSFT", name: "Microsoft Corp.", price: "$412.71", change: "+0.8%", up: true, shares: 20, value: "$8,254" },
  { ticker: "GOOGL", name: "Alphabet Inc.", price: "$178.42", change: "-0.3%", up: false, shares: 30, value: "$5,353" },
  { ticker: "NVDA", name: "NVIDIA Corp.", price: "$892.14", change: "+3.1%", up: true, shares: 10, value: "$8,921" },
  { ticker: "TSLA", name: "Tesla Inc.", price: "$241.06", change: "-1.4%", up: false, shares: 25, value: "$6,027" },
];

const MARKET_NEWS = [
  { tag: "Fed", headline: "Federal Reserve holds rates steady, signals one cut before year-end", time: "10m" },
  { tag: "Earnings", headline: "NVIDIA posts record Q1 revenue, beats estimates by 18%", time: "45m" },
  { tag: "Crypto", headline: "Bitcoin surges past $95K as institutional buying accelerates", time: "1h" },
  { tag: "IPO", headline: "Anthropic files for $40B IPO — largest AI listing in history", time: "2h" },
];

export default function FinanceEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "WealthTrack", device);
  const pubName = content.publisherName || "WealthTrack";

  return (
    <article className="min-h-[1400px] bg-slate-950 text-white font-sans">
      {/* Dashboard layout: sidebar nav + main */}
      <div className={isMobile ? "" : "flex min-h-screen"}>
        {/* Left sidebar nav */}
        {!isMobile && (
          <nav className="w-60 bg-slate-900 border-r border-white/10 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
            <div className="p-5 border-b border-white/10">
              <p className="text-xl font-black text-white">{pubName}</p>
              <p className="text-[10px] text-sky-400 font-semibold mt-0.5">Smart Portfolio</p>
            </div>
            <div className="p-3 flex-1">
              {[
                { icon: "📊", label: "Dashboard", active: true },
                { icon: "💼", label: "Portfolio", active: false },
                { icon: "📈", label: "Markets", active: false },
                { icon: "🔔", label: "Alerts", active: false },
                { icon: "📰", label: "News Feed", active: false },
                { icon: "🧾", label: "Tax Center", active: false },
                { icon: "⚙️", label: "Settings", active: false },
              ].map((item) => (
                <a key={item.label} href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition ${item.active ? "bg-sky-500/20 text-sky-300 font-semibold" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                  <span>{item.icon}</span>{item.label}
                </a>
              ))}
            </div>
            {/* Sidebar ad */}
            <div className="p-3 border-t border-white/10">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
          </nav>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
            <div>
              <p className="text-sm font-bold text-white">Good morning, Alex 👋</p>
              <p className="text-[11px] text-slate-500">Monday, May 11, 2026 · Market Open</p>
            </div>
            {!isMobile && (
              <div className="flex-1 max-w-xs">
                <input type="text" placeholder="Search stocks, ETFs, crypto..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400 font-semibold">Markets Open</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold">A</div>
            </div>
          </header>

          {/* Banner ad */}
          <section className="bg-slate-950 border-b border-white/10 px-5 py-3">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 text-center">Sponsored</p>
            <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
          </section>

          {/* Leaderboard */}
          <section className="bg-slate-900/50 border-b border-white/10 px-5 py-4">
            <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="cover" className="mx-auto" />
          </section>

          <main className="flex-1 px-5 py-5 space-y-6">
            {/* KPI cards */}
            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
              {KPI_CARDS.map((k) => (
                <div key={k.label} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{k.label}</p>
                  <p className="text-2xl font-black text-white">{k.value}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-bold ${k.up ? "text-green-400" : "text-red-400"}`}>{k.change}</span>
                    <span className="text-[10px] text-slate-600">{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Portfolio Performance</h3>
                <div className="flex gap-2">
                  {["1W", "1M", "3M", "6M", "1Y", "All"].map((t) => (
                    <button key={t} className={`text-[11px] px-2 py-1 rounded ${t === "1M" ? "bg-sky-500 text-white font-bold" : "text-slate-500 hover:text-white"}`}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Simulated chart */}
              <div className="h-48 bg-gradient-to-br from-sky-950/30 to-slate-950 rounded-xl flex items-end px-4 pb-4 gap-1">
                {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `rgba(14,165,233,${0.3 + (i / 12) * 0.7})` }} />
                ))}
              </div>
            </div>

            {/* Inline ad */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 text-center">Sponsored · Financial Product</p>
              <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
            </div>

            {/* Holdings table */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Your Holdings</h3>
                <button className="text-xs text-sky-400 hover:text-sky-300 transition">Manage →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Symbol</th>
                      {!isMobile && <th className="px-5 py-3 text-left">Name</th>}
                      <th className="px-5 py-3 text-right">Price</th>
                      <th className="px-5 py-3 text-right">Change</th>
                      {!isMobile && <th className="px-5 py-3 text-right">Shares</th>}
                      <th className="px-5 py-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HOLDINGS.map((h) => (
                      <tr key={h.ticker} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer">
                        <td className="px-5 py-3"><span className="font-black text-white">{h.ticker}</span></td>
                        {!isMobile && <td className="px-5 py-3 text-slate-400">{h.name}</td>}
                        <td className="px-5 py-3 text-right font-semibold text-white">{h.price}</td>
                        <td className={`px-5 py-3 text-right font-bold ${h.up ? "text-green-400" : "text-red-400"}`}>{h.change}</td>
                        {!isMobile && <td className="px-5 py-3 text-right text-slate-400">{h.shares}</td>}
                        <td className="px-5 py-3 text-right font-semibold text-white">{h.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Market news + native ad */}
            <div className={`grid gap-5 ${isMobile ? "" : "grid-cols-[1fr_300px]"}`}>
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Market News</h3>
                {MARKET_NEWS.map((n) => (
                  <div key={n.headline} className="flex items-start gap-3 py-2.5 border-b border-white/5 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition">
                    <span className="bg-sky-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5">{n.tag}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white leading-snug">{n.headline}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{n.time} ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900 border border-sky-500/20 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">Sponsored</span>
                  <h3 className="text-base font-black text-white mt-2 mb-2">Premium Research Reports</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Analyst-grade insights on top 500 stocks. Daily briefings. Earnings previews.</p>
                </div>
                <div className="flex-1">
                  <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="cover" className="mx-auto" />
                </div>
              </div>
            </div>
          </main>

          <footer className="bg-slate-900 border-t border-white/10 px-5 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">{pubName}</p>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                {["Disclosures", "Privacy", "Terms", "FINRA", "SIPC", "Support"].map((l) => <a key={l} href="#" className="hover:text-white transition">{l}</a>)}
              </div>
              <p className="text-[10px] text-slate-700">Not financial advice. © 2026 {pubName}</p>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}