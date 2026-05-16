"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Logo from "@/app/components/Logo";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/product", label: "Product" },
    { href: "/solutions", label: "Solutions" },
    { href: "/about", label: "About" },
    { href: "/preview-tool", label: "Preview Tool" },
    { href: "/login", label: "Login" },
  ];

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 md:px-10">
      <Link href="/" className="flex items-center justify-start gap-2">
        <style>{`
          @keyframes neon-text-glow {
            0% {
              text-shadow: 0 0 8px rgba(236, 72, 153, 0.8), 0 0 16px rgba(236, 72, 153, 0.5);
            }
            33% {
              text-shadow: 0 0 8px rgba(139, 92, 246, 0.8), 0 0 16px rgba(139, 92, 246, 0.5);
            }
            66% {
              text-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.5);
            }
            100% {
              text-shadow: 0 0 8px rgba(236, 72, 153, 0.8), 0 0 16px rgba(236, 72, 153, 0.5);
            }
          }
          
          .logo-symbol {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          @media (max-width: 768px) {
            .logo-symbol {
              width: 20px;
              height: 20px;
            }
          }
          
          .adigator-text {
            animation: neon-text-glow 4s ease-in-out infinite;
            font-size: 18px;
            font-weight: 600;
            line-height: 1;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            display: flex;
            align-items: center;
          }

          @media (max-width: 768px) {
            .adigator-text {
              font-size: 14px;
            }
          }
        `}</style>
        <div className="logo-symbol">
          <Logo />
        </div>
        <span className="adigator-text">Adigator</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-8 text-sm md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group relative rounded-full px-3 py-1.5 transition ${
              pathname === link.href
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {link.label}
            <span
              className={`pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 transition-all duration-300 ${
                pathname === link.href ? "w-9" : "group-hover:w-7"
              }`}
            />
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileMenuOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white md:hidden"
      >
        <div className="space-y-1.5">
          <div className="h-0.5 w-4 bg-white" />
          <div className="h-0.5 w-4 bg-white" />
          <div className="h-0.5 w-4 bg-white" />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 h-full w-[82%] max-w-xs border-l border-white/10 bg-[#0b1224] p-6 md:hidden"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-300">Menu</p>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-white/20 px-2 py-1 text-xs text-gray-300"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      pathname === link.href
                        ? "border-purple-400/45 bg-purple-500/15 text-white"
                        : "border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
