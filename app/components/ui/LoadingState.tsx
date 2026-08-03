import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  title?: string;
  description?: string;
  className?: string;
  progress?: number;
};

export function LoadingState({
  title = "Loading",
  description = "Please wait while we prepare the view.",
  className = "",
  progress,
}: LoadingStateProps) {
  const normalizedProgress = typeof progress === "number"
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(240,249,255,0.92))] px-6 py-10 text-center shadow-sm ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="select-none text-[clamp(2.4rem,9vw,6.5rem)] font-black tracking-[0.32em] text-sky-200/25 drop-shadow-[0_0_26px_rgba(56,189,248,0.12)] motion-safe:animate-pulse motion-reduce:animate-none">
          ADIGATOR
        </span>
      </div>

      <div className="relative flex min-h-55 flex-col items-center justify-center">
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-sky-400/10 blur-xl" />
          <div className="absolute inset-2 rounded-full border border-sky-200/70" />
          <div className="absolute inset-0 rounded-full border-2 border-sky-300/45 border-t-sky-500 motion-safe:animate-spin motion-reduce:animate-none" />
          <div className="absolute inset-[18%] rounded-full border border-cyan-300/60 border-b-transparent motion-safe:animate-spin motion-reduce:animate-none [animation-direction:reverse] [animation-duration:1.7s]" />
          <Loader2 className="relative h-7 w-7 text-sky-600" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">{title}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>

        {normalizedProgress !== null ? (
          <div className="mt-5 w-full max-w-sm">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Load Progress</span>
              <span>{normalizedProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-[width] duration-300 ease-out"
                style={{ width: `${normalizedProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse motion-reduce:animate-none" />
          Syncing live workspace context
        </div>
      </div>
    </div>
  );
}
