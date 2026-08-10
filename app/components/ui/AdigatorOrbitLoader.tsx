"use client";

type AdigatorOrbitLoaderProps = {
  label?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
};

const SIZE_MAP = {
  sm: { box: "h-40 w-40", mark: "h-32 w-32" },
  md: { box: "h-56 w-56", mark: "h-48 w-48" },
  lg: { box: "h-72 w-72 sm:h-80 sm:w-80", mark: "h-60 w-60 sm:h-[17rem] sm:w-[17rem]" },
} as const;

/** Exact brand crocodile artwork */
const CROC_SRC = "/assets/brand/adigator-crocodile.png";

function AdigatorCrocodileMark({
  className = "h-48 w-48",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <div className={`agi-croc-mark relative overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <div className="agi-croc-glow absolute inset-[-18%] rounded-full" />

      {/* Circular glass disc only — never a square plate */}
      <div
        className={`absolute inset-0 rounded-full ${
          isDark
            ? "bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.14),rgba(15,23,42,0.35)_70%)]"
            : "bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.95),rgba(240,249,255,0.75)_72%)]"
        }`}
      />

      <div className="absolute inset-[10%] flex items-center justify-center overflow-hidden rounded-full">
        {/* Exact artwork — wipe draw (white bg neutralized with multiply on light) */}
        <img
          src={CROC_SRC}
          alt=""
          className={`agi-croc-ink h-full w-full object-contain ${isDark ? "agi-croc-ink--dark" : "agi-croc-ink--light"}`}
          draggable={false}
        />

        {/* Exact artwork colorized */}
        <svg
          viewBox="0 0 420 340"
          className="agi-croc-color absolute inset-0 h-full w-full"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="agiExactCrocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8">
                <animate attributeName="stop-color" values="#38BDF8;#34D399;#818CF8;#F472B6;#FBBF24;#38BDF8" dur="2.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="35%" stopColor="#34D399">
                <animate attributeName="stop-color" values="#34D399;#818CF8;#F472B6;#FBBF24;#38BDF8;#34D399" dur="2.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="70%" stopColor="#F472B6">
                <animate attributeName="stop-color" values="#F472B6;#FBBF24;#38BDF8;#34D399;#818CF8;#F472B6" dur="2.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#FBBF24">
                <animate attributeName="stop-color" values="#FBBF24;#38BDF8;#34D399;#818CF8;#F472B6;#FBBF24" dur="2.5s" repeatCount="indefinite" />
              </stop>
            </linearGradient>

            <filter id="agiExactCrocInvert" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="
                  -1 0 0 0 1
                   0 -1 0 0 1
                   0 0 -1 0 1
                   0 0 0 1 0"
              />
            </filter>

            <mask id="agiExactCrocMask" maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="340">
              <image
                href={CROC_SRC}
                x="0"
                y="0"
                width="420"
                height="340"
                preserveAspectRatio="xMidYMid meet"
                filter="url(#agiExactCrocInvert)"
              />
            </mask>
          </defs>

          <rect
            x="0"
            y="0"
            width="420"
            height="340"
            fill="url(#agiExactCrocGrad)"
            mask="url(#agiExactCrocMask)"
          />
        </svg>
      </div>

      <div className="agi-croc-pen" />
    </div>
  );
}

export function AdigatorOrbitLoader({
  label = "Loading",
  hint,
  size = "md",
  tone = "light",
  className = "",
}: AdigatorOrbitLoaderProps) {
  const dims = SIZE_MAP[size];
  const isDark = tone === "dark";

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className={`agi-orbit relative flex items-center justify-center rounded-full ${dims.box}`}>
        <div className={`agi-orbit-glow ${isDark ? "agi-orbit-glow--dark" : ""}`} aria-hidden />
        <div className={`agi-orbit-ring ${isDark ? "agi-orbit-ring--dark" : ""}`} aria-hidden />
        <div className={`agi-orbit-ring agi-orbit-ring--inner ${isDark ? "agi-orbit-ring--dark" : ""}`} aria-hidden />

        <div className="relative z-10 flex items-center justify-center rounded-full">
          <AdigatorCrocodileMark className={dims.mark} tone={tone} />
        </div>
      </div>

      {label ? (
        <p
          className={`mt-6 text-sm font-semibold uppercase tracking-[0.24em] ${
            isDark ? "text-sky-100/85" : "text-sky-700"
          }`}
        >
          {label}
        </p>
      ) : null}
      {hint ? (
        <p className={`mt-2 max-w-md text-center text-sm leading-relaxed ${isDark ? "text-slate-300/85" : "text-slate-500"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
