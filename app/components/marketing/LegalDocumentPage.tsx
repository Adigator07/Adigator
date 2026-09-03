import Link from "next/link";
import MarketingFooter from "@/app/components/MarketingFooter";
import MarketingNav from "@/app/components/MarketingNav";

export const CAMPAIGN_DATA_CONFIDENTIALITY =
  "Customer campaign data remains confidential. Adigator IQ does not use customer campaign assets, briefs, creatives, or validation results to train public AI models or disclose them to other customers.";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  closing?: string;
};

type LegalDocumentPageProps = {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
  contactLabel: string;
  contactEmail: string;
};

function LegalDocumentPage({
  title,
  lastUpdated,
  intro,
  sections,
  contactLabel,
  contactEmail,
}: LegalDocumentPageProps) {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav />

      <main className="pt-28">
        <article className="marketing-section marketing-section-compact mx-auto w-[min(780px,92vw)] pb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
            Last Updated: {lastUpdated}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-black leading-tight tracking-[-0.035em]">
            {title}
          </h1>

          <div className="mt-8 space-y-5 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#C8F04D]/30 bg-[#F7FCE8] px-5 py-5 sm:px-6">
            <p className="text-sm font-semibold leading-relaxed text-[#3D4A1A] sm:text-base">
              {CAMPAIGN_DATA_CONFIDENTIALITY}
            </p>
          </div>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black tracking-tight text-[#0D0D0D] sm:text-2xl">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D0D0D]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.closing ? (
                  <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">{section.closing}</p>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-12 border-t border-[#DEDDD5] pt-10">
            <h2 className="text-xl font-black tracking-tight text-[#0D0D0D] sm:text-2xl">Contact</h2>
            <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">{contactLabel}</p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-2 inline-block text-base font-semibold text-[#0D0D0D] underline underline-offset-4 transition hover:text-[#5A7A00]"
            >
              {contactEmail}
            </a>
          </section>

          <p className="mt-10 text-sm text-[#8A8A82]">
            Anything else?{" "}
            <Link href="/contact" className="font-medium text-[#0D0D0D] underline underline-offset-2">
              Contact page
            </Link>
            . Connecting Google Ads?{" "}
            <Link href="/google-ads-oauth" className="font-medium text-[#0D0D0D] underline underline-offset-2">
              How OAuth works
            </Link>
            .
          </p>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

export default LegalDocumentPage;
