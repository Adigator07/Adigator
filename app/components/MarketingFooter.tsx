import Link from "next/link";

import { MARKETING_FOOTER_DESCRIPTION, MARKETING_FOOTER_LEGAL_LINKS } from "@/app/lib/siteNavigation";

type MarketingFooterProps = {
  description?: string;
};

export default function MarketingFooter({ description = MARKETING_FOOTER_DESCRIPTION }: MarketingFooterProps) {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-10 sm:py-12">
      <div className="mx-auto flex w-[min(1280px,92vw)] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="max-w-md shrink-0">
          <p className="text-2xl font-black tracking-tight">Adigator</p>
          <p className="mt-2 text-sm leading-relaxed text-[#66665F]">{description}</p>
        </div>

        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2 lg:justify-end">
          <span className="text-[#66665F]">© 2026 Adigator</span>
          {MARKETING_FOOTER_LEGAL_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-medium text-[#3D3D38] transition-colors hover:text-[#0D0D0D]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
