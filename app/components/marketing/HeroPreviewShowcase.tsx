import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";

const PLATFORMS = ["Meta", "Google", "Programmatic"];

export default function HeroPreviewShowcase({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[#DEDDD5] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6 sm:py-5 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Live Preview</p>
          <h2 className="mt-1 text-base font-bold tracking-tight text-[#0D0D0D] sm:text-lg">
            See your creative before it goes live
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#5B5B55]">
            Don&apos;t guess how your ads will look — preview placements before you spend.
          </p>
          <p className="mt-2 text-xs text-[#8A8A82]">
            {PLATFORMS.join(" · ")} · Feed · Story · Display
          </p>
        </div>

        <Link
          href={MARKETING_CTA.href}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#D0D0C8] bg-[#F5F5F0] px-4 py-2 text-sm font-semibold text-[#0D0D0D] transition hover:border-[#C8F04D] hover:bg-[#EEF5D4] sm:self-center"
        >
          {MARKETING_CTA.label}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
