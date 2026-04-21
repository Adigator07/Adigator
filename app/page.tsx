"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-[#030712] text-white min-h-screen overflow-hidden">

      {/* NAVBAR */}
      <header className="flex justify-between items-center px-10 py-6 border-b border-white/10 bg-[#030712]">

        {/* LOGO */}
        <div className="flex items-center">
          <img
            src="/Logo.png"
            alt="Adigator Logo"
            className="h-16 w-auto mix-blend-lighten object-contain"
          />
        </div>

        {/* MENU */}
        <div className="flex items-center gap-8 text-sm text-gray-300">
          <span className="hover:text-purple-400 cursor-pointer transition">Solutions</span>
          <span className="hover:text-purple-400 cursor-pointer transition">About</span>
          <span className="hover:text-purple-400 cursor-pointer transition">Contact</span>

          <Link href="/login">
            <button className="px-5 py-2 rounded-xl border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-300">
              Login
            </button>
          </Link>
        </div>

      </header>

      {/* HERO */}
<section className="relative px-6 md:px-10 py-24 flex flex-col md:flex-row items-center gap-16">

  <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 opacity-20 blur-[120px]"></div>

  {/* LEFT CONTENT */}
  <div className="flex-1 z-10">
    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
      Stop Wasting Ad Spend on{" "}
      <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
        Creatives That Don’t Work
      </span>
    </h1>

    <p className="mt-6 text-gray-400 text-lg max-w-lg">
      Preview, analyze, and optimize your ad creatives before launching campaigns.
    </p>

    <div className="mt-10 flex gap-4 flex-wrap">
      <Link href="/intelligence">
        <button className="bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-3 rounded-xl hover:scale-105 transition shadow-lg">
          Start Analysis
        </button>
      </Link>

      <Link href="/preview">
        <button className="border border-white/20 px-8 py-3 rounded-xl hover:bg-white hover:text-black transition">
          Preview Creatives
        </button>
      </Link>
    </div>
  </div>

  {/* RIGHT VIDEO */}
  <div className="flex-1 relative z-10">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-2xl opacity-30 rounded-xl"></div>

    <video
      autoPlay
      muted
      loop
      playsInline
      className="relative w-full rounded-xl object-cover"
    >
      <source src="/video.mp4" type="video/mp4" />
    </video>
  </div>

</section>

      {/* PROBLEM */}
      <section className="px-6 md:px-10 py-24 text-center">
        <h2 className="text-3xl font-semibold mb-12">
          Why Most Ad Campaigns Fail
        </h2>

        <div className="flex flex-wrap justify-center gap-6">
          {[
            "Wrong creatives selected",
            "No preview before launch",
            "Poor performance insights",
            "Budget wasted on testing",
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl w-64 hover:scale-105 transition">
              <p className="text-gray-300">{item}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-purple-400 text-lg">
          By the time you fix it… your budget is already gone.
        </p>
      </section>

      {/* SOLUTION */}
      <section className="px-6 md:px-10 py-24 text-center">
        <h2 className="text-3xl font-semibold mb-6">
          Fix It Before You Launch
        </h2>

        <p className="text-gray-400 max-w-2xl mx-auto">
          Adigator helps you preview, analyze, and optimize creatives before spending a single rupee.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 md:px-10 py-24 text-center">
        <h2 className="text-3xl font-semibold mb-12">How It Works</h2>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            "Upload Creatives",
            "Validate & Organize",
            "Preview Across Platforms",
            "Optimize & Export",
          ].map((step, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:scale-105 transition">
              <h3 className="font-semibold">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 md:px-10 py-24">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Core Solutions
        </h2>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">

          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 p-8 rounded-2xl hover:scale-105 transition">
            <h3 className="text-xl font-semibold mb-3">Preview Engine</h3>
            <p className="text-gray-400">
              See how your ads look across platforms before launch.
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/10 p-8 rounded-2xl hover:scale-105 transition">
            <h3 className="text-xl font-semibold mb-3">Creative Intelligence</h3>
            <p className="text-gray-400">
              Analyze creatives and improve performance before spending.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-24 text-center">
        <h2 className="text-3xl font-semibold mb-6">
          Start Making Smarter Ad Decisions Today
        </h2>

        <Link href="/preview">
          <button className="bg-gradient-to-r from-purple-600 to-pink-500 px-10 py-4 rounded-xl hover:scale-110 transition shadow-xl">
            Get Started Free
          </button>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-8 border-t border-white/10 text-center text-gray-500">
        © 2026 Adigator
      </footer>

    </main>
  );
}