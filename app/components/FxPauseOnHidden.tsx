"use client";

import { useEffect } from "react";

/**
 * Keeps decorative FX cheap during interaction:
 * - pause while tab is hidden
 * - pause while the user is scrolling (any scroll container)
 * - pause briefly during route transitions / click navigations
 */
export default function FxPauseOnHidden() {
  useEffect(() => {
    const root = document.documentElement;
    let scrollTimer: number | null = null;
    let navTimer: number | null = null;
    let scrollRaf = 0;

    const setPaused = (paused: boolean) => {
      root.classList.toggle("agi-fx-paused", paused || document.hidden || root.classList.contains("agi-scrolling"));
    };

    const setScrolling = (scrolling: boolean) => {
      root.classList.toggle("agi-scrolling", scrolling);
      setPaused(document.hidden || scrolling || root.classList.contains("agi-navigating"));
    };

    const setNavigating = (navigating: boolean) => {
      root.classList.toggle("agi-navigating", navigating);
      setPaused(document.hidden || navigating || root.classList.contains("agi-scrolling"));
    };

    const onVisibility = () => {
      setPaused(document.hidden || root.classList.contains("agi-scrolling") || root.classList.contains("agi-navigating"));
    };

    const onScroll = () => {
      if (!scrollRaf) {
        scrollRaf = window.requestAnimationFrame(() => {
          scrollRaf = 0;
          setScrolling(true);
        });
      }
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => setScrolling(false), 140);
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) return;
      setNavigating(true);
      if (navTimer) window.clearTimeout(navTimer);
      navTimer = window.setTimeout(() => setNavigating(false), 900);
    };

    setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("mousedown", onPointerDown, { capture: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("mousedown", onPointerDown, true);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      if (navTimer) window.clearTimeout(navTimer);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      root.classList.remove("agi-fx-paused", "agi-scrolling", "agi-navigating");
    };
  }, []);

  return null;
}
