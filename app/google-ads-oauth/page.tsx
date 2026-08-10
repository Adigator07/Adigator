import Link from "next/link";
import MarketingFooter from "@/app/components/MarketingFooter";
import MarketingNav from "@/app/components/MarketingNav";

const STEPS = [
  {
    title: "Sign in to Adigator",
    body: "Create or sign in to your Adigator account. Google Ads connection is optional and only starts when you choose to connect.",
  },
  {
    title: "Start Google Ads OAuth",
    body: "From Adigator, click Connect Google Ads. You are redirected to Google’s official OAuth consent screen — not a custom login form controlled by Adigator.",
  },
  {
    title: "Choose your Google account",
    body: "Sign in with the Google account that owns or administers the Google Ads accounts you want to use with Adigator.",
  },
  {
    title: "Review and authorize permissions",
    body: "Google shows the requested scopes (including Google Ads / AdWords access plus basic identity such as email and profile). You can approve or deny access.",
  },
  {
    title: "Return to Adigator",
    body: "After you authorize, Google redirects you back to Adigator. We store the authorized connection so you can import campaign context and use Google Ads–related validation workflows.",
  },
  {
    title: "Disconnect anytime",
    body: "You can disconnect Google Ads inside Adigator and revoke access at any time from your Google Account permissions settings.",
  },
];

export default function GoogleAdsOAuthPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav />

      <main className="pt-28">
        <article className="marketing-section marketing-section-compact mx-auto w-[min(820px,92vw)] pb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
            Integrations · Google Ads
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-black leading-tight tracking-[-0.035em]">
            How users connect Google Ads via OAuth
          </h1>
          <p className="mt-6 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
            Adigator is a legitimate SaaS application for pre-launch campaign validation. Our optional Google Ads
            integration uses Google OAuth so customers can authorize Adigator to access Google Ads accounts they own
            or administer.
          </p>

          <div className="mt-8 rounded-2xl border border-[#C8F04D]/40 bg-[#F7FCE8] px-5 py-5 sm:px-6">
            <p className="text-sm font-semibold leading-relaxed text-[#3D4A1A] sm:text-base">
              Users authorize access to their own Google Ads accounts. Adigator does not access a Google Ads account
              unless the signed-in user explicitly grants permission on Google&apos;s OAuth consent screen.
            </p>
          </div>

          <section className="mt-12">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">What Adigator does</h2>
            <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
              Adigator helps agencies, brands, and AdOps teams catch campaign mistakes before media spend begins. We
              validate creatives, campaign setup, destinations, and platform readiness across Google Ads, Meta Ads, and
              programmatic channels.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
              When Google Ads is connected, Adigator uses authorized access to support product workflows such as listing
              accessible accounts and importing campaign context for validation — not to take over your Google Ads
              account without your direction.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">OAuth connection steps</h2>
            <ol className="mt-6 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D0D0D] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#0D0D0D] sm:text-lg">{step.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-[#5A5A55]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Permissions we request</h2>
            <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
              During OAuth, Google may show scopes such as:
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Google Ads (AdWords) API access — to work with accounts and campaign data you authorize",
                "OpenID, email, and profile — to identify the Google account that completed consent",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D0D0D]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Authorization statement</h2>
            <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
              By connecting Google Ads inside Adigator, the user confirms they are authorizing Adigator to access Google
              Ads accounts that they own or are authorized to manage. Adigator does not request access to Google Ads
              accounts on behalf of users who have not completed this consent flow.
            </p>
          </section>

          <section className="mt-12 border-t border-[#DEDDD5] pt-10">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Related policies</h2>
            <ul className="mt-4 space-y-2 text-base text-[#5A5A55] sm:text-lg">
              <li>
                <Link href="/privacy" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/about" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  About Adigator
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-base leading-relaxed text-[#5A5A55]">
              Questions about Google Ads access:{" "}
              <a href="mailto:hello@adigator.in" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                hello@adigator.in
              </a>
            </p>
          </section>
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}
