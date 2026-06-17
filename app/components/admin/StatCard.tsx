import type { ComponentType } from "react";
import { Card, CardContent } from "@/app/components/ui/card";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "amber",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent?: "amber" | "emerald" | "sky" | "violet";
}) {
  const accents = {
    amber: "text-amber-300 bg-amber-500/15 border-amber-500/25",
    emerald: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25",
    sky: "text-sky-300 bg-sky-500/15 border-sky-500/25",
    violet: "text-violet-300 bg-violet-500/15 border-violet-500/25",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
          <p className="mt-1 text-3xl font-black text-white tabular-nums">{value}</p>
          {sub ? <p className="mt-1 text-xs text-white/45">{sub}</p> : null}
        </div>
        <div className={`rounded-xl border p-2.5 ${accents[accent]}`}>
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}
