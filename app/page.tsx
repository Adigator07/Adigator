"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

interface AnimatedButtonProps {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

const AnimatedButton = ({ 
  href, 
  children, 
  variant = "primary", 
  className = "" 
}: AnimatedButtonProps) => {
  const baseStyle = "group relative inline-flex items-center justify-center px-8 py-3.5 text-sm md:text-base font-medium rounded-full transition-all duration-300 outline-none overflow-hidden";
  
  const styles = {
    primary: "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] border border-white/10",
    secondary: "bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.1)]"
  };

  const buttonContent = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${baseStyle} ${styles[variant]} ${className}`}
    >
      {/* Subtle Inner Shine */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );

  return href ? <Link href={href} className="inline-block">{buttonContent}</Link> : buttonContent;
};

// ------------------------------------------------------------------
// ANIMATION VARIANTS
// ------------------------------------------------------------------

const fadeUpContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 80, damping: 20 } 
  },
};

const scaleUpItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  },
};

// ------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ------------------------------------------------------------------

export default function Home() {
  return (
    <main className="bg-[#030712] text-white min-h-screen selection:bg-fuchsia-500/30 overflow-hidden font-sans">
      
      {/* Ambient Background Grid & Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dcbpg2zxs/image/upload/v1699960251/grid-pattern_q51jof.svg')] opacity-[0.03] bg-center" />
      </div>

      {/* NAVBAR */}
      <header className="relative z-50 flex justify-between items-center px-6 md:px-12 h-20 border-b border-white/5 bg-[#030712]/50 backdrop-blur-2xl transition-all">
        {/* LOGO */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="h-8 flex items-center"
        >
          <img
            src="/logo.png"
            alt="Adigator Logo"
            className="h-full w-auto object-contain scale-280 origin-left"
          />
        </motion.div>

        {/* MENU + LOGIN */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-6 md:gap-8 text-sm text-gray-400 font-medium"
        >
          <span className="hover:text-white cursor-pointer transition-colors duration-200">Solutions</span>
          <span className="hover:text-white cursor-pointer transition-colors duration-200">About</span>
          <span className="hover:text-white cursor-pointer transition-colors duration-200">Contact</span>

          <Link href="/login">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 border border-white/10 text-gray-200 rounded-xl hover:border-white/20 hover:text-white transition-all text-sm font-semibold shadow-sm backdrop-blur-md"
            >
              Login
            </motion.button>
          </Link>
        </motion.div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 text-center px-6 md:px-10 py-32 md:py-48 flex flex-col items-center justify-center min-h-[90vh]">
        <motion.div 
          className="relative z-10 max-w-5xl mx-auto"
          variants={fadeUpContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeUpItem} className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-xs md:text-sm font-medium tracking-wide backdrop-blur-sm shadow-[0_0_20px_rgba(217,70,239,0.1)] hover:bg-fuchsia-500/20 transition-colors duration-300 cursor-pointer">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
              </span>
              Introducing Adigator 2.0
            </div>
          </motion.div>

          <motion.h1 
            variants={fadeUpItem}
            className="text-6xl md:text-8xl lg:text-[7rem] font-bold leading-[1.05] tracking-tighter text-white drop-shadow-2xl"
          >
            Know your ad works.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400">
              Before you spend.
            </span>
          </motion.h1>

          <motion.p 
            variants={fadeUpItem}
            className="mt-8 text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-light tracking-wide"
          >
            Preview, analyze, and validate your creatives in real environments before launching campaigns. Save budget. Increase ROI.
          </motion.p>

          <motion.div 
            variants={fadeUpItem}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"
          >
            <AnimatedButton href="/preview" variant="primary">
              Start free preview
            </AnimatedButton>
            <AnimatedButton variant="secondary">
              See it in action
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </section>

      {/* VALUE SPLIT (FEATURES) */}
      <section className="relative z-10 grid md:grid-cols-2 max-w-7xl mx-auto px-6 md:px-10 py-20 gap-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpItem}
          className="group relative p-12 md:p-16 rounded-3xl bg-[#0f172a]/40 border border-white/5 hover:border-white/10 transition-colors duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-violet-400 text-sm font-semibold tracking-wider uppercase mb-4">For Advertisers</p>
          <h2 className="text-3xl md:text-5xl font-medium mb-6 leading-tight tracking-tight text-white">
            Stop guessing. <br/>Start knowing.
          </h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed font-light">
            See exactly how your creatives appear across real platforms — and launch with absolute confidence.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpItem}
          className="group relative p-12 md:p-16 rounded-3xl bg-[#0f172a]/40 border border-white/5 hover:border-white/10 transition-colors duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-blue-400 text-sm font-semibold tracking-wider uppercase mb-4">For Agencies</p>
          <h2 className="text-3xl md:text-5xl font-medium mb-6 leading-tight tracking-tight text-white">
            Impress clients <br/>before launch.
          </h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed font-light">
            Create clean, client-ready preview decks in minutes. No manual mockups or guesswork required.
          </p>
        </motion.div>
      </section>

      {/* DEMO SECTION */}
      <section className="relative z-10 px-6 md:px-10 py-32 md:py-40 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.h2 variants={fadeUpItem} className="text-4xl md:text-6xl font-medium mb-6 tracking-tight">
            Your ad, in the wild.
            <br className="hidden md:block" />
            <span className="text-gray-500"> Before it runs.</span>
          </motion.h2>

          <motion.p variants={fadeUpItem} className="text-gray-400 max-w-2xl mx-auto mb-16 text-lg font-light tracking-wide">
            Place your creatives into real-world layouts and understand how they actually perform visually before spending a single dollar.
          </motion.p>

          <motion.div 
            variants={scaleUpItem}
            className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
          >
            {/* macOS styled window bar */}
            <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-6 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10" />
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full object-cover transform group-hover:scale-[1.02] transition-transform duration-700 ease-in-out"
              >
                <source src="/video.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* CORE VALUE */}
      <section className="relative z-10 px-6 md:px-10 py-32 md:py-48 text-center bg-white text-black rounded-t-[3rem] shadow-[0_-30px_60px_rgba(0,0,0,0.3)]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpContainer}
        >
          <motion.h2 variants={fadeUpItem} className="text-5xl md:text-7xl font-bold max-w-5xl mx-auto leading-tight tracking-tighter">
            Creative quality is your biggest performance lever.
          </motion.h2>

          <motion.p variants={fadeUpItem} className="mt-8 max-w-2xl mx-auto text-gray-600 text-lg md:text-xl font-light tracking-wide">
            Most campaigns fail before they launch due to poor formatting and context mismatch. Adigator helps you fix that instantly.
          </motion.p>
        </motion.div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-6 md:px-10 py-32 md:py-48 text-center bg-[#030712] relative overflow-hidden">
        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[800px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpContainer}
          className="relative z-10"
        >
          <motion.h2 variants={fadeUpItem} className="text-5xl md:text-7xl font-bold mb-10 tracking-tighter text-white">
            Your next campaign <br/>deserves a smarter start.
          </motion.h2>

          <motion.div variants={fadeUpItem}>
            <AnimatedButton href="/preview" variant="primary" className="px-12 py-4 text-lg shadow-[0_0_40px_rgba(168,85,247,0.4)]">
              Start free preview
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-6 md:px-10 py-12 text-center text-gray-600 border-t border-white/5 text-sm bg-[#030712]">
        <p>© 2026 Adigator. All rights reserved.</p>
      </footer>

    </main>
  );
}