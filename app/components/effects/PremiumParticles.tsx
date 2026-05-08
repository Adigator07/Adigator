"use client";

import { useEffect, useRef } from "react";

type PremiumParticlesProps = {
  density?: "low" | "medium";
};

export default function PremiumParticles({ density = "low" }: PremiumParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.3);
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
    let mx = W / 2;
    let my = H / 2;
    let animId = 0;
    let last = 0;
    let frameMs = 1000 / 24;
    let scrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const baseCount = density === "medium" ? 72 : 42;
    const stars = Array.from({ length: baseCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.11,
      vy: (Math.random() - 0.5) * 0.11,
      r: Math.random() * 1.1 + 0.25,
      a: Math.random() * 0.5 + 0.2,
      tw: Math.random() * 1.7 + 0.7,
      ph: Math.random() * Math.PI * 2,
    }));

    const streak = { x: -100, y: -100, vx: 0, vy: 0, life: 0, cooldown: 55 };
    const spawnStreak = () => {
      streak.x = -40;
      streak.y = Math.random() * H * 0.6;
      streak.vx = Math.random() * 3.5 + 4.5;
      streak.vy = Math.random() * 1.1 + 0.4;
      streak.life = Math.floor(Math.random() * 22) + 26;
    };

    const draw = (ts = 0) => {
      animId = requestAnimationFrame(draw);
      if (ts - last < frameMs) return;
      last = ts;

      if (document.visibilityState !== "visible") return;

      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;

        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) s.x = -4;
        if (s.y < -4) s.y = H + 4;
        if (s.y > H + 4) s.y = -4;

        const twinkle = 0.6 + 0.4 * Math.sin(ts * 0.0012 * s.tw + s.ph);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${s.a * twinkle})`;
        ctx.fill();
      }

      if (!scrolling) {
        if (streak.life <= 0) {
          streak.cooldown -= 1;
          if (streak.cooldown <= 0) {
            spawnStreak();
            streak.cooldown = Math.floor(Math.random() * 70) + 90;
          }
        } else {
          const tx = streak.x + streak.vx * 4;
          const ty = streak.y + streak.vy * 4;
          const grad = ctx.createLinearGradient(streak.x, streak.y, tx, ty);
          grad.addColorStop(0, "rgba(125,211,252,0)");
          grad.addColorStop(1, "rgba(125,211,252,0.62)");
          ctx.beginPath();
          ctx.moveTo(streak.x, streak.y);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1;
          ctx.stroke();

          streak.x += streak.vx;
          streak.y += streak.vy;
          streak.life -= 1;
        }
      }

      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 8);
      glow.addColorStop(0, "rgba(56,189,248,0.48)");
      glow.addColorStop(1, "rgba(56,189,248,0)");
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    };

    draw();

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onScroll = () => {
      scrolling = true;
      frameMs = 1000 / 18;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrolling = false;
        frameMs = 1000 / 24;
      }, 140);
    };

    const onResize = () => {
      const resized = setCanvasSize();
      W = resized.vw;
      H = resized.vh;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [density]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" />;
}
