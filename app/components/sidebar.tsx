"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard, PlusSquare, FolderOpen, Download, Settings,
  Eye, Brain, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       href: "/dashboard" },
      { icon: PlusSquare,      label: "Create Template",  href: "/preview",    badge: "NEW" },
      { icon: FolderOpen,      label: "My Projects",      href: "/projects" },
      { icon: Download,        label: "Downloads",        href: "/downloads" },
      { icon: Settings,        label: "Settings",         href: "/settings" },
    ],
  },
  {
    label: "Tools",
    items: [
      { icon: Eye,   label: "Preview Studio",  href: "/preview",      badge: "CORE" },
      { icon: Brain, label: "Ad Intelligence", href: "/intelligence",  badge: "CORE" },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed, user }: any) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <motion.div
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen bg-[#050816] border-r border-white/10 flex flex-col shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 justify-between shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white shrink-0">A</div>
              <span className="font-extrabold text-white text-lg tracking-tight">Adigator</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition shrink-0 ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 mt-1 overflow-y-auto scrollbar-none">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[10px] text-white/25 uppercase tracking-widest px-3 mb-2 font-bold">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href + item.label} href={item.href}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                        active
                          ? "bg-gradient-to-r from-purple-600/30 to-blue-600/20 text-white border border-purple-500/30"
                          : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-400 to-blue-400 rounded-r-full" />
                      )}
                      <Icon size={18} className="shrink-0" />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium flex-1 truncate whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${
                          item.badge === "CORE"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : "bg-green-500/20 text-green-300 border-green-500/30"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {/* Tooltip on collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                          {item.label}
                        </div>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/10 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-white/30 truncate">{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="text-white/30 hover:text-red-400 transition">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Logout"
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-white/30 hover:text-red-400 transition">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
}