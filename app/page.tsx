"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-[#0a0f1e] text-white">

      {/* NAVBAR */}
      <header className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-lg sticky top-0 z-50">
        <img src="/logo.png" className="h-10 md:h-12 w-auto" />

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <span className="hover:text-white cursor-pointer">Solutions</span>
          <span className="hover:text-white cursor-pointer">About</span>
          <span className="hover:text-white cursor-pointer">Contact</span>
        </div>

        <Link href="/login">
          <button className="px-4 md:px-5 py-2 border border-white/20 text-gray-300 rounded-xl hover:bg-white hover:text-black transition text-sm">
            Login
          </button>
        </Link>
      </header>

      {/* HERO */}
      <section className="text-center px-6 md:px-10 py-24 md:py-32 bg-gradient-to-b from-[#0a0f1e] to-[#111827]">

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-tight max-w-4xl mx-auto">
          Know your ad works.
          <br />
          <span className="text-purple-400">Before you spend.</span>
        </h1>

        <p className="mt-6 text-gray-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Preview, analyze, and validate your creatives in real environments before launching campaigns.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/preview">
            <button className="bg-white text-black px-8 py-3 rounded-full hover:opacity-90 transition font-medium">
              Start free preview
            </button>
          </Link>

          <button className="border border-white/20 px-8 py-3 rounded-full hover:bg-white hover:text-black transition">
            See it in action
          </button>
        </div>
      </section>

      {/* VALUE SPLIT */}
      <section className="grid md:grid-cols-2">

        <div className="p-10 md:p-16 bg-[#111827]">
          <p className="text-purple-400 text-sm mb-3">For Advertisers</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 leading-snug">
            Stop guessing. Start knowing.
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            See exactly how your creatives appear across real platforms — and launch with confidence.
          </p>
        </div>

        <div className="p-10 md:p-16 bg-[#0f172a]">
          <p className="text-blue-400 text-sm mb-3">For Agencies</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 leading-snug">
            Impress clients before launch.
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Create clean, client-ready preview decks in minutes. No manual work required.
          </p>
        </div>

      </section>

      {/* DEMO SECTION */}
      <section className="px-6 md:px-10 py-24 md:py-32 text-center bg-[#0f172a]">

        <h2 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">
          Your ad, in the wild.
          <br className="hidden md:block" />
          Before it runs.
        </h2>

        <p className="text-gray-400 max-w-lg mx-auto mb-12">
          Place your creatives into real-world layouts and understand performance before spending.
        </p>

        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
  <video
    autoPlay
    muted
    loop
    playsInline
    className="w-full object-cover"
  >
    <source src="/video.mp4" type="video/mp4" />
  </video>
</div>

      </section>

      {/* CORE VALUE (LIGHT SECTION — APPLE STYLE) */}
      <section className="px-6 md:px-10 py-24 md:py-32 text-center bg-white text-black">

        <h2 className="text-3xl md:text-5xl font-semibold max-w-3xl mx-auto leading-tight">
          Creative quality is your biggest performance lever.
        </h2>

        <p className="mt-6 max-w-xl mx-auto text-gray-600 text-base md:text-lg">
          Most campaigns fail before they launch. Adigator helps you fix that before money is spent.
        </p>

      </section>

      {/* FINAL CTA */}
      <section className="px-6 md:px-10 py-24 md:py-32 text-center bg-[#0a0f1e]">

        <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-tight">
          Your next campaign deserves a smarter start.
        </h2>

        <Link href="/preview">
          <button className="bg-white text-black px-10 py-4 rounded-full hover:opacity-90 transition text-lg font-medium">
            Start free preview
          </button>
        </Link>

      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-10 text-center text-gray-500 border-t border-white/10 text-sm">
        © 2026 Adigator
      </footer>

    </main>
  );
}