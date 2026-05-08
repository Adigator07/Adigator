"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

const KPI_CARDS = [
  { label: "Monthly Active Users", value: "124,482", change: "+8.3%", up: true, icon: "👥" },
  { label: "Conversion Rate", value: "4.87%", change: "+0.52%", up: true, icon: "📈" },
  { label: "Avg. Session Duration", value: "7m 42s", change: "-0.3%", up: false, icon: "⏱️" },
  { label: "Revenue (MTD)", value: "$284,932", change: "+12.1%", up: true, icon: "💰" },
];

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 600);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">Sponsored</span>
        <span className="text-[9px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-700/50" style={{ width: maxW, height: dispH }}>
        <img src={creativeUrl} alt="Sponsored" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

export default function SaasEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const publisher = content.publisherName ?? "WorkOS Platform";
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Q2 Campaign Performance Summary";
  const isMobile = device === "mobile";

  return (
    <div className="bg-slate-950 font-sans min-h-screen border border-slate-700/50 rounded-xl overflow-hidden shadow-xl text-white">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-lg font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{publisher}</div>
            {!isMobile && (
              <nav className="flex items-center gap-1 text-sm">
                {["Dashboard", "Analytics", "Campaigns", "Creatives", "Reports"].map((n, i) => (
                  <span key={n} className={`px-3 py-1.5 rounded-lg cursor-pointer ${i === 0 ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"} transition text-xs`}>
                    {n}
                  </span>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm font-bold cursor-pointer">A</div>
          </div>
        </div>
      </header>

      <div className={`${isMobile ? "px-4 py-4" : "flex"}`}>
        {/* Left sidebar */}
        {!isMobile && (
          <aside className="w-48 flex-shrink-0 border-r border-slate-800 min-h-screen p-4 space-y-1">
            {[
              ["📊", "Overview"],
              ["📈", "Performance"],
              ["🎯", "Campaigns"],
              ["🖼️", "Creative Studio"],
              ["⚙️", "Settings"],
            ].map(([icon, label], i) => (
              <div key={label} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm ${i === 3 ? "bg-violet-600/20 text-violet-300 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"} transition`}>
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </aside>
        )}

        {/* Main dashboard */}
        <main className={isMobile ? "w-full" : "flex-1 min-w-0 p-6"}>
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black text-white">{headline}</h1>
              <p className="text-sm text-slate-400 mt-0.5">May 1–9, 2026 · Auto-refreshed 2 min ago</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition">Export</button>
              <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-white transition">+ New Campaign</button>
            </div>
          </div>

          {/* KPI grid */}
          <div className={`grid gap-4 mb-6 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
            {KPI_CARDS.map((kpi) => (
              <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider leading-snug">{kpi.label}</span>
                  <span className="text-lg">{kpi.icon}</span>
                </div>
                <p className="text-2xl font-black text-white">{kpi.value}</p>
                <p className={`text-xs font-semibold mt-1 ${kpi.up ? "text-green-400" : "text-red-400"}`}>{kpi.change} vs last period</p>
              </div>
            ))}
          </div>

          {/* Dashboard module ad slot */}
          {slotType === "dashboard-module" && (
            <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/20 border-2 border-violet-500/40 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Sponsored Feature</p>
                  <p className="text-sm text-slate-300 mt-0.5">Recommended tool for your workflow</p>
                </div>
                <span className="text-xs text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded">{creativeSize}</span>
              </div>
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}

          {/* Leaderboard */}
          {slotType === "leaderboard" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}

          {/* Chart area */}
          <div className={`grid gap-4 mb-6 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Impressions & Clicks — Last 7 Days</p>
              <div className="flex items-end gap-1 h-24">
                {[65, 80, 55, 90, 75, 95, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-violet-600/80 rounded-t" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Top Performing</p>
              <div className="space-y-2">
                {["Banner 300×250", "Leaderboard 728×90", "Video Pre-roll", "Native Article"].map((item, i) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${[88, 72, 64, 51][i]}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 w-8 text-right">{[88, 72, 64, 51][i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inline ad */}
          {(slotType === "inline" || slotType === "sidebar") && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
