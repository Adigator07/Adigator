"use client";
import { useState } from "react";

export default function Topbar({ user }: any) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#050816] shrink-0">
      <input type="text" placeholder="Search campaigns, creatives..." className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 w-80 focus:outline-none focus:border-purple-500 transition" />
      <div className="flex items-center gap-4">
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition">
          🔔
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">2</span>
        </button>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}</p>
            <p className="text-[10px] text-white/30 leading-tight">{user?.email?.split("@")[1] ? `@${user.email.split("@")[1]}` : "Admin"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}