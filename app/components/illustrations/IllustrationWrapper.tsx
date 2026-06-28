"use client";

import { useEffect, useRef, useState } from "react";
import { prepareInteractiveSvg } from "@/app/lib/prepareInteractiveSvg";

type IllustrationWrapperProps = {
  src: string;
  className?: string;
  alt: string;
  priority?: boolean;
  interactive?: boolean;
};

const rawSvgCache = new Map<string, string>();

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

async function loadInteractiveSvg(src: string, interactive: boolean): Promise<string> {
  let raw = rawSvgCache.get(src);
  if (!raw) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to load illustration: ${src}`);
    }
    raw = await response.text();
    rawSvgCache.set(src, raw);
  }

  return interactive ? prepareInteractiveSvg(raw) : raw;
}

export default function IllustrationWrapper({
  src,
  className = "",
  alt,
  priority = false,
  interactive = true,
}: IllustrationWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [useFallbackImage, setUseFallbackImage] = useState(false);

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

    loadInteractiveSvg(src, interactive)
      .then((markup) => {
        if (!cancelled) {
          setSvgMarkup(markup);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUseFallbackImage(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, src, interactive]);

  return (
    <div
      ref={containerRef}
      className={`illustration-wrapper ${interactive ? "illustration-wrapper--interactive" : ""} ${className}`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 338px" }}
      role="img"
      aria-label={alt}
    >
      {shouldLoad ? (
        svgMarkup ? (
          <div
            className="illustration-inline"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : useFallbackImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            width={600}
            height={450}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            className="h-auto w-full max-w-full"
            draggable={false}
          />
        ) : (
          <IllustrationSkeleton />
        )
      ) : (
        <IllustrationSkeleton />
      )}
    </div>
  );
}
