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

/* ═══════════════════════════════════════════════════════
   1. CUSTOM CURSOR
═══════════════════════════════════════════════════════ */
function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle"|"clicking"|"hovering">("idle");

  useEffect(() => {
    let rafId: number;
    let tx = -100, ty = -100;  // target (dot)
    let rx = -100, ry = -100;  // ring (lagged)

    const onMove = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
    };
    const onDown  = () => setState("clicking");
    const onUp    = () => setState("idle");

    const addHover = (el: Element) => el.addEventListener("mouseenter", () => setState("hovering"));
    const remHover = (el: Element) => el.addEventListener("mouseleave", () => setState("idle"));
    const interactables = document.querySelectorAll("a,button,[data-cursor-hover]");
    interactables.forEach(el => { addHover(el); remHover(el); });

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
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

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

    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let mx = W / 2, my = H / 2;
    let animId: number;

    const N = 45;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.4,
    }));

    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      // connections between particles
      for (let i = 0; i < N; i++) {
        const a = pts[i];
        for (let j = i + 1; j < N; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139,92,246,${0.14 * (1 - d / 110)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
        // connection to mouse
        const mdx = a.x - mx, mdy = a.y - my;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 160) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(168,85,247,${0.22 * (1 - md / 160)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }

        // draw particle
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,92,246,0.65)";
        ctx.fill();

        // move
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }

      // draw mouse glow node
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 8);
      grad.addColorStop(0, "rgba(192,132,252,0.8)");
      grad.addColorStop(1, "rgba(192,132,252,0)");
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    };

    draw();

    const onMove   = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("mousemove", onMove,   { passive: true });
    window.addEventListener("resize",   onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize",   onResize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" />;
}

