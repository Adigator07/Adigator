"use client";

/**
 * SkeletonLoader.jsx
 * Reusable skeleton loading components with shimmer animation.
 */

export function SkeletonCard({ className = "", height = "h-32" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 ${height} ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
}

export function SkeletonText({ className = "", width = "w-full" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white/5 h-4 ${width} ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <SkeletonText width="w-8" className="h-8 rounded-xl" />
      <SkeletonText width="w-16" className="h-7" />
      <SkeletonText width="w-24" className="h-3" />
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <SkeletonCard height="h-24" />
      <SkeletonText width="w-3/4" />
      <SkeletonText width="w-1/2" className="h-3" />
      <div className="flex gap-2 pt-1">
        <SkeletonText width="w-16" className="h-8 rounded-lg" />
        <SkeletonText width="w-16" className="h-8 rounded-lg" />
      </div>
    </div>
  );
}
