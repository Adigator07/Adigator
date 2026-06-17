import { cn } from "@/app/lib/utils";

export function Badge({ className, variant = "default", children }: {
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const variants = {
    default: "bg-white/10 text-white/80 border-white/15",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
}
