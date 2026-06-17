import { cn } from "@/app/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm", className)}>{children}</div>;
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border-b border-white/10 px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("text-sm font-bold text-white", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
