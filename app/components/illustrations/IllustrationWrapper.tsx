"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { prepareInteractiveSvg } from "@/app/lib/prepareInteractiveSvg";
import {
  ILLUSTRATION_ENTRANCE,
  ILLUSTRATION_ENTRANCE_EASE,
  ILLUSTRATION_ENTRANCE_REDUCED,
  type IllustrationAnimation,
} from "@/app/lib/illustrationMotion";

type IllustrationWrapperProps = {
  src: string;
  className?: string;
  alt: string;
  priority?: boolean;
  interactive?: boolean;
  animation?: IllustrationAnimation;
  delay?: number;
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
  animation = "fade-up",
  delay = 0,
}: IllustrationWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const reduceMotion = useReducedMotion();
  const motionVariants = reduceMotion ? ILLUSTRATION_ENTRANCE_REDUCED : ILLUSTRATION_ENTRANCE[animation];

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

    const isRaster = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(src);
    if (isRaster) {
      setUseFallbackImage(true);
      return;
    }

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

  const illustrationContent = shouldLoad ? (
    svgMarkup ? (
      <div className="illustration-inline" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
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
  );

  return (
    <div
      ref={containerRef}
      className={`illustration-wrapper ${interactive ? "illustration-wrapper--interactive" : ""} ${hasRevealed ? "illustration-wrapper--revealed" : ""} ${className}`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 338px" }}
      role="img"
      aria-label={alt}
    >
      <motion.div
        className="illustration-motion-inner"
        initial="hidden"
        animate={priority || reduceMotion ? "visible" : undefined}
        whileInView={!priority && !reduceMotion ? "visible" : undefined}
        viewport={{ once: true, amount: 0.22, margin: "0px 0px -48px 0px" }}
        variants={motionVariants}
        transition={{
          duration: reduceMotion ? 0.25 : 0.85,
          delay,
          ease: ILLUSTRATION_ENTRANCE_EASE,
        }}
        onAnimationComplete={() => setHasRevealed(true)}
      >
        {illustrationContent}
      </motion.div>
    </div>
  );
}
