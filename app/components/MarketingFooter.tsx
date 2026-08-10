import Link from "next/link";

import {
  MARKETING_FOOTER_DESCRIPTION,
  MARKETING_FOOTER_LEGAL_LINKS,
  MARKETING_FOOTER_PRODUCT_LINKS,
  MARKETING_FOOTER_RESOURCE_LINKS,
} from "@/app/lib/siteNavigation";

type MarketingFooterProps = {
  description?: string;
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A8A82]">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm font-medium text-[#3D3D38] transition-colors hover:text-[#0D0D0D]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MarketingFooter({ description = MARKETING_FOOTER_DESCRIPTION }: MarketingFooterProps) {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0]">
      <div className="mx-auto w-[min(1280px,92vw)] py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-2xl font-black tracking-tight">Adigator</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66665F]">{description}</p>
          </div>
          <FooterColumn title="Product" links={MARKETING_FOOTER_PRODUCT_LINKS} />
          <FooterColumn title="Resources" links={MARKETING_FOOTER_RESOURCE_LINKS} />
          <FooterColumn title="Company" links={MARKETING_FOOTER_LEGAL_LINKS} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#DDDCD4] pt-6 text-sm text-[#66665F] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Adigator. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:justify-end sm:text-sm">
            <Link href="/privacy" className="transition-colors hover:text-[#0D0D0D]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#0D0D0D]">
              Terms
            </Link>
            <Link href="/contact" className="transition-colors hover:text-[#0D0D0D]">
              Contact
            </Link>
            <Link href="/google-ads-oauth" className="transition-colors hover:text-[#0D0D0D]">
              Google Ads OAuth
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
