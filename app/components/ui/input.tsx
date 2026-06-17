import { cn } from "@/app/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-500/50",
        className,
      )}
      {...props}
    />
  );
}
