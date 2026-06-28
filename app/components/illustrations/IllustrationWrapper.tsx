"use client";

import { useEffect, useRef, useState } from "react";

type IllustrationWrapperProps = {
  src: string;
  className?: string;
  alt: string;
  priority?: boolean;
};

const svgCache = new Map<string, string>();

function initSvgInteractions(svg: SVGSVGElement, container: HTMLElement) {
  svg.querySelectorAll("[data-glow]").forEach((el, i) => {
    (el as HTMLElement).style.setProperty("--delay", `${i * 0.12}s`);
  });

  const onEnter = () => svg.classList.add("hovered");
  const onLeave = () => svg.classList.remove("hovered");

  svg.addEventListener("mouseenter", onEnter);
  svg.addEventListener("mouseleave", onLeave);

  const observer = new IntersectionObserver(
    ([entry]) => {
      const active = entry.isIntersecting;
      svg.classList.toggle("is-paused", !active);
      container.classList.toggle("is-paused", !active);
    },
    { rootMargin: "80px", threshold: 0.08 },
  );

  observer.observe(container);

  return () => {
    svg.removeEventListener("mouseenter", onEnter);
    svg.removeEventListener("mouseleave", onLeave);
    observer.disconnect();
  };
}

export function IllustrationSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#DEDDD5] bg-[#FAFAF7] ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F0] via-[#EDECE6] to-[#E8E6DF]" />
    </div>
  );
}

export default function IllustrationWrapper({
  src,
  className = "",
  alt,
  priority = false,
}: IllustrationWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(() => (priority ? svgCache.get(src) ?? null : null));
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority || svgCache.has(src));

  useEffect(() => {
    if (shouldLoad || !containerRef.current) return;

    const node = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    const cached = svgCache.get(src);
    if (cached) {
      setHtml(cached);
      return;
    }

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load illustration: ${src}`);
        return res.text();
      })
      .then((svgText) => {
        if (cancelled) return;
        const withAria = svgText.replace(/<svg\b/, `<svg aria-label="${alt.replace(/"/g, "&quot;")}"`);
        svgCache.set(src, withAria);
        setHtml(withAria);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src, alt, shouldLoad]);

  useEffect(() => {
    if (!html || !containerRef.current) return;

    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", alt);
    svg.classList.add("w-full", "h-auto", "max-w-full");

    return initSvgInteractions(svg, containerRef.current);
  }, [html, alt]);

  if (error) {
    return (
      <div
        className={`flex aspect-[4/3] items-center justify-center rounded-2xl border border-[#DEDDD5] bg-[#FAFAF7] text-sm text-[#6B7280] ${className}`}
        role="img"
        aria-label={alt}
      >
        Illustration unavailable
      </div>
    );
  }

  if (!html) {
    return (
      <div ref={containerRef} className={className}>
        <IllustrationSkeleton />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`illustration-wrapper contain-paint ${className}`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 338px" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
