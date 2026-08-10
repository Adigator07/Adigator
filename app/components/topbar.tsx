"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "../lib/firebase/client";
import { getClientProfileData } from "../lib/firestore/clientProfiles";
import { useRouter } from "next/navigation";
import { getRoleLabel } from "../lib/communications/roleLabels";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Preview generated", desc: "Your Ecommerce preview is ready.", time: "2m ago", unread: true },
  { id: 2, title: "Export complete",   desc: "PPTX downloaded successfully.",   time: "1h ago", unread: true },
];

export default function Topbar({ user }: any) {
  const [showNotif, setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [roleLabel, setRoleLabel] = useState("");
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

  useEffect(() => {
    if (!user?.id) {
      setRoleLabel("");
      return;
    }

    const metaRole = user.user_metadata?.role;
    if (metaRole) {
      setRoleLabel(getRoleLabel(metaRole));
    }

    void (async () => {
      const profile = await getClientProfileData<{ role?: string }>(user.id);
      const profileRole = profile?.role;
      if (profileRole) setRoleLabel(getRoleLabel(profileRole));
    })();
  }, [user?.id, user?.user_metadata?.role]);

  const handleLogout = async () => {
    setShowProfile(false);
    try {
      await signOut(getFirebaseClientAuth());
    } catch (error) {
      console.warn("[Topbar] Sign out failed:", error);
    } finally {
      window.location.assign("/login");
    }
  };

  const dropdownVariants = {
    hidden:  { opacity: 0, y: -8, scale: 0.97 },
    visible: { opacity: 1, y: 0,  scale: 1 },
  };
  const emailDomain = user?.email?.split("@")[1] || "";

  return (
    <div className="relative z-50 h-16 shrink-0 border-b border-sky-100 bg-white/92 px-6 flex items-center justify-between gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search campaigns, creatives..."
          className="w-full rounded-xl border border-sky-200 bg-sky-50/80 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 transition focus:border-sky-400 focus:bg-white focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowNotif((v) => !v); setShowProfile(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-white text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
          >
            <Bell size={17} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[9px] font-bold text-white">
              {MOCK_NOTIFICATIONS.filter((n) => n.unread).length}
            </span>
          </motion.button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden"
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl"
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  <span className="cursor-pointer text-xs text-sky-600 hover:text-sky-700">Mark all read</span>
                </div>
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${n.unread ? "bg-purple-500/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {n.unread && <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{n.desc}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 text-center">
                  <span className="text-xs text-slate-400">No more notifications</span>
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
            className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-1.5 transition hover:border-sky-300 hover:bg-sky-50"
          >
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight text-slate-800">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] leading-tight text-slate-500">
                {roleLabel || emailDomain ? `@${emailDomain}` : "Member"}
              </p>
            </div>
              <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden"
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-100 w-52 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-2xl"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                </div>
                {[
                  { icon: User,     label: "Profile",  action: () => {} },
                  { icon: Settings, label: "Settings", action: () => router.push("/settings") },
                ].map((item) => (
                  <button key={item.label} onClick={item.action}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-sky-50 hover:text-sky-700">
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-white/10">
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50 hover:text-red-600">
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
