"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas 2D particle network — ad signal graph background.
 * z-index: 0 (behind page content)
 */
export default function ParticleCanvas({
  density = "full",
  className = "",
  interactive = true,
  fullScreen = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const nodeCount = isMobile ? 70 : density === "dense" ? 130 : 110;
    const connectDist = 160;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);

    let width = 0;
    let height = 0;
    let mouse = { x: -9999, y: -9999 };
    let ripples = [];
    let animId = 0;
    let nodes = [];

    const noise = (t, seed) =>
      Math.sin(t * 0.0005 + seed) * 0.7 + Math.cos(t * 0.00035 + seed * 1.7) * 0.5;

    const spreadNodes = () => {
      nodes = Array.from({ length: nodeCount }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2.2 + 1.4,
        seed: i * 1.37,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = fullScreen
        ? { width: window.innerWidth, height: window.innerHeight }
        : canvas.parentElement?.getBoundingClientRect();

      const nextW = Math.max(rect?.width || window.innerWidth, 1);
      const nextH = Math.max(rect?.height || window.innerHeight, 1);

      const sizeChanged = Math.abs(nextW - width) > 8 || Math.abs(nextH - height) > 8;
      width = nextW;
      height = nextH;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!nodes.length || sizeChanged) spreadNodes();
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onLeave = () => {
      mouse = { x: -9999, y: -9999 };
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 0,
        alpha: 0.55,
        born: performance.now(),
      });
      if (ripples.length > 8) ripples.shift();
    };

    resize();

    const ro = new ResizeObserver(resize);
    if (fullScreen) {
      window.addEventListener("resize", resize, { passive: true });
    } else {
      ro.observe(canvas.parentElement || document.body);
    }

    if (interactive) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      canvas.addEventListener("click", onClick);
    }

    const draw = (ts) => {
      ctx.clearRect(0, 0, width, height);

      // Soft vignette so nodes pop on edges
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.45, 0,
        width * 0.5, height * 0.45, Math.max(width, height) * 0.75,
      );
      vignette.addColorStop(0, "rgba(59, 123, 255, 0.04)");
      vignette.addColorStop(1, "rgba(10, 11, 15, 0)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx + noise(ts, node.seed) * 0.22;
        node.y += node.vy + noise(ts, node.seed + 100) * 0.22;

        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > 0) {
          const force = (140 - dist) / 140;
          node.x += (dx / dist) * force * 2.8;
          node.y += (dy / dist) * force * 2.8;
        }

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < connectDist) {
            const alpha = (1 - d / connectDist) * 0.55;
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(59, 123, 255, ${alpha})`);
            grad.addColorStop(1, `rgba(0, 212, 255, ${alpha})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        const pulse = 0.5 + Math.sin(ts * 0.0025 + node.phase) * 0.5;
        const radius = node.r * (0.9 + pulse * 0.35);

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 123, 255, ${0.06 + pulse * 0.06})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${0.55 + pulse * 0.4})`;
        ctx.fill();
      }

      ripples = ripples.filter((ripple) => {
        const age = (ts - ripple.born) / 800;
        if (age >= 1) return false;
        ripple.r = age * 200;
        ripple.alpha = 0.55 * (1 - age);
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 212, 255, ${ripple.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        return true;
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      if (interactive) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseleave", onLeave);
        canvas.removeEventListener("click", onClick);
      }
    };
  }, [density, interactive, fullScreen]);

  return (
    <canvas
      ref={canvasRef}
      className={`block h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
