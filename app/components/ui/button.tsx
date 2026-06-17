import { cn } from "@/app/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  const variants = {
    default: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    outline: "border border-white/15 bg-transparent text-white hover:bg-white/5",
    ghost: "text-white/70 hover:bg-white/5 hover:text-white",
    destructive: "bg-red-600 text-white hover:bg-red-500",
  };
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-lg font-semibold transition disabled:opacity-50", variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
