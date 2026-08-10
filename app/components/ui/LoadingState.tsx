import { AdigatorOrbitLoader } from "@/app/components/ui/AdigatorOrbitLoader";

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
    <div className={`relative flex flex-col items-center justify-center px-4 py-10 text-center ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.08),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col items-center">
        <AdigatorOrbitLoader label={title} hint={description} size="lg" tone="light" />

        {normalizedProgress !== null ? (
          <div className="mt-6 w-full max-w-xs">
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
      </div>
    </div>
  );
}
