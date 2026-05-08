"use client";

import { useEffect, useRef } from "react";
import { type PerformanceTier } from "@/app/lib/performanceTier";

type PremiumParticlesProps = {
  density?: "low" | "medium" | "high";
  mode?: PerformanceTier;
};

export default function PremiumParticles({ density = "low", mode = "full" }: PremiumParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const isLite = mode === "lite";
    // Cap DPR at 1 on mobile to avoid heavy pixel buffers
    const isMobile = window.innerWidth <= 768;
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, isLite ? 1 : 1.2);

    const setCanvasSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { vw, vh };
    };

    let { vw: W, vh: H } = setCanvasSize();
    let animId = 0;
    let last = 0;
    // Mobile: 14fps, lite: 18fps, full: 24fps — keeps GPU load low
    const baseFps = isMobile ? 14 : isLite ? 18 : 24;
    let frameMs = 1000 / baseFps;
    let scrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    // Star counts: significantly reduced to prevent canvas overdraw lag
    const baseCount = density === "high" ? 80 : density === "medium" ? 60 : 48;
    const starCount = isMobile ? Math.min(32, baseCount) : isLite ? Math.floor(baseCount * 0.75) : baseCount;

    const directionPool = [
      { x: 1, y: 0.2 }, { x: 1, y: -0.2 },
      { x: -1, y: 0.2 }, { x: -1, y: -0.2 },
      { x: 0.2, y: 1 }, { x: -0.2, y: 1 },
      { x: 0.2, y: -1 }, { x: -0.2, y: -1 },
    ];

    const stars = Array.from({ length: starCount }, () => {
      const d = directionPool[Math.floor(Math.random() * directionPool.length)];
      const speed = Math.random() * 0.2 + 0.08;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 0.8 + 0.2,
        vx: d.x * speed,
        vy: d.y * speed,
        r: Math.random() * 1.0 + 0.25,
        twinkle: Math.random() * 1.6 + 0.6,
        phase: Math.random() * Math.PI * 2,
        waveAmp: Math.random() * 0.14 + 0.04,
        waveSpeed: Math.random() * 0.0008 + 0.0004,
      };
    });

    // Shooting stars: 3 on desktop full, 2 on lite, 1 on mobile
    const shooterCount = isMobile ? 1 : isLite ? 2 : 3;
    const shooters = Array.from({ length: shooterCount }, () => ({
      x: -100, y: -100,
      vx: 0, vy: 0,
      life: 0, maxLife: 0,
      cooldown: Math.floor(Math.random() * 60) + 30,
      headAlpha: 0.9,
    }));

    // Diagonal angle presets — looks natural, consistent direction
    const anglePresets = [
      Math.PI * 0.15, Math.PI * 0.22, Math.PI * 0.28,
      Math.PI * 1.15, Math.PI * 1.22, Math.PI * 1.72,
    ];

    const spawnShooter = (s: typeof shooters[number]) => {
      const edge = Math.floor(Math.random() * 2); // only top or left edges
      if (edge === 0) { s.x = Math.random() * W; s.y = -10; }
      else { s.x = -10; s.y = Math.random() * H * 0.6; }
      const angle = anglePresets[Math.floor(Math.random() * anglePresets.length)] + (Math.random() * 0.14 - 0.07);
      const speed = Math.random() * 5 + 4;
      s.vx = Math.cos(angle) * speed;
      s.vy = Math.sin(angle) * speed;
      s.maxLife = Math.floor(Math.random() * 24) + 20;
      s.life = s.maxLife;
      s.headAlpha = Math.random() * 0.15 + 0.82;
      s.cooldown = isMobile
        ? Math.floor(Math.random() * 120) + 60
        : Math.floor(Math.random() * 60) + 30;
    };

    const draw = (ts = 0) => {
      animId = requestAnimationFrame(draw);
      if (ts - last < frameMs) return;
      last = ts;

      if (document.visibilityState !== "visible") return;

      ctx.clearRect(0, 0, W, H);

      // ── Background stars ─────────────────────────────
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx * s.z;
        s.y += s.vy * s.z + Math.sin(ts * s.waveSpeed + s.phase) * s.waveAmp;

        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) { s.x = -4; s.y = Math.random() * H; }
        if (s.y < -4) s.y = H + 4;
        if (s.y > H + 4) s.y = -4;

        const twinkle = 0.45 + 0.55 * Math.sin(ts * 0.001 * s.twinkle + s.phase);
        const alpha = 0.28 + (twinkle + 1) * 0.22 * s.z;

        // Single arc per star — no per-star glow arc (halves canvas calls)
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${Math.min(alpha, 0.95)})`;
        ctx.fill();
      }

      // ── Shooting stars — skip while scrolling ─────────
      if (!scrolling) {
        for (let i = 0; i < shooters.length; i++) {
          const s = shooters[i];
          if (s.life <= 0) {
            s.cooldown -= 1;
            if (s.cooldown <= 0) spawnShooter(s);
            continue;
          }

          const progress = 1 - s.life / s.maxLife;
          const tailLen = isMobile ? 52 : isLite ? 72 : 96;
          const tx = s.x - s.vx * tailLen * 0.24;
          const ty = s.y - s.vy * tailLen * 0.24;

          // Tail — single linear gradient, no radial gradient (perf-safe)
          const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
          grad.addColorStop(0, "rgba(125,211,252,0)");
          grad.addColorStop(0.55, `rgba(196,210,255,${s.headAlpha * 0.28 * (1 - progress * 0.5)})`);
          grad.addColorStop(1, `rgba(230,220,255,${s.headAlpha * (1 - progress * 0.45)})`);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Head — simple bright dot, no createRadialGradient per frame
          ctx.beginPath();
          ctx.arc(s.x, s.y, isMobile ? 1.6 : 2.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,248,255,${s.headAlpha * (1 - progress * 0.4)})`;
          ctx.fill();

          s.x += s.vx;
          s.y += s.vy;
          s.life -= 1;
        }
      }
    };

    draw();

    const onScroll = () => {
      scrolling = true;
      frameMs = 1000 / (isMobile ? 10 : isLite ? 14 : 16);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrolling = false;
        frameMs = 1000 / baseFps;
      }, 180);
    };

    const onResize = () => {
      const resized = setCanvasSize();
      W = resized.vw;
      H = resized.vh;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [density, mode]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-1" />;
}
