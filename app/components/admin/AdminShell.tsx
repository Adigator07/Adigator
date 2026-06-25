"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  FileText,
  KeyRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { cn } from "@/app/lib/utils";

const NAV = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/admin/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/admin/permissions", label: "Permissions", icon: KeyRound },
  { href: "/dashboard/admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/dashboard/admin/health", label: "System Health", icon: HeartPulse },
  { href: "/dashboard/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLink = (item: (typeof NAV)[number]) => {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
          active
            ? "bg-amber-500/20 text-amber-100 border border-amber-500/30"
            : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent",
        )}
      >
        <Icon size={16} />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050816]">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-amber-500/20 bg-[#050816]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 text-white/60 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Shield className="text-amber-400" size={20} />
          <span className="text-sm font-bold uppercase tracking-widest text-amber-300">Super Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
          >
            <ArrowLeft size={14} /> Back to App
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/10 p-2 text-white/40 hover:text-red-400"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-30 w-64 transform border-r border-amber-500/20 bg-[#050816] p-4 transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <nav className="space-y-1">{NAV.map(navLink)}</nav>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
