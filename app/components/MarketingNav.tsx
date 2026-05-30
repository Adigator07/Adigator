"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MARKETING_CTA,
  MARKETING_DEMO_VIDEO,
  MARKETING_NAV_LINKS,
  MARKETING_SIGN_IN,
} from "@/app/lib/siteNavigation";

type MarketingNavProps = {
  activePath?: string;
};

export default function MarketingNav({ activePath }: MarketingNavProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`marketing-page fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#F5F5F0]/95 py-3 shadow-[0_8px_25px_rgba(15,23,42,0.08)] backdrop-blur"
          : "bg-transparent py-5 md:py-6"
      }`}
    >
      <div className="mx-auto flex w-[min(1280px,92vw)] items-center justify-between gap-3">
        <Link href="/" className="text-2xl font-black tracking-tight text-[#0D0D0D]">
          Adigator
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {MARKETING_NAV_LINKS.map((item) => {
            const active = currentPath === item.href;
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-1 text-sm font-semibold transition ${
                    active ? "text-[#0D0D0D]" : "text-[#1E1E1E] hover:text-[#0D0D0D]"
                  }`}
                >
                  {item.label}
                  <span className="text-xs text-[#4D4D4D]">▾</span>
                </Link>
                <div className="pointer-events-none absolute left-1/2 top-8 hidden w-44 -translate-x-1/2 rounded-xl border border-[#D9D9D1] bg-white p-3 text-xs text-[#525252] shadow-lg group-hover:block">
                  {item.hint}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href={MARKETING_SIGN_IN.href} className="marketing-btn-outline rounded-full px-5 py-2.5 text-sm font-semibold">
            {MARKETING_SIGN_IN.label}
          </Link>
          <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-6 py-3 text-sm font-semibold">
            {MARKETING_CTA.label}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D0D0C8] bg-white text-[#0D0D0D] md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen ? (
        <div className="mx-auto mt-3 w-[min(1280px,92vw)] rounded-2xl border border-[#D9D9D1] bg-white p-4 shadow-lg md:hidden">
          <div className="space-y-1">
            {MARKETING_NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#0D0D0D] hover:bg-[#F5F5F0]"
              >
                {item.label}
              </Link>
            ))}
            <Link href={MARKETING_DEMO_VIDEO.href} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#0D0D0D] hover:bg-[#F5F5F0]">
              {MARKETING_DEMO_VIDEO.label}
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link href={MARKETING_SIGN_IN.href} className="marketing-btn-outline rounded-full px-5 py-3 text-center text-sm font-semibold">
              {MARKETING_SIGN_IN.label}
            </Link>
            <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-5 py-3 text-center text-sm font-semibold">
              {MARKETING_CTA.label}
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
