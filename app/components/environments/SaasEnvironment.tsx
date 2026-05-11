"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const SAAS_KPI = [
  { label: "Monthly Recurring Revenue", value: "$284,912", change: "+18.4%", up: true, icon: "💰" },
  { label: "Active Users", value: "14,832", change: "+9.1%", up: true, icon: "👥" },
  { label: "Churn Rate", value: "1.8%", change: "-0.4%", up: true, icon: "📉" },
  { label: "Avg. Session", value: "24m 36s", change: "+3.2%", up: true, icon: "⏱" },
];

const RECENT_SIGNUPS = [
  { company: "Acme Corp", plan: "Growth", seats: 45, joined: "2 hours ago", avatar: "bg-violet-500" },
  { company: "Horizon Labs", plan: "Enterprise", seats: 200, joined: "5 hours ago", avatar: "bg-blue-500" },
  { company: "Pixel Studio", plan: "Starter", seats: 8, joined: "Yesterday", avatar: "bg-pink-500" },
  { company: "DataFlow Inc", plan: "Growth", seats: 62, joined: "Yesterday", avatar: "bg-emerald-500" },
];

const NAV_ITEMS = [
  { icon: "📊", label: "Overview", active: true },
  { icon: "📈", label: "Analytics", active: false },
  { icon: "👥", label: "Users", active: false },
  { icon: "💳", label: "Billing", active: false },
  { icon: "🔗", label: "Integrations", active: false },
  { icon: "📣", label: "Marketing", active: false },
  { icon: "🤝", label: "Partnerships", active: false },
  { icon: "📝", label: "Content", active: false },
  { icon: "⚙️", label: "Settings", active: false },
];

export default function SaasEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "LaunchPad", device);
  const pubName = content.publisherName || "LaunchPad";

  return (
    <article className="min-h-[1400px] bg-slate-950 text-white font-sans">
      <div className={isMobile ? "" : "flex min-h-screen"}>
        {/* Left sidebar */}
        {!isMobile && (
          <nav className="w-56 bg-slate-900 border-r border-white/10 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-black">{pubName[0]}</div>
                <div>
                  <p className="text-sm font-black text-white">{pubName}</p>
                  <p className="text-[10px] text-slate-500">Admin Dashboard</p>
                </div>
              </div>
            </div>
            <div className="p-2 flex-1">
              <p className="text-[9px] uppercase tracking-widest text-slate-600 px-3 py-2">Main Menu</p>
              {NAV_ITEMS.map((item) => (
                <a key={item.label} href="#" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-sm transition ${item.active ? "bg-violet-500/20 text-violet-300 font-semibold" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                  <span>{item.icon}</span>{item.label}
                </a>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 px-2 py-2">
                <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold">A</div>
                <div>
                  <p className="text-xs font-semibold text-white">Alex Rivera</p>
                  <p className="text-[10px] text-slate-500">admin@launchpad.io</p>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
            <div>
              <h1 className="text-base font-black text-white">Dashboard Overview</h1>
              <p className="text-[11px] text-slate-500">Week of May 11, 2026</p>
            </div>
            {!isMobile && (
              <input type="text" placeholder="Search users, events, integrations..." className="flex-1 max-w-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none" />
            )}
            <div className="flex items-center gap-3">
              <button className="text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition">+ Invite Team</button>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">🔔</button>
            </div>
          </header>

          {/* Banner ad */}
          <section className="bg-slate-950 border-b border-white/10 px-5 py-3">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 text-center">Sponsored</p>
            <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
          </section>

          {/* Leaderboard */}
          <section className="bg-slate-900/40 border-b border-white/10 px-5 py-4">
            <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="cover" className="mx-auto" />
          </section>

          <main className="px-5 py-5 space-y-6 flex-1">
            {/* KPI row */}
            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
              {SAAS_KPI.map((k) => (
                <div key={k.label} className="bg-slate-900 border border-white/10 rounded-2xl p-4 hover:border-violet-500/20 transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{k.label}</p>
                    <span className="text-base">{k.icon}</span>
                  </div>
                  <p className="text-2xl font-black text-white">{k.value}</p>
                  <span className={`text-xs font-bold ${k.up ? "text-green-400" : "text-red-400"}`}>{k.change} <span className="text-slate-600 font-normal">vs last month</span></span>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className={`grid gap-5 ${isMobile ? "" : "grid-cols-[1.6fr_1fr]"}`}>
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Revenue Growth</h3>
                  <select className="bg-white/5 border border-white/10 rounded text-xs text-slate-400 px-2 py-1">
                    <option>Last 12 months</option>
                    <option>Last 30 days</option>
                  </select>
                </div>
                <div className="h-44 bg-slate-950/50 rounded-xl flex items-end px-3 pb-3 gap-1">
                  {[30, 42, 38, 55, 48, 67, 61, 75, 70, 84, 79, 94].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-indigo-400" style={{ height: `${h}%`, opacity: 0.7 + (i / 12) * 0.3 }} />
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Plan Distribution</h3>
                <div className="space-y-3">
                  {[{ label: "Enterprise", pct: 38, color: "bg-violet-500" }, { label: "Growth", pct: 45, color: "bg-indigo-500" }, { label: "Starter", pct: 17, color: "bg-slate-500" }].map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{p.label}</span>
                        <span className="font-bold text-white">{p.pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inline ad */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 text-center">Sponsored · SaaS Tools</p>
              <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
            </div>

            {/* Recent signups + native ad */}
            <div className={`grid gap-5 ${isMobile ? "" : "grid-cols-[1fr_280px]"}`}>
              <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Recent Sign-Ups</h3>
                  <button className="text-xs text-violet-400 hover:text-violet-300 transition">View all →</button>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">Company</th>
                      <th className="px-5 py-3 text-left">Plan</th>
                      {!isMobile && <th className="px-5 py-3 text-left">Seats</th>}
                      <th className="px-5 py-3 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_SIGNUPS.map((r) => (
                      <tr key={r.company} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${r.avatar} flex items-center justify-center text-[10px] font-black text-white`}>{r.company[0]}</div>
                            <span className="font-semibold text-white">{r.company}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3"><span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{r.plan}</span></td>
                        {!isMobile && <td className="px-5 py-3 text-slate-400">{r.seats}</td>}
                        <td className="px-5 py-3 text-slate-500">{r.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900 border border-violet-500/20 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">Sponsored</span>
                  <h3 className="text-base font-black text-white mt-2 mb-2">Scale Your SaaS Faster</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Automate onboarding, reduce churn, and grow MRR with AI-powered engagement tools.</p>
                  <button className="mt-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">Start Free Trial</button>
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
                {["Docs", "Status", "Changelog", "Privacy", "Terms", "Support"].map((l) => <a key={l} href="#" className="hover:text-white transition">{l}</a>)}
              </div>
              <p className="text-[10px] text-slate-700">© 2026 {pubName}, Inc.</p>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}