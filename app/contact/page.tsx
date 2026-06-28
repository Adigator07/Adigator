"use client";

import Link from "next/link";
import { useState } from "react";
import { MARKETING_DEMO_VIDEO } from "@/app/lib/siteNavigation";
import MarketingFooter from "@/app/components/MarketingFooter";
import MarketingNav from "@/app/components/MarketingNav";

const HELP_OPTIONS = [
  "Book a Demo",
  "Sales Inquiry",
  "Partnership",
  "Product Question",
  "Technical Support",
  "Other",
] as const;

type ContactFormState = {
  workEmail: string;
  fullName: string;
  company: string;
  jobTitle: string;
  country: string;
  helpType: string;
  message: string;
  agreedToTerms: boolean;
};

const INITIAL_FORM: ContactFormState = {
  workEmail: "",
  fullName: "",
  company: "",
  jobTitle: "",
  country: "",
  helpType: "",
  message: "",
  agreedToTerms: false,
};

const inputClassName =
  "w-full rounded-xl border border-[#DEDDD5] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#0D0D0D]/10";

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">
      {children}
      {required ? <span className="text-[#B45309]"> *</span> : null}
    </span>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  function updateField<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/contact" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[clamp(2rem,5.5vw,3.75rem)] font-black leading-[1.04] tracking-[-0.04em]">
              Let&apos;s Talk About Your Campaigns
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#5C5C56] sm:text-xl">
              Whether you&apos;re exploring Adigator, booking a demo, or looking to improve your campaign workflow,
              we&apos;d love to hear from you.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
            <div className="rounded-[28px] border border-[#DEDDD5] bg-white px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:px-10 sm:py-10">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Tell us about yourself</h2>

              {submitted ? (
                <div className="mt-8 rounded-2xl border border-[#C8F04D]/40 bg-[#C8F04D]/10 px-6 py-8 text-center">
                  <p className="text-lg font-bold text-[#0D0D0D]">Thanks for reaching out.</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5C5C56]">
                    We&apos;ve received your message and will be in touch shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <FieldLabel required>Work Email</FieldLabel>
                      <input
                        type="email"
                        name="workEmail"
                        required
                        autoComplete="email"
                        value={form.workEmail}
                        onChange={(event) => updateField("workEmail", event.target.value)}
                        className={inputClassName}
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <FieldLabel required>Full Name</FieldLabel>
                      <input
                        type="text"
                        name="fullName"
                        required
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                        className={inputClassName}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel required>Company</FieldLabel>
                      <input
                        type="text"
                        name="company"
                        required
                        autoComplete="organization"
                        value={form.company}
                        onChange={(event) => updateField("company", event.target.value)}
                        className={inputClassName}
                      />
                    </label>

                    <label className="block">
                      <FieldLabel>Job Title</FieldLabel>
                      <input
                        type="text"
                        name="jobTitle"
                        autoComplete="organization-title"
                        value={form.jobTitle}
                        onChange={(event) => updateField("jobTitle", event.target.value)}
                        className={inputClassName}
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <FieldLabel>Country</FieldLabel>
                      <input
                        type="text"
                        name="country"
                        autoComplete="country-name"
                        value={form.country}
                        onChange={(event) => updateField("country", event.target.value)}
                        className={inputClassName}
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <FieldLabel>How can we help?</FieldLabel>
                      <select
                        name="helpType"
                        required
                        value={form.helpType}
                        onChange={(event) => updateField("helpType", event.target.value)}
                        className={`${inputClassName} cursor-pointer`}
                      >
                        <option value="" disabled>
                          Select an option
                        </option>
                        {HELP_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block sm:col-span-2">
                      <FieldLabel>Message</FieldLabel>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        placeholder="Tell us about your campaign workflow, challenges, or what you'd like to achieve with Adigator."
                        value={form.message}
                        onChange={(event) => updateField("message", event.target.value)}
                        className={`${inputClassName} min-h-[140px] resize-y`}
                      />
                    </label>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[#5C5C56]">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      required
                      checked={form.agreedToTerms}
                      onChange={(event) => updateField("agreedToTerms", event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#DEDDD5] text-[#0D0D0D] focus:ring-[#0D0D0D]/20"
                    />
                    <span>
                      I agree to Adigator&apos;s{" "}
                      <Link href="/about" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/about" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                        Terms of Use
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="marketing-btn-lime saas-hover w-full rounded-full px-8 py-4 text-base font-bold sm:w-auto"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <aside className="flex flex-col gap-6">
              <div className="rounded-[28px] border border-[#DEDDD5] bg-white px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:px-8 sm:py-9">
                <h3 className="text-xl font-black tracking-tight">Prefer to talk?</h3>
                <a
                  href="mailto:hello@adigator.in"
                  className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-[#0D0D0D] transition hover:text-[#2D2D27]"
                >
                  <span aria-hidden>📧</span>
                  hello@adigator.in
                </a>
                <p className="mt-3 text-sm leading-relaxed text-[#5C5C56]">
                  We typically respond within 1 business day.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#DEDDD5] bg-[#FAFAF7] px-6 py-8 sm:px-8 sm:py-9">
                <h3 className="text-xl font-black tracking-tight">Looking for a Demo?</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5C5C56]">
                  See how Adigator validates campaigns before campaign setup and helps teams launch with confidence.
                </p>
                <Link
                  href={MARKETING_DEMO_VIDEO.href}
                  className="saas-hover mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#0D0D0D] transition hover:gap-2"
                >
                  Book Demo →
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)] pb-8">
          <div className="saas-hover rounded-[32px] border border-[#DBDAD2] bg-white px-8 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-12 sm:py-12">
            <h2 className="mx-auto max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-black leading-tight tracking-tight">
              Every Great Campaign Starts With Validation.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55]">
              Let&apos;s discuss how Adigator can help your team reduce campaign errors, save media budget, and launch
              with confidence.
            </p>
            <Link
              href={MARKETING_DEMO_VIDEO.href}
              className="marketing-btn-lime saas-hover mt-10 inline-flex rounded-full px-10 py-4 text-base font-bold"
            >
              Request a Demo
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <style jsx global>{`
        .saas-hover {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }
        .saas-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
