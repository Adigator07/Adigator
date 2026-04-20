"use client";

export default function Logo({ size = "md", animated = true }) {
  const scale = size === "sm" ? 0.65 : size === "lg" ? 1.4 : 1;

  return (
    <a
      href="/"
      className="inline-flex items-center gap-3 no-underline group"
      style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}
    >
      {/* ── Icon mark ─────────────────────────────── */}
      <div className="relative flex-shrink-0">
        {/* Outer glow ring */}
        <div
          className={`absolute inset-0 rounded-xl blur-md opacity-60 ${
            animated ? "group-hover:opacity-100 transition-opacity duration-500" : ""
          }`}
          style={{
            background:
              "linear-gradient(135deg, #00c58a 0%, #0ea5e9 40%, #a855f7 80%, #f97316 100%)",
          }}
        />

        {/* Icon container */}
        <div
          className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: "#0B1220" }}
        >
          <svg
            width="40"
            height="36"
            viewBox="0 0 200 165"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="iconGradTop" x1="0" y1="0" x2="200" y2="0">
                <stop offset="0%" stopColor="#00c58a" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="iconGradJaw" x1="0" y1="0" x2="200" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Back ridge */}
            <polygon points="0,90 18,42 18,145 0,145" fill="url(#iconGradTop)" opacity="0.8" />

            {/* Upper head mass */}
            <polygon
              points="14,90 60,38 145,60 175,110 175,145 14,145"
              fill="url(#iconGradTop)"
            />

            {/* A negative-space counter — background punch */}
            <polygon points="88,52 168,138 8,138" fill="#0B1220" />

            {/* Lower jaw — thin slab */}
            <polygon points="14,152 170,152 192,165 14,165" fill="url(#iconGradJaw)" />

            {/* Eye socket */}
            <circle cx="46" cy="88" r="16" fill="#0B1220" />
            {/* Iris */}
            <circle cx="46" cy="88" r="9" fill="#FFD000" />
            {/* Pupil */}
            <circle cx="46" cy="88" r="3.5" fill="#0B1220" />

            {/* 3 teeth */}
            <polygon points="116,145 124,145 120,157" fill="white" opacity="0.95" />
            <polygon points="128,145 136,145 132,157" fill="white" opacity="0.95" />
            <polygon points="140,145 148,145 144,157" fill="white" opacity="0.95" />
          </svg>
        </div>
      </div>

      {/* ── Wordmark ──────────────────────────────── */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-wider text-2xl bg-clip-text text-transparent select-none ${
            animated ? "group-hover:brightness-110 transition-all duration-300" : ""
          }`}
          style={{
            backgroundImage:
              "linear-gradient(90deg, #00c58a 0%, #0ea5e9 35%, #a855f7 70%, #f97316 100%)",
            backgroundSize: animated ? "200% 100%" : "100% 100%",
            animation: animated ? "gradientShift 4s ease infinite" : "none",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ADIGATOR
          <span
            style={{
              fontWeight: 300,
              fontSize: "0.72em",
              letterSpacing: "0.04em",
              opacity: 0.75,
            }}
          >
            .IN
          </span>
        </span>
        <span
          className="text-xs tracking-widest mt-0.5 font-normal"
          style={{ color: "#DDE6F5", opacity: 0.35, letterSpacing: "0.22em" }}
        >
          INTELLIGENCE
        </span>
      </div>

      {/* Keyframe animation injected once */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
      `}</style>
    </a>
  );
}
