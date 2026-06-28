"use client";

import Link from "next/link";
import { useState } from "react";
import { MARKETING_DEMO_VIDEO } from "@/app/lib/siteNavigation";
import MarketingFooter from "@/app/components/MarketingFooter";
import MarketingNav from "@/app/components/MarketingNav";

const TEAM_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;

type ContactFormState = {
  fullName: string;
  workEmail: string;
  company: string;
  jobTitle: string;
  teamSize: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: ContactFormState = {
  fullName: "",
  workEmail: "",
  company: "",
  jobTitle: "",
  teamSize: "",
  subject: "",
  message: "",
};

const inputClassName =
  "w-full rounded-xl border border-[#DEDDD5] bg-white px-4 py-3 text-sm text-[#0D0D0D] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#0D0D0D]/10";

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
        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)] text-center">
          <h1 className="mx-auto max-w-3xl text-[clamp(2rem,5.5vw,3.75rem)] font-black leading-[1.04] tracking-[-0.04em]">
            Let&apos;s Talk About Your Campaign Workflow
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#5C5C56] sm:text-xl">
            Whether you&apos;re exploring Adigator, booking a demo, or looking to improve your campaign validation
            process, we&apos;re here to help.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={MARKETING_DEMO_VIDEO.href}
              className="marketing-btn-lime saas-hover rounded-full px-8 py-4 text-base font-bold"
            >
              Book a Demo
            </Link>
            <a
              href="#contact-form"
              className="marketing-btn-outline saas-hover rounded-full px-8 py-4 text-base font-semibold"
            >
              Contact Sales
            </a>
          </div>
        </section>

        <section
          id="contact-form"
          className="marketing-section marketing-section-compact mx-auto w-[min(760px,92vw)] pb-24"
        >
          <div className="rounded-[28px] border border-[#DEDDD5] bg-white px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:px-10 sm:py-10">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Send us a Message</h2>
            <p className="mt-3 text-base leading-relaxed text-[#5C5C56]">
              Tell us a little about your team or challenge, and we&apos;ll get back to you as soon as possible.
            </p>

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
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">Full Name</span>
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

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">Work Email</span>
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

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">Company</span>
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
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">
                      Job Title <span className="font-normal text-[#9CA3AF]">(Optional)</span>
                    </span>
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
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">Team Size</span>
                    <select
                      name="teamSize"
                      required
                      value={form.teamSize}
                      onChange={(event) => updateField("teamSize", event.target.value)}
                      className={`${inputClassName} cursor-pointer`}
                    >
                      <option value="" disabled>
                        Select team size
                      </option>
                      {TEAM_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">Subject</span>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={form.subject}
                      onChange={(event) => updateField("subject", event.target.value)}
                      className={inputClassName}
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#0D0D0D]">Message</span>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      className={`${inputClassName} resize-y min-h-[140px]`}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="marketing-btn-lime saas-hover mt-2 w-full rounded-full px-8 py-4 text-base font-bold sm:w-auto"
                >
                  Send Message
                </button>
              </form>
            )}
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
