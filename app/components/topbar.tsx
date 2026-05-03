"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Preview generated", desc: "Your Ecommerce preview is ready.", time: "2m ago", unread: true },
  { id: 2, title: "Export complete",   desc: "PPTX downloaded successfully.",   time: "1h ago", unread: true },
];

export default function Topbar({ user }: any) {
  const [showNotif, setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const dropdownVariants = {
    hidden:  { opacity: 0, y: -8, scale: 0.97 },
    visible: { opacity: 1, y: 0,  scale: 1 },
  };

  return (
    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#050816]/80 backdrop-blur-xl shrink-0 gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search campaigns, creatives..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowNotif((v) => !v); setShowProfile(false); }}
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <Bell size={17} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {MOCK_NOTIFICATIONS.filter((n) => n.unread).length}
            </span>
          </motion.button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden"
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-72 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  <span className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">Mark all read</span>
                </div>
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${n.unread ? "bg-purple-500/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {n.unread && <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{n.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{n.desc}</p>
                      </div>
                      <span className="text-[10px] text-white/25 shrink-0">{n.time}</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-white/30">No more notifications</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowProfile((v) => !v); setShowNotif(false); }}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/8 hover:border-white/20 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-white/30 leading-tight">
                {user?.email?.split("@")[1] ? `@${user.email.split("@")[1]}` : "Admin"}
              </p>
            </div>
            <ChevronDown size={14} className="text-white/30 hidden sm:block" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden"
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-52 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
                </div>
                {[
                  { icon: User,     label: "Profile",  action: () => {} },
                  { icon: Settings, label: "Settings", action: () => router.push("/settings") },
                ].map((item) => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white/60 hover:text-white transition text-sm">
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-white/10">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition text-sm">
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
