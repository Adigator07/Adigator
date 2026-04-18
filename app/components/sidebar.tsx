"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "⬡", label: "Dashboard", href: "/dashboard" },
  { icon: "◈", label: "Intelligence", href: "/intelligence" },
  { icon: "◎", label: "Preview", href: "/preview" },
  { icon: "◆", label: "Analytics", href: "/analytics" },
  { icon: "◉", label: "Campaigns", href: "/campaigns" },
  { icon: "◇", label: "Audience", href: "/audience" },
];

const BOTTOM_ITEMS = [
  { icon: "⚙", label: "Settings", href: "/settings" },
  { icon: "?", label: "Help", href: "/help" },
];

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30
          flex flex-col
          transition-all duration-300 ease-in-out
          border-r border-white/6
          ${collapsed ? "w-17.5" : "w-60"}
          lg:relative
        `}
        style={{
          background: "linear-gradient(180deg, #0a0a1a 0%, #070714 100%)",
        }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/6 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            A
          </div>
          {!collapsed && (
            <span className="font-semibold text-white tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Adigator
            </span>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto text-white/30 hover:text-white/70 transition-colors text-lg"
            >
              ‹
            </button>
          )}
        </div>

        {/* Collapse button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mt-2 mx-auto w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all text-lg"
          >
            ›
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-3 pb-2">
              Main
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                    transition-all duration-200 group relative
                    ${active
                      ? "bg-violet-600/20 text-violet-300"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-400" />
                  )}
                  <span className={`text-base shrink-0 ${active ? "text-violet-400" : ""}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.label}
                    </span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 space-y-1 border-t border-white/6 pt-3">
          {BOTTOM_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                text-white/30 hover:text-white/70 hover:bg-white/5
                transition-all duration-200
                ${collapsed ? "justify-center" : ""}
              `}>
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
                )}
              </div>
            </Link>
          ))}

          {/* User */}
          <div className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-white/4 border border-white/6 mt-2
            ${collapsed ? "justify-center" : ""}
          `}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              AK
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">Aditya Kumar</p>
                <p className="text-[10px] text-white/30">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
