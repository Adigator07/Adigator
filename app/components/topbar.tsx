"use client";
import { useState, useRef, useEffect } from "react";

const NOTIFICATIONS = [
  { id: 1, icon: "🚀", title: "Campaign Live", desc: "Summer Sale is now active", time: "2m ago", unread: true },
  { id: 2, icon: "📈", title: "CTR Spike", desc: "Creative #4 up 34% this hour", time: "18m ago", unread: true },
  { id: 3, icon: "⚠️", title: "Budget Alert", desc: "Campaign budget at 80%", time: "1h ago", unread: false },
  { id: 4, icon: "✅", title: "Export Ready", desc: "Your report has been generated", time: "3h ago", unread: false },
];

export default function Topbar({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-15 flex items-center justify-between px-4 lg:px-6 border-b border-white/6 shrink-0"
      style={{ background: "rgba(7,7,20,0.9)", backdropFilter: "blur(12px)" }}>

      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="lg:hidden text-white/40 hover:text-white/80 transition-colors"
        >
          ☰
        </button>
        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns, creatives..."
            className="w-64 lg:w-80 bg-white/6 border border-white/8 rounded-xl
              pl-9 pr-4 py-2 text-sm text-white/70 placeholder-white/20
              focus:outline-none focus:border-violet-500/50 focus:bg-white/8
              transition-all duration-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          {search && (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20 
              bg-white/6 px-1.5 py-0.5 rounded border border-white/8">
              ⏎
            </kbd>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Date range quick pill */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
          <span className="text-xs text-white/30">📅</span>
          <span className="text-xs text-white/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>Last 30 days</span>
          <span className="text-xs text-white/20 ml-1">▾</span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            text-white/30 hover:text-white/70 hover:bg-white/6
            transition-all duration-200 text-sm"
          title="Toggle theme"
        >
          {darkMode ? "☀" : "☾"}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-white/30 hover:text-white/70 hover:bg-white/6
              transition-all duration-200 relative"
          >
            🔔
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full
                flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/8 overflow-hidden z-50"
              style={{ background: "rgba(10,10,26,0.98)", backdropFilter: "blur(20px)" }}>
              <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                <span className="text-sm font-semibold text-white/80">Notifications</span>
                <span className="text-xs text-violet-400 cursor-pointer hover:text-violet-300">Mark all read</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div key={n.id}
                    className={`px-4 py-3 flex gap-3 hover:bg-white/4 cursor-pointer transition-colors
                      ${n.unread ? "border-l-2 border-violet-500" : "border-l-2 border-transparent"}`}>
                    <span className="text-lg shrink-0">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80">{n.title}</p>
                      <p className="text-xs text-white/40 truncate">{n.desc}</p>
                    </div>
                    <span className="text-[10px] text-white/25 shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-white/6 text-center">
                <span className="text-xs text-violet-400 cursor-pointer hover:text-violet-300">View all</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/6 transition-all"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              AK
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-white/80 leading-none">Aditya</p>
              <p className="text-[10px] text-white/30">Admin</p>
            </div>
            <span className="text-white/20 text-xs hidden md:block">▾</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/8 overflow-hidden z-50"
              style={{ background: "rgba(10,10,26,0.98)", backdropFilter: "blur(20px)" }}>
              <div className="px-4 py-3 border-b border-white/6">
                <p className="text-sm font-semibold text-white/80">Aditya Kumar</p>
                <p className="text-xs text-white/35">aditya@adigator.io</p>
              </div>
              {[
                { icon: "👤", label: "Profile" },
                { icon: "⚙", label: "Settings" },
                { icon: "💳", label: "Billing" },
                { icon: "📊", label: "Usage" },
              ].map((item) => (
                <button key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/50
                    hover:text-white/80 hover:bg-white/4 transition-colors text-left">
                  <span>{item.icon}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
                </button>
              ))}
              <div className="border-t border-white/6">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/70
                  hover:text-red-400 hover:bg-red-500/6 transition-colors text-left">
                  <span>⎋</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif" }}>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
