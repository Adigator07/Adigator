import Link from "next/link";

import { MARKETING_FOOTER_DESCRIPTION, MARKETING_FOOTER_LEGAL_LINKS } from "@/app/lib/siteNavigation";

type MarketingFooterProps = {
  description?: string;
};

export default function MarketingFooter({ description = MARKETING_FOOTER_DESCRIPTION }: MarketingFooterProps) {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-16">
      <div className="mx-auto w-[min(1280px,92vw)]">
        <div className="max-w-md">
          <p className="text-2xl font-black tracking-tight">Adigator</p>
          <p className="mt-3 text-sm leading-relaxed text-[#66665F]">{description}</p>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#DDDCD4] pt-6 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:gap-y-2">
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