/* ═══════════════════════════════════════════════════════
   3. CSS PRESERVE-3D HERO SCENE
═══════════════════════════════════════════════════════ */
function HeroScene({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const rY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 32, damping: 18 });
  const rX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 32, damping: 18 });

  return (
    <div className="scene-wrap w-full h-[420px] md:h-[520px]">
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
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-emerald flex-shrink-0" />
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
                    <div className={`bar-fill bg-gradient-to-r ${item.from} ${item.to}`} style={{ "--w": item.w } as React.CSSProperties} />
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <span className="text-xs font-bold text-purple-200">Overall Score</span>
                <span className="font-display text-2xl font-bold text-purple-200">91%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── LAYER +65: comparison tile (right, mid-front) ─── */}
        <div className="scene-layer scene-item-compare" style={{ transform: "translateZ(65px) translate(68%, -38%) scale(0.82)" }}>
          <div className="w-48 rounded-2xl p-4"
            style={{ background: "rgba(8,12,36,0.88)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 30px rgba(147,51,234,0.15), 0 16px 40px rgba(0,0,0,0.6)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-3">Creative Match</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[{v:"A",s:"71%",best:false},{v:"B",s:"94%",best:true},{v:"C",s:"65%",best:false}].map(c=>(
                <div key={c.v} className="rounded-lg p-1.5 flex flex-col gap-1"
                  style={{ background: c.best ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.04)", border: c.best ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-8 rounded-md" style={{ background: c.best ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.08)" }} />
                  <p className={`text-[8px] font-bold ${c.best ? "text-purple-300" : "text-gray-500"}`}>{c.best ? "★ Best" : `V${c.v}`}</p>
                  <p className={`text-[7px] ${c.best ? "text-purple-400" : "text-gray-600"}`}>{c.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── LAYER +110: score badge (floating, closest) ─── */}
        <div className="scene-layer scene-item-iab" style={{ transform: "translateZ(110px) translate(-12%, 68%) scale(0.92)", animation: "float-a 4.5s ease-in-out infinite" }}>
          <div className="rounded-2xl px-4 py-3 text-center"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(52,211,153,0.35)", boxShadow: "0 0 30px rgba(52,211,153,0.2), 0 12px 32px rgba(0,0,0,0.5)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1">IAB Ready</p>
            <p className="text-xl font-display font-bold text-emerald-300">✓ All Clear</p>
          </div>
        </div>

        {/* ─── LAYER +130: time saved pill (topmost) ─── */}
        <div className="scene-layer scene-item-saved" style={{ transform: "translateZ(130px) translate(52%, 68%) scale(0.88)", animation: "float-b 5.5s ease-in-out infinite" }}>
          <div className="rounded-xl px-3.5 py-2.5"
            style={{ background: "rgba(147,51,234,0.2)", border: "1px solid rgba(168,85,247,0.45)", boxShadow: "0 0 24px rgba(168,85,247,0.3), 0 8px 24px rgba(0,0,0,0.5)" }}>
            <p className="text-[8px] text-purple-400 uppercase tracking-widest">Saved</p>
            <p className="font-display text-2xl font-bold text-purple-200">18h</p>
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
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-emerald flex-shrink-0" />
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
              <div className={`bar-fill bg-gradient-to-r ${it.c}`} style={{ "--w": it.w } as React.CSSProperties} />
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
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(p => (p + 1) % carouselItems.length), 2700);
    return () => clearInterval(id);
  }, [paused]);

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
    <main className="relative min-h-screen bg-[#020617] text-white">

      {/* ── Custom Cursor ── */}
      <CustomCursor />

      {/* ── Canvas Particles ── */}
      <CanvasParticles />

      {/* ── Film Grain ── */}
      <div className="grain" />

      {/* ── Atmospheric Orbs (mouse-reactive) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div className="absolute rounded-full"
          style={{ top: "-10%", left: "-12%", width: 700, height: 700, background: "radial-gradient(circle, rgba(139,92,246,0.17) 0%, transparent 68%)", filter: "blur(55px)", x: ox1, y: oy1 }} />
        <motion.div className="absolute rounded-full"
          style={{ top: "20%", right: "-12%", width: 580, height: 580, background: "radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 68%)", filter: "blur(55px)", x: ox2, y: oy2 }} />
        <motion.div className="absolute rounded-full"
          style={{ bottom: "-8%", left: "38%", width: 500, height: 500, background: "radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 68%)", filter: "blur(55px)", x: ox3, y: oy3 }} />

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
            transition={{ duration:0.85, delay:0.35, ease:[0.22,1,0.36,1] }}
          >
            <HeroScene mx={mx} my={my} />
          </motion.div>
        </motion.div>
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

                <div className="mt-5 flex items-center justify-center gap-2">
                  {carouselItems.map((c,i) => (
                    <button key={c.id} type="button" onClick={() => setActive(i)}
                      className="rounded-full transition-all duration-300"
                      style={{ height:8, width: i===active ? 28 : 8, background: i===active ? "linear-gradient(90deg,#9333ea,#ec4899)" : "rgba(255,255,255,0.2)", boxShadow: i===active ? "0 0 12px rgba(168,85,247,0.6)" : "none" }}
                      aria-label={c.title} />
                  ))}
                </div>
              </HoloCard>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════ */}
      <section className="relative z-10 py-4">
        <div className="landing-container">
          <Reveal>
            <div className="stats-strip">
              {[
                { v:"6–20h", l:"Saved per campaign" },
                { v:"200+",  l:"Teams using Adigator" },
                { v:"~99%",  l:"Faster than manual QA" },
                { v:"4.9★",  l:"Average rating" },
              ].map((s,i)=>(
                <div key={s.l} className="stat-item">
                  <span className="stat-value">{s.v}</span>
                  <span className="stat-label">{s.l}</span>
                  {i < 3 && <div className="stat-sep" />}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROBLEM
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <HoloCard className="overflow-hidden">
            <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
              <Reveal>
                <span className="badge"><span className="badge-dot" />The Problem</span>
                <h2 className="font-display mt-5 text-3xl font-semibold text-white md:text-4xl leading-tight">
                  Creative workflows are slower than they should be
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    "Manual validation takes hours",
                    "Multiple review cycles delay approvals",
                    "Cross-team coordination introduces gaps",
                    "Campaign launches depend on stakeholder availability",
                  ].map((it,i)=>(
                    <motion.li key={it}
                      initial={{ opacity:0, x:-16 }}
                      whileInView={{ opacity:1, x:0 }}
                      viewport={{ once:true, amount:0.5 }}
                      transition={{ duration:0.5, delay:i*0.09 }}
                      className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 dot-purple flex-shrink-0" />
                      {it}
                    </motion.li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="rounded-2xl p-7 h-full flex flex-col justify-center"
                  style={{ background:"linear-gradient(135deg,rgba(239,68,68,0.1),rgba(236,72,153,0.07))", border:"1px solid rgba(239,68,68,0.2)" }}>
                  <span className="badge" style={{ color:"#fca5a5", borderColor:"rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)" }}>
                    <span className="badge-dot" style={{ background:"#fca5a5", "--glow-c":"rgba(252,165,165,0.7)" } as React.CSSProperties} />
                    Reality Check
                  </span>
                  <p className="mt-5 text-xl font-semibold text-white leading-snug">
                    Most campaigns lose hours — sometimes days — before they go live.
                  </p>
                  <div className="mt-6 rounded-xl p-5" style={{ background:"rgba(0,0,0,0.25)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-xs text-gray-400">Without optimisation</p>
                    <p className="font-display mt-2 text-4xl font-bold text-red-300">6–20 hours</p>
                    <p className="mt-1 text-xs text-gray-500">per campaign + approval delays</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          VALUE
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <Reveal>
            <h2 className="font-display mx-auto max-w-3xl text-center text-3xl font-semibold text-white md:text-5xl">
              From hours of work to{" "}
              <span className="gradient-text">minutes of clarity</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <Reveal>
              <HoloCard className="p-6 md:p-8 h-full">
                <span className="badge" style={{ color:"rgba(156,163,175,1)", borderColor:"rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)" }}>Manual Process Today</span>
                <div className="mt-6 space-y-3">
                  {[
                    { task:"QA & validation",      time:"1–3 hours" },
                    { task:"Internal reviews",      time:"1–3 hours" },
                    { task:"Reporting & previews",  time:"2–4 hours" },
                    { task:"Approval cycles",        time:"Unpredictable" },
                  ].map(it=>(
                    <div key={it.task} className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <span className="text-sm text-gray-400">{it.task}</span>
                      <span className="text-sm font-bold text-red-300">{it.time}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl px-5 py-4"
                  style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
                  <p className="text-xs text-red-300/70">Total</p>
                  <p className="font-display mt-2 text-4xl font-bold text-red-300">6–20+ hours</p>
                </div>
              </HoloCard>
            </Reveal>
            <Reveal delay={0.12}>
              <HoloCard className="p-6 md:p-8 h-full"
                style={{ background:"rgba(12,8,40,0.85)", borderColor:"rgba(168,85,247,0.2)" } as React.CSSProperties}>
                <span className="badge">With Adigator</span>
                <div className="mt-6 space-y-3">
                  {["Upload your creatives","Analyse automatically in seconds","Preview in real environments","Share results with team","Launch with confidence"].map((it,i)=>(
                    <motion.div key={it}
                      initial={{ opacity:0, x:18 }}
                      whileInView={{ opacity:1, x:0 }}
                      viewport={{ once:true, amount:0.5 }}
                      transition={{ duration:0.45, delay:i*0.09 }}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.2)" }}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-purple-300 flex-shrink-0"
                        style={{ background:"rgba(168,85,247,0.25)" }}>{i+1}</span>
                      <span className="text-sm text-purple-100">{it}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl px-5 py-4"
                  style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.3)" }}>
                  <p className="text-xs text-emerald-300/70">Total</p>
                  <p className="font-display mt-2 text-4xl font-bold text-emerald-300">Minutes</p>
                </div>
              </HoloCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WORKFLOW STEPS
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <Reveal>
              <h2 className="font-display max-w-xl text-3xl font-semibold text-white md:text-4xl leading-tight">
                A three-stage system your team can repeat every campaign
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="hidden md:block max-w-xs text-sm text-gray-400 leading-relaxed">
                Structured, repeatable. Each stage removes friction and accelerates approval velocity.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { n:"01", title:"Validate Instantly",       desc:"Upload creatives. Instantly validate against all platform standards, sizes, and specifications.", accent:"rgba(147,51,234,0.15)", dot:"bg-purple-400 dot-purple", grd:"from-purple-500/15 to-transparent" },
              { n:"02", title:"Identify Winners",         desc:"Get actionable insights in seconds. See which creatives perform best before launch.",             accent:"rgba(59,130,246,0.15)",  dot:"bg-blue-400   dot-cyan",   grd:"from-blue-500/15   to-transparent" },
              { n:"03", title:"Present with Confidence",  desc:"Real preview environments and detailed reports. Share results with stakeholders instantly.",       accent:"rgba(236,72,153,0.15)",  dot:"bg-pink-400   dot-pink",   grd:"from-pink-500/15   to-transparent" },
            ].map((s,i)=>(
              <Reveal key={s.n} delay={i*0.1}>
                <HoloCard className={`p-7 h-full bg-gradient-to-br ${s.grd}`}>
                  <div className="flex items-start justify-between mb-5">
                    <span className="font-display text-5xl font-bold text-white/8">{s.n}</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{s.desc}</p>
                </HoloCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold text-white md:text-4xl mb-10">
              Built for teams that{" "}
              <span className="gradient-text-cool">move fast</span>
            </h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title:"IAB ready in minutes",          detail:"All standard banner sizes validated automatically." },
              { title:"Mobile + desktop in one view",  detail:"See real placements across devices before launch." },
              { title:"Streamlined approvals",         detail:"Share findings instantly. Eliminate approval delays." },
              { title:"Reduce back-and-forth",         detail:"Actionable insights mean fewer revision rounds." },
              { title:"Instant creative comparison",   detail:"Identify top performers before spending budget." },
              { title:"Real-time collaboration",       detail:"Share reports across teams instantly." },
            ].map((f,i)=>(
              <Reveal key={f.title} delay={i*0.07}>
                <motion.div
                  className="feat-card h-full"
                  whileHover={{ scale:1.025 }}
                  onMouseMove={(e)=>{
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--cx", `${((e.clientX-r.left)/r.width)*100}%`);
                    e.currentTarget.style.setProperty("--cy", `${((e.clientY-r.top)/r.height)*100}%`);
                  }}
                  transition={{ duration:0.12, ease:"easeOut" }}
                >
                  <div className="feat-icon">{featureIcons[f.title] ?? "✦"}</div>
                  <p className="text-sm font-bold uppercase tracking-widest text-white">{f.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{f.detail}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BENEFITS + TESTIMONIAL
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <HoloCard className="overflow-hidden">
            <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
              <div>
                <Reveal>
                  <span className="badge"><span className="badge-dot" />Who It's For</span>
                  <h2 className="font-display mt-5 text-3xl font-semibold text-white md:text-4xl leading-tight">
                    For agencies and in-house teams running display campaigns
                  </h2>
                </Reveal>
                <div className="mt-8 space-y-3">
                  {[
                    "Launch campaigns on schedule — every time",
                    "Reduce approval delays and approval cycles",
                    "Make confident decisions with actionable data",
                  ].map((it,i)=>(
                    <Reveal key={it} delay={i*0.1}>
                      <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-sm text-gray-300"
                        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-purple-300 flex-shrink-0"
                          style={{ background:"rgba(168,85,247,0.25)" }}>✓</span>
                        {it}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
              <Reveal delay={0.15}>
                <div className="testimonial h-full flex flex-col justify-between">
                  <p className="mt-6 text-lg leading-relaxed text-white/90 relative z-10">
                    "We eliminated our entire manual QA process. Adigator became
                    the pre-flight check for every campaign."
                  </p>
                  <div className="mt-8 flex items-center gap-3 relative z-10">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background:"linear-gradient(135deg,#9333ea,#ec4899)" }}>CD</div>
                    <div>
                      <p className="text-sm font-bold text-white">Creative Director</p>
                      <p className="text-xs text-gray-500">Growth Agency</p>
                    </div>
                    <div className="ml-auto flex">{Array.from({length:5}).map((_,k)=><span key={k} className="text-yellow-400 text-xs">★</span>)}</div>
                  </div>
                </div>
              </Reveal>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════ */}
      <section className="landing-section relative z-10 text-center overflow-hidden"
        style={{ borderTop:"1px solid rgba(255,255,255,0.07)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        {/* Glow rings */}
        {[400,600,800].map(s=>(
          <div key={s} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width:s, height:s, border:"1px solid rgba(168,85,247,0.08)", borderRadius:"50%" }} />
        ))}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background:"radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)", filter:"blur(30px)" }} />

        <div className="landing-container relative z-10">
          <Reveal>
            <span className="badge"><span className="badge-dot" />Get Started Free</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display mx-auto mt-6 max-w-3xl text-4xl font-semibold text-white md:text-5xl lg:text-6xl leading-tight">
              Stop spending hours reviewing creatives.
              <span className="block gradient-text mt-1">Start launching with confidence.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-base text-gray-400">
              Validate, preview, and finalise creatives in minutes — not days.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Magnetic>
                <Link href="/preview" className="btn-primary">
                  Start Free Preview →
                </Link>
              </Magnetic>
              <Magnetic>
                <button className="btn-secondary">Schedule a Demo</button>
              </Magnetic>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-8 text-xs text-gray-600">
              No credit card required · Free to get started · Cancel anytime
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 py-8 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-600">
          © 2026 Adigator · Ad intelligence for modern teams
        </p>
      </footer>

    </main>
  );
}