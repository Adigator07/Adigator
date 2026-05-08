"use client";

import {
  useEffect, useState, useRef, useCallback, useMemo,
} from "react";
import Link from "next/link";
import {
  AnimatePresence, motion,
  useMotionValue, useSpring, useTransform, useScroll,
  type MotionValue,
} from "framer-motion";
import Header from "@/app/components/Header";
import { motionTokens } from "@/app/lib/motionTokens";

/* ═══════════════════════════════════════════════════════
   1. CUSTOM CURSOR
═══════════════════════════════════════════════════════ */
function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle"|"clicking"|"hovering">("idle");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateEnabled = () => setEnabled(media.matches && !motion.matches);
    updateEnabled();

    media.addEventListener("change", updateEnabled);
    motion.addEventListener("change", updateEnabled);
    return () => {
      media.removeEventListener("change", updateEnabled);
      motion.removeEventListener("change", updateEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let rafId: number;
    let tx = -100, ty = -100;  // target (dot)
    let rx = -100, ry = -100;  // ring (lagged)

    const onMove = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
    };
    const onDown  = () => setState("clicking");
    const onUp    = () => setState("idle");

    const onEnter = () => setState("hovering");
    const onLeave = () => setState("idle");
    const interactables = document.querySelectorAll("a,button,[data-cursor-hover]");
    interactables.forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      // dot: instant
      if (dotRef.current)  { dotRef.current.style.left  = `${tx}px`; dotRef.current.style.top  = `${ty}px`; }
      // ring: lerp lag
      rx += (tx - rx) * 0.14;
      ry += (ty - ry) * 0.14;
      if (ringRef.current) { ringRef.current.style.left = `${rx}px`; ringRef.current.style.top = `${ry}px`; }
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      cancelAnimationFrame(rafId);
      setState("idle");
      interactables.forEach(el => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef}  className={`cursor-dot  ${state === "clicking" ? "clicking" : ""}`} />
      <div ref={ringRef} className={`cursor-ring ${state === "clicking" ? "clicking" : state === "hovering" ? "hovering" : ""}`} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   2. CANVAS PARTICLE NETWORK
═══════════════════════════════════════════════════════ */
function CanvasParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
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
    let mx = W / 2, my = H / 2;
    let animId: number;
    let prev = 0;
    const baseFps = 26;
    let frameMs = 1000 / baseFps;

    const starCount = W >= 1536 ? 90 : W >= 1366 ? 70 : 54;
    let scrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 0.8 + 0.2,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      twinkle: Math.random() * 1.8 + 0.7,
      phase: Math.random() * Math.PI * 2,
      r: Math.random() * 1.1 + 0.25,
    }));

    const draw = (ts = 0) => {
      animId = requestAnimationFrame(draw);
      if (ts - prev < frameMs) return;
      prev = ts;

      if (document.visibilityState !== "visible") return;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx * s.z;
        s.y += s.vy * s.z;
        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) s.x = -4;
        if (s.y < -4) s.y = H + 4;
        if (s.y > H + 4) s.y = -4;

        const tw = 0.45 + 0.55 * Math.sin(ts * 0.0011 * s.twinkle + s.phase);
        const alpha = 0.18 + (tw + 1) * 0.22 * s.z;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186,230,253,${alpha})`;
        ctx.fill();
      }

      // draw mouse glow node
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 10);
      grad.addColorStop(0, "rgba(56,189,248,0.75)");
      grad.addColorStop(1, "rgba(56,189,248,0)");
      ctx.beginPath();
      ctx.arc(mx, my, 10, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mx, my, 16, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56,189,248,0.22)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    };

    draw();

    const onMove   = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onScroll = () => {
      scrolling = true;
      frameMs = 1000 / 18;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrolling = false;
        frameMs = 1000 / baseFps;
      }, 150);
    };
    const onResize = () => {
      const resized = setCanvasSize();
      W = resized.vw;
      H = resized.vh;
    };
    window.addEventListener("mousemove", onMove,   { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize",   onResize);
    return () => {
      cancelAnimationFrame(animId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize",   onResize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" />;
}

/* ═══════════════════════════════════════════════════════
   3. CSS PRESERVE-3D HERO SCENE
═══════════════════════════════════════════════════════ */
function HeroScene({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const rY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 28, damping: 20 });
  const rX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 28, damping: 20 });

  return (
    <div className="scene-wrap w-full h-105 md:h-130">
      <motion.div
        className="scene-root w-full h-full"
        style={{ rotateY: rY, rotateX: rX }}
      >
        {/* ─── LAYER -140: deep background plane ─── */}
        <div className="scene-layer" style={{ transform: "translateZ(-140px)" }}>
          <div className="w-[90%] h-[88%] rounded-2xl overflow-hidden opacity-30"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.15) 0%, rgba(2,6,23,0.8) 60%)", border: "1px solid rgba(168,85,247,0.15)" }}>
            {/* faint grid lines */}
            <div className="grid-bg absolute inset-0 opacity-60" />
            {/* faint floating numbers */}
            <div className="absolute inset-0 flex items-center justify-center gap-12 opacity-40">
              {["94%","78%","86%","91%"].map(v => (
                <span key={v} className="font-display text-4xl font-bold text-purple-300/30">{v}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ─── LAYER -55: secondary card (blurred, behind) ─── */}
        <div className="scene-layer scene-item-platform" style={{ transform: "translateZ(-55px) translate(-48%, -38%) scale(0.72)" }}>
          <div className="w-56 rounded-2xl p-4 backdrop-blur-sm"
            style={{ background: "rgba(10,14,40,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Platform Checks</p>
            {["Size: 300×250","Format: JPEG","CTA: Visible","Brand: Safe"].map(item => (
              <div key={item} className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-emerald shrink-0" />
                <span className="text-[10px] text-gray-400">{item} ✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── LAYER 0: main analytics card (centre) ─── */}
        <div className="scene-layer scene-item-main" style={{ transform: "translateZ(0px) translate(0%, 0%)" }}>
          <div className="w-72 rounded-2xl overflow-hidden"
            style={{ background: "rgba(10,15,42,0.92)", border: "1px solid rgba(168,85,247,0.28)", boxShadow: "0 0 60px rgba(147,51,234,0.25), 0 24px 64px rgba(0,0,0,0.7)" }}>
            <div className="scanline" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Live Analysis</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 dot-emerald animate-pulse" />
                  <span className="text-[10px] text-gray-400">Real-time</span>
                </div>
              </div>
              {[
                { label: "Visual Score",   val: 94, w: "94%",  from: "from-purple-500", to: "to-pink-500" },
                { label: "CTA Strength",   val: 88, w: "88%",  from: "from-blue-500",   to: "to-cyan-400" },
                { label: "Brand Recall",   val: 76, w: "76%",  from: "from-amber-400",  to: "to-orange-500" },
                { label: "Load Speed",     val: 97, w: "97%",  from: "from-emerald-400",to: "to-teal-400" },
              ].map(item => (
                <div key={item.label} className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400">{item.label}</span>
                    <span className="text-[10px] font-bold text-white">{item.val}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill bg-linear-to-r ${item.from} ${item.to}`} style={{ "--w": item.w } as React.CSSProperties} />
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <span className="text-xs font-bold text-purple-200">Overall Score</span>
                <span className="font-display text-2xl font-bold text-purple-200">91%</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl px-3 py-2 text-center"
                  style={{ background: "rgba(16,185,129,0.16)", border: "1px solid rgba(52,211,153,0.34)", boxShadow: "0 0 18px rgba(52,211,153,0.16)" }}>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-300">IAB Ready</p>
                  <p className="font-display text-xl font-bold text-emerald-300">✓ All Clear</p>
                </div>
                <div className="rounded-xl px-3 py-2 text-center"
                  style={{ background: "rgba(147,51,234,0.2)", border: "1px solid rgba(168,85,247,0.45)", boxShadow: "0 0 16px rgba(168,85,247,0.22)" }}>
                  <p className="text-[8px] text-purple-300 uppercase tracking-widest">Saved</p>
                  <p className="font-display text-2xl font-bold text-purple-200">18h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Floating glow orbs at various depths ─── */}
        {[
          { z: -30, x: "28%",  y: "15%", c: "rgba(168,85,247,0.35)",  s: 8, a: "float-c 6s 0s   infinite" },
          { z:  30, x: "-32%", y: "-25%",c: "rgba(6,182,212,0.4)",    s: 6, a: "float-c 7s 1.5s infinite" },
          { z:  80, x: "12%",  y: "38%", c: "rgba(236,72,153,0.35)",  s: 5, a: "float-a 5s 0.8s infinite" },
          { z: -60, x: "-18%", y: "30%", c: "rgba(251,146,60,0.3)",   s: 4, a: "float-b 8s 2s   infinite" },
        ].map((o, i) => (
          <div key={i} className="scene-layer" style={{ transform: `translateZ(${o.z}px) translate(${o.x},${o.y})` }}>
            <div className="rounded-full" style={{ width: o.s * 2, height: o.s * 2, background: o.c, boxShadow: `0 0 ${o.s*3}px ${o.c}`, animation: o.a, filter: "blur(1px)" }} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. MAGNETIC BUTTON WRAPPER
═══════════════════════════════════════════════════════ */
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 12 });
  const sy = useSpring(y, { stiffness: 180, damping: 12 });

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width  / 2)) * 0.32);
    y.set((e.clientY - (rect.top  + rect.height / 2)) * 0.32);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="inline-block">
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   5. HOLOGRAPHIC TILT CARD
═══════════════════════════════════════════════════════ */
function HoloCard({
  children, className, intensity = 10,
  style, onMouseEnter, onMouseLeave,
}: {
  children: React.ReactNode; className?: string; intensity?: number;
  style?: React.CSSProperties;
  onMouseEnter?: () => void; onMouseLeave?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (rx - 0.5) * intensity, y: (ry - 0.5) * -intensity });
    // update CSS vars for holographic foil
    ref.current?.style.setProperty("--mx", `${rx * 100}%`);
    ref.current?.style.setProperty("--my", `${ry * 100}%`);
    ref.current?.style.setProperty("--hue", `${rx * 80}deg`);
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={`holo-card ${className ?? ""}`}
      onMouseMove={onMove}
      onMouseEnter={() => { setHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setHovered(false); setTilt({ x:0, y:0 }); onMouseLeave?.(); }}
      style={{
        ...style,
        transform: `perspective(1100px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${hovered ? 1.025 : 1})`,
        transition: hovered ? "transform 0.08s ease-out" : "transform 0.55s cubic-bezier(0.23,1,0.32,1)",
        willChange: "transform",
      }}
    >
      <div className="shimmer" />
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   6. SCROLL REVEAL
═══════════════════════════════════════════════════════ */
function Reveal({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   7. WORD REVEAL HEADLINE
═══════════════════════════════════════════════════════ */
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="word-wrap">
          <motion.span
            className="word-inner"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%",   opacity: 1 }}
            transition={{ duration: 0.72, delay: delay + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   8. HERO CAROUSEL CONTENT
═══════════════════════════════════════════════════════ */
const carouselItems = [
  {
    id: "validation",
    title: "Instant Validation",
    sub: "All platform standards checked in seconds",
    content: (
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Platform Compliance</span>
          <span className="rounded-full px-2.5 py-1 text-xs font-bold text-emerald-300" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}>Ready</span>
        </div>
        {["Size: 300×250 ✓","Format: JPEG ✓","Compression: Optimised ✓","CTA Visible: Yes ✓"].map(it=>(
          <div key={it} className="flex items-center gap-2 mb-2 text-xs text-gray-400">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-emerald shrink-0" />
            {it}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "preview",
    title: "Real Environment Preview",
    sub: "See exactly how your ad performs before launch",
    content: (
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto w-44 rounded-[20px] p-3" style={{ background: "#090e1e", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="h-2 w-12 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg,rgba(147,51,234,0.22),rgba(236,72,153,0.18))", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-2">Your Creative</p>
            <div className="h-14 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
            <button className="w-full rounded-lg py-1 text-[10px] font-bold text-white" style={{ background: "rgba(147,51,234,0.75)", boxShadow: "0 0 12px rgba(147,51,234,0.4)" }}>
              Call to Action
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "insights",
    title: "Actionable Insights",
    sub: "What will work. What won't. Why.",
    content: (
      <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { l:"CTA Visibility",   v:92, w:"92%", c:"from-emerald-400 to-teal-400",    tc:"text-emerald-400" },
          { l:"Text Readability", v:78, w:"78%", c:"from-yellow-400 to-amber-500",     tc:"text-yellow-400" },
          { l:"Visual Impact",    v:86, w:"86%", c:"from-purple-400 to-pink-500",      tc:"text-purple-300" },
        ].map(it=>(
          <div key={it.l} className="rounded-lg p-3" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold text-gray-300">{it.l}</span>
              <span className={`text-xs font-bold ${it.tc}`}>{it.v}%</span>
            </div>
            <div className="bar-track">
              <div className={`bar-fill bg-linear-to-r ${it.c}`} style={{ "--w": it.w } as React.CSSProperties} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "compare",
    title: "Creative Comparison",
    sub: "Identify top performers instantly",
    content: (
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-3 gap-2">
          {[{v:"A",s:"71%",best:false},{v:"B",s:"94%",best:true},{v:"C",s:"65%",best:false}].map(c=>(
            <div key={c.v} className="rounded-xl p-2" style={{ background: c.best ? "rgba(168,85,247,0.14)" : "rgba(255,255,255,0.04)", border: c.best ? "1px solid rgba(168,85,247,0.45)" : "1px solid rgba(255,255,255,0.07)", boxShadow: c.best ? "0 0 20px rgba(168,85,247,0.2)" : "none" }}>
              <div className="h-14 rounded-lg mb-2" style={{ background: c.best ? "rgba(168,85,247,0.22)" : "rgba(255,255,255,0.08)" }} />
              <p className={`text-[10px] font-bold ${c.best ? "text-purple-300" : "text-gray-400"}`}>{c.best ? "★ Best" : `Ver ${c.v}`}</p>
              <p className={`text-[9px] ${c.best ? "text-purple-400 font-bold" : "text-gray-500"}`}>{c.s}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

/* ═══════════════════════════════════════════════════════
   9. PAGE COMPONENT
═══════════════════════════════════════════════════════ */
export default function Home() {
  // Mouse tracking for 3D scene
  const mx = useMotionValue<number>(0);
  const my = useMotionValue<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth  - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  // Mouse-reactive BG orbs
  const ox1 = useSpring(useTransform(mx, [-0.5,0.5],[-60, 60]), { stiffness:45, damping:20 });
  const oy1 = useSpring(useTransform(my, [-0.5,0.5],[-45, 45]), { stiffness:45, damping:20 });
  const ox2 = useSpring(useTransform(mx, [-0.5,0.5],[ 35,-35]), { stiffness:40, damping:22 });
  const oy2 = useSpring(useTransform(my, [-0.5,0.5],[-25, 25]), { stiffness:40, damping:22 });
  const ox3 = useSpring(useTransform(mx, [-0.5,0.5],[-20, 20]), { stiffness:35, damping:25 });
  const oy3 = useSpring(useTransform(my, [-0.5,0.5],[ 20,-20]), { stiffness:35, damping:25 });

  // Carousel
  const [active, setActive]  = useState(0);
  const [paused, setPaused]  = useState(false);
  const [showGrain, setShowGrain] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setShowGrain(!media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(p => (p + 1) % carouselItems.length), 2700);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      setIsScrolling(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolling(false), 180);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Scroll parallax
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -60]);

  const featureIcons: Record<string,string> = {
    "IAB ready in minutes": "⚡",
    "Mobile + desktop in one view": "🖥",
    "Streamlined approvals": "✅",
    "Reduce back-and-forth": "🔁",
    "Instant creative comparison": "⚖️",
    "Real-time collaboration": "👥",
  };

  return (
    <main className="relative min-h-screen bg-[#020617] text-white" data-scrolling={isScrolling ? "true" : "false"}>

      {/* ── Custom Cursor ── */}
      <CustomCursor />

      {/* ── Canvas Particles ── */}
      <CanvasParticles />

      {/* ── Film Grain ── */}
      {showGrain && <div className="grain" />}

      {/* ── Atmospheric Orbs (mouse-reactive) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div className="absolute rounded-full"
          style={{ top: "-10%", left: "-12%", width: 700, height: 700, background: "radial-gradient(circle, rgba(139,92,246,0.17) 0%, transparent 68%)", filter: "blur(55px)", x: ox1, y: oy1 }} />
        <motion.div className="absolute rounded-full"
          style={{ top: "20%", right: "-12%", width: 580, height: 580, background: "radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 68%)", filter: "blur(55px)", x: ox2, y: oy2 }} />
        <motion.div className="absolute rounded-full"
          style={{ bottom: "-8%", left: "38%", width: 500, height: 500, background: "radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 68%)", filter: "blur(55px)", x: ox3, y: oy3 }} />

        <div className="absolute inset-0 ai-pixels" />
        <div className="absolute inset-0 ai-beam" />

        {/* Marching grid overlay */}
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* ── Header ── */}
      <Header />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section id="hero" className="landing-section relative z-10 pt-20 md:pt-28">
        <motion.div style={{ y: heroY }}
          className="landing-container grid w-full items-center gap-14 lg:grid-cols-[1fr_1fr]">

          {/* Left — Copy */}
          <div>
            <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
              <span className="badge"><span className="badge-dot" />Ad Intelligence Platform</span>
            </motion.div>

            <h1 className="font-display mt-7 text-5xl leading-[1.03] sm:text-6xl md:text-[5.5rem]">
              <WordReveal text="Launch creatives" delay={0.08} />
              <span className="block gradient-text">
                <WordReveal text="with confidence." delay={0.35} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.65, delay:0.65 }}
              className="mt-7 max-w-lg text-lg leading-relaxed text-gray-400"
            >
              Eliminate approval delays. Validate, analyse, and preview creatives
              in minutes — not days. Move from bloated workflows to confident,
              fast decisions.
            </motion.p>

            <motion.p
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.6, delay:0.78 }}
              className="mt-3 text-sm font-medium text-purple-400/80"
            >
              Save 6–20 hours per campaign · Reduce back-and-forth across teams
            </motion.p>

            <motion.div
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.6, delay:0.9 }}
              className="mt-9 flex flex-wrap gap-4"
            >
              <Magnetic>
                <Link href="/preview" className="btn-primary">
                  Start Free Preview
                  <span className="ml-1">→</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <button className="btn-secondary">See How It Works</button>
              </Magnetic>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ duration:0.7, delay:1.1 }}
              className="mt-10 flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex -space-x-2">
                  {["#9333ea","#3b82f6","#ec4899","#10b981","#f59e0b"].map((c,i) => (
                    <div key={i} className="h-7 w-7 rounded-full border-2 border-[#020617]" style={{ background:c }} />
                  ))}
                </div>
                <span>200+ teams trust Adigator</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {Array.from({length:5}).map((_,i) => <span key={i} className="text-yellow-400">★</span>)}
                <span className="ml-1 text-gray-400">4.9 / 5</span>
              </div>
            </motion.div>
          </div>

          {/* Right — 3D CSS Scene */}
          <motion.div
            initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }}
            transition={{ duration: motionTokens.duration.hero, delay: 0.35, ease: motionTokens.ease.standard }}
          >
            <HeroScene mx={mx} my={my} />
          </motion.div>
        </motion.div>
      </section>

      <section className="landing-section relative z-10 pt-0 pb-6">
        <div className="landing-container">
          <Reveal>
            <div className="trust-strip">
              {[
                { label: "Validation Speed", value: "< 20s" },
                { label: "Creative Accuracy", value: "94.2%" },
                { label: "Avg Time Saved", value: "18h" },
              ].map((item, idx) => (
                <div key={item.label} className="trust-item">
                  <p className="trust-value">{item.value}</p>
                  <p className="trust-label">{item.label}</p>
                  {idx < 2 && <span className="trust-sep" />}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CAROUSEL SECTION (keep the original demo)
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10 pt-0">
        <div className="landing-container">
          <Reveal>
            <div className="glow-border max-w-lg mx-auto">
              <HoloCard
                className="p-6"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 dot-emerald animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Platform Demo</span>
                  </div>
                  <span className="text-xs text-gray-600">{active+1} / {carouselItems.length}</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={carouselItems[active].id}
                    initial={{ opacity:0, x:24, filter:"blur(5px)" }}
                    animate={{ opacity:1, x:0,  filter:"blur(0px)" }}
                    exit={{ opacity:0, x:-24, filter:"blur(5px)" }}
                    transition={{ duration:0.4, ease:"easeOut" }}
                    className="space-y-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{carouselItems[active].title}</h4>
                      <p className="mt-1 text-xs text-gray-400">{carouselItems[active].sub}</p>
                    </div>
                    {carouselItems[active].content}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setActive((p) => (p - 1 + carouselItems.length) % carouselItems.length)}
                    className="rounded-lg p-2 hover:bg-white/10 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setActive((p) => (p + 1) % carouselItems.length)}
                    className="rounded-lg p-2 hover:bg-white/10 transition-colors"
                  >
                    →
                  </button>
                </div>
              </HoloCard>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10 py-20">
        <div className="landing-container">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Why teams choose Adigator</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Lightning-fast validation, comprehensive insights, and instant collaboration</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(featureIcons).map(([feature, icon], i) => (
              <Reveal key={feature} delay={i * 0.1}>
                <div className="rounded-2xl p-6 backdrop-blur-sm" style={{ background: "rgba(10,15,42,0.6)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <div className="text-4xl mb-3">{icon}</div>
                  <p className="font-semibold text-white">{feature}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10 py-20">
        <div className="landing-container text-center">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Ready to ship with confidence?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">Join 200+ teams using Adigator to eliminate approval delays and launch faster</p>
            <Magnetic>
              <Link href="/preview" className="btn-primary inline-block">
                Start Free Preview
                <span className="ml-1">→</span>
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="sticky-cta-wrap"
          >
            <Link href="/preview" className="sticky-cta-btn">
              Launch Preview
              <span>→</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}