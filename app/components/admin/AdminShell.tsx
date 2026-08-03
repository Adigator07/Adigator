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
import { signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/app/lib/firebase/client";
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
    await signOut(getFirebaseClientAuth());
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
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
          active
            ? "border-sky-300 bg-sky-100 text-sky-700"
            : "border-transparent text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
        )}
      >
        <Icon size={16} />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_36%),linear-gradient(135deg,#f8fbff_0%,#eef8ff_55%,#f6fbff_100%)] text-slate-800">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sky-200/80 bg-white/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-sky-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Shield className="text-amber-500" size={20} />
          <span className="text-sm font-bold uppercase tracking-widest text-sky-700">Super Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-sky-50"
          >
            <ArrowLeft size={14} /> Back to App
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-sky-200 p-2 text-slate-500 hover:text-red-500"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-30 w-64 transform border-r border-sky-200/80 bg-white/80 p-4 shadow-[0_18px_45px_-24px_rgba(14,116,144,0.25)] backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <nav className="space-y-1">{NAV.map(navLink)}</nav>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-slate-900/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        ) : null}

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
