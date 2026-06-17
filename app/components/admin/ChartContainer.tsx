"use client";

import { useEffect, useState } from "react";

/** Ensures Recharts ResponsiveContainer has measurable dimensions. */
export function ChartContainer({
  height = 256,
  children,
  className = "",
}: {
  height?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`animate-pulse rounded-xl bg-white/5 ${className}`}
        style={{ width: "100%", height, minHeight: height }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ width: "100%", height, minHeight: height, minWidth: 0 }}
    >
      {children}
    </div>
  );
}
