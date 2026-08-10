"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top bar during client navigations so route changes feel responsive
 * even while the next page chunk is still compiling/loading.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const first = useRef(true);
  const hideTimer = useRef<number | null>(null);
  const tickTimer = useRef<number | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) return;
      if (link.target === "_blank") return;

      const nextUrl = new URL(href, window.location.origin);
      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${nextUrl.pathname}${nextUrl.search}`;
      if (current === next) return;

      document.documentElement.classList.add("agi-navigating");
      setActive(true);
      setWidth(18);
      if (tickTimer.current) window.clearInterval(tickTimer.current);
      tickTimer.current = window.setInterval(() => {
        setWidth((prev) => (prev >= 88 ? prev : prev + Math.max(1, (90 - prev) * 0.08)));
      }, 120);
    };

    document.addEventListener("mousedown", onPointerDown, { capture: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      if (tickTimer.current) window.clearInterval(tickTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    setWidth(100);
    if (tickTimer.current) {
      window.clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
    hideTimer.current = window.setTimeout(() => {
      setActive(false);
      setWidth(0);
      document.documentElement.classList.remove("agi-navigating");
    }, 180);
  }, [pathname, searchParams]);

  if (!active && width === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px]"
    >
      <div
        className="h-full bg-linear-to-r from-sky-500 via-cyan-400 to-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.55)] transition-[width] duration-150 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
