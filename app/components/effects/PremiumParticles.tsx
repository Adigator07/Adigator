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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const isLite = mode === "lite";
    const dpr = Math.min(window.devicePixelRatio || 1, isLite ? 1 : 1.3);
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
    let frameMs = 1000 / (isLite ? 18 : 26);
    let scrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const baseCount = density === "high" ? 220 : density === "medium" ? 162 : 108;
    const starCount = isLite ? Math.max(44, Math.floor(baseCount * 0.76)) : baseCount;
    const directionPool = [
      { x: 1, y: 0.2 },
      { x: 1, y: -0.2 },
      { x: -1, y: 0.2 },
      { x: -1, y: -0.2 },
      { x: 0.2, y: 1 },
      { x: -0.2, y: 1 },
      { x: 0.2, y: -1 },
      { x: -0.2, y: -1 },
    ];

    const stars = Array.from({ length: starCount }, () => {
      const d = directionPool[Math.floor(Math.random() * directionPool.length)];
      const speed = Math.random() * 0.24 + 0.1;
      return {
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 0.84 + 0.16,
      vx: d.x * speed,
      vy: d.y * speed,
      r: Math.random() * 1.2 + 0.28,
      twinkle: Math.random() * 1.8 + 0.7,
      phase: Math.random() * Math.PI * 2,
      waveAmp: Math.random() * 0.18 + 0.05,
      waveSpeed: Math.random() * 0.001 + 0.0005,
      };
    });

    const shooterCount = isLite ? 2 : 7;
    const shooters = Array.from({ length: shooterCount }, () => ({
      x: -100,
      y: -100,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      cooldown: Math.floor(Math.random() * 34) + 10,
      headAlpha: 0.9,
    }));
    const spawnShooter = (s: typeof shooters[number]) => {
      s.x = Math.random() * W;
      s.y = Math.random() * H;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.8 + 3.8;
      s.vx = Math.cos(angle) * speed;
      s.vy = Math.sin(angle) * speed;
      s.maxLife = Math.floor(Math.random() * 20) + 22;
      s.life = s.maxLife;
      s.headAlpha = Math.random() * 0.25 + 0.72;
      s.cooldown = Math.floor(Math.random() * 36) + 12;
    };

    const draw = (ts = 0) => {
      animId = requestAnimationFrame(draw);
      if (ts - last < frameMs) return;
      last = ts;

      if (document.visibilityState !== "visible") return;

      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const swirlX = Math.sin(ts * 0.00021 + s.phase) * 0.06;
        const swirlY = Math.cos(ts * 0.00025 + s.phase) * 0.06;
        s.x += (s.vx + swirlX) * s.z;
        s.y += (s.vy + swirlY) * s.z + Math.sin(ts * s.waveSpeed + s.phase) * s.waveAmp;

        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) {
          s.x = -4;
          s.y = Math.random() * H;
        }
        if (s.y < -4) s.y = H + 4;
        if (s.y > H + 4) s.y = -4;

        const twinkle = 0.44 + 0.56 * Math.sin(ts * 0.0011 * s.twinkle + s.phase);
        const alpha = 0.3 + (twinkle + 1) * 0.22 * s.z;

        const glowR = s.r * s.z * (isLite ? 2.0 : 2.6);
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${alpha * (isLite ? 0.12 : 0.18)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${alpha})`;
        ctx.fill();
      }

      if (!scrolling) {
        for (let i = 0; i < shooters.length; i++) {
          const s = shooters[i];
          if (s.life <= 0) {
            s.cooldown -= 1;
            if (s.cooldown <= 0) spawnShooter(s);
            continue;
          }

          const progress = 1 - s.life / s.maxLife;
          const tailLen = isLite ? 34 : 58;
          const tx = s.x - s.vx * tailLen * 0.2;
          const ty = s.y - s.vy * tailLen * 0.2;
          const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
          grad.addColorStop(0, "rgba(125,211,252,0)");
          grad.addColorStop(1, `rgba(196,181,253,${s.headAlpha * (1 - progress * 0.5)})`);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = isLite ? 1.05 : 1.35;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(s.x, s.y, isLite ? 1.3 : 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224,242,254,${s.headAlpha})`;
          ctx.fill();

          s.x += s.vx;
          s.y += s.vy;
          s.life -= 1;
        }
      }

      // Keep rendering focused on star motion; avoid mouse-driven effects for smoother frames.
    };

    draw();

    const onScroll = () => {
      scrolling = true;
      frameMs = 1000 / (isLite ? 14 : 18);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrolling = false;
        frameMs = 1000 / (isLite ? 18 : 24);
      }, 140);
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
