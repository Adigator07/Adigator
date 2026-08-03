"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "../lib/firebase/client";
import { useAdminAuth } from "../lib/admin-platform/AdminAuthContext";
import { useOrgAuth } from "../lib/organization-platform/OrgAuthContext";
import {
  LayoutDashboard, PlusSquare, FolderOpen, Download, Settings,
  Eye, Brain, LogOut, ChevronLeft, ChevronRight, MessageSquare, Shield, Building2, ShieldCheck
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Strategic Workspace", href: "/dashboard" },
      { icon: MessageSquare,    label: "Communications",     href: "/dashboard/communications", badge: "NEW" },
      { icon: PlusSquare,      label: "Create Template",  href: "/preview",    badge: "NEW" },
      { icon: FolderOpen,      label: "My Projects",      href: "/projects" },
      { icon: Download,        label: "Downloads",        href: "/downloads" },
      { icon: Settings,        label: "Settings",         href: "/settings" },
    ],
  },
  {
    label: "Tools",
    items: [
      { icon: Eye,   label: "Campaign Intelligence Studio",  href: "/preview-tool?step=campaign-setup",      badge: "CORE" },
      { icon: Brain, label: "Ad Intelligence", href: "/intelligence",  badge: "CORE" },
      { icon: ShieldCheck, label: "QA Workspace", href: "/dashboard/qa", badge: "NEW" },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed, user }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAdminAuth();
  const { isOrgAdmin } = useOrgAuth();

  const handleLogout = async () => {
    await signOut(getFirebaseClientAuth());
    router.push("/login");
  };

  return (
    <motion.div
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen border-r border-sky-200/80 bg-white/85 shadow-[8px_0_30px_-18px_rgba(14,116,144,0.22)] backdrop-blur-xl flex flex-col shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sky-100 justify-between shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-cyan-500 font-bold text-sm text-white shadow-lg shadow-sky-500/25 shrink-0">A</div>
              <span className="text-lg font-extrabold tracking-tight text-slate-800">Adigator</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-slate-500 transition hover:bg-sky-100 hover:text-sky-700 shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 mt-1 overflow-y-auto scrollbar-none">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isDashboardHome = item.href === "/dashboard";
                const active = isDashboardHome
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link key={item.href + item.label} href={item.href}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                        active
                          ? "border border-sky-200 bg-linear-to-r from-sky-500/12 to-cyan-500/10 text-sky-800"
                          : "border border-transparent text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-linear-to-b from-purple-400 to-blue-400 rounded-r-full" />
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
                        <div className="absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 transition pointer-events-none group-hover:opacity-100">
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

        {isOrgAdmin && (
          <div>
            {!collapsed && (
              <p className="text-[10px] text-sky-400/50 uppercase tracking-widest px-3 mb-2 font-bold">
                Organization
              </p>
            )}
            <Link href="/dashboard/organization">
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                  pathname.startsWith("/dashboard/organization")
                    ? "border border-sky-200 bg-linear-to-r from-sky-500/12 to-cyan-500/10 text-sky-800"
                    : "border border-transparent text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                }`}
              >
                <Building2 size={18} className="shrink-0 text-sky-400" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium flex-1 truncate whitespace-nowrap overflow-hidden"
                    >
                      Organization Console
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 bg-sky-500/20 text-sky-300 border-sky-500/30">
                    ORG
                  </span>
                )}
              </motion.div>
            </Link>
          </div>
        )}

        {isAdmin && (
          <div>
            {!collapsed && (
              <p className="text-[10px] text-amber-400/50 uppercase tracking-widest px-3 mb-2 font-bold">
                Administration
              </p>
            )}
            <Link href="/dashboard/admin">
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                  pathname.startsWith("/dashboard/admin")
                    ? "border border-amber-200 bg-linear-to-r from-amber-500/12 to-orange-500/10 text-amber-800"
                    : "border border-transparent text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                <Shield size={18} className="shrink-0 text-amber-400" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium flex-1 truncate whitespace-nowrap overflow-hidden"
                    >
                      Super Admin Console
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 bg-amber-500/20 text-amber-300 border-amber-500/30">
                    ADMIN
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                    Super Admin Console
                  </div>
                )}
              </motion.div>
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-sky-100 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="truncate text-[10px] text-slate-500">{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="text-slate-400 transition hover:text-red-500">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Logout"
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-slate-400 transition hover:text-red-500">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
