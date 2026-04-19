"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const NAV_ITEMS = [
  { icon: "⬡", label: "Dashboard", href: "/dashboard", core: false },
  { icon: "🧠", label: "Intelligence", href: "/intelligence", core: true },
  { icon: "🎨", label: "Preview", href: "/preview", core: true },
  { icon: "◆", label: "Analytics", href: "/analytics", core: false },
  { icon: "◉", label: "Campaigns", href: "/campaigns", core: false },
  { icon: "◇", label: "Audience", href: "/audience", core: false },
];

export default function Sidebar({ collapsed, setCollapsed, user }: any) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className={`${collapsed ? "w-16" : "w-64"} min-h-screen bg-[#050816] border-r border-white/10 flex flex-col transition-all duration-300 shrink-0`}>
      <div className="h-16 flex items-center px-4 border-b border-white/10 justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white">A</div>
            <span className="font-bold text-white text-lg">Adigator</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-white/40 hover:text-white transition ml-auto text-lg">{collapsed ? "→" : "←"}</button>
      </div>

      <nav className="flex-1 p-3 space-y-1 mt-2">
        {!collapsed && <p className="text-xs text-white/30 uppercase tracking-widest px-3 mb-3">Main</p>}
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group
                ${active ? "bg-purple-600/30 text-white border border-purple-500/40"
                  : item.core ? "text-white/80 hover:bg-purple-500/10 hover:text-white border border-transparent hover:border-purple-500/30"
                  : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"}`}>
              <span className="text-base">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.core && <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold">CORE</span>}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-1 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email || ""}</p>
            </div>
            <button onClick={handleLogout} className="text-white/30 hover:text-red-400 transition text-xs" title="Logout">⏻</button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex items-center justify-center py-2.5 rounded-xl text-white/30 hover:text-red-400 transition" title="Logout">⏻</button>
        )}
      </div>
    </div>
  );
}