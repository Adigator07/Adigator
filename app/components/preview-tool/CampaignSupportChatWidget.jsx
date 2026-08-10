"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Expand, MessageCircle, Minimize2, X } from "lucide-react";
import { GoogleAdsIcon, MetaIcon, TradeDeskIcon } from "@/app/components/brand/PlatformBrandIcons";

const CHAT_MODE_PREFERENCE_KEY = "adigator_support_chat_mode_preference";

const WIDGET_BORDER_CYCLE = [
  "border-sky-300/45 shadow-[0_32px_90px_rgba(14,165,233,0.28)]",
  "border-emerald-300/45 shadow-[0_32px_90px_rgba(16,185,129,0.28)]",
  "border-violet-300/45 shadow-[0_32px_90px_rgba(139,92,246,0.28)]",
  "border-amber-300/45 shadow-[0_32px_90px_rgba(245,158,11,0.25)]",
  "border-rose-300/45 shadow-[0_32px_90px_rgba(244,63,94,0.28)]",
];

export default function CampaignSupportChatWidget({
  step,
  platform,
  campaignGoal,
  campaignVertical,
  campaignName,
  advertiserName,
  landingUrl,
  missingSetupFields,
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [smallWindowOpen, setSmallWindowOpen] = useState(false);
  const [rememberModeChoice, setRememberModeChoice] = useState(false);
  const [preferredMode, setPreferredMode] = useState(null);
  const [borderIndex, setBorderIndex] = useState(0);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setBorderIndex((prev) => (prev + 1) % WIDGET_BORDER_CYCLE.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const context = useMemo(() => ({
    step,
    platform,
    campaignGoal,
    campaignVertical,
    campaignName,
    advertiserName,
    hasLandingUrl: Boolean(String(landingUrl || "").trim()),
    missingSetupFields: Array.isArray(missingSetupFields) ? missingSetupFields : [],
  }), [
    step,
    platform,
    campaignGoal,
    campaignVertical,
    campaignName,
    advertiserName,
    landingUrl,
    missingSetupFields,
  ]);

  const persistSupportContext = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("adigator_support_context", JSON.stringify(context));
    }
  };

  const persistModePreference = (mode) => {
    if (typeof window === "undefined") return;
    if (rememberModeChoice) {
      window.localStorage.setItem(CHAT_MODE_PREFERENCE_KEY, mode);
      setPreferredMode(mode);
    } else {
      window.localStorage.removeItem(CHAT_MODE_PREFERENCE_KEY);
      setPreferredMode(null);
    }
  };

  const handleOpenSupportPage = () => {
    persistModePreference("full");
    persistSupportContext();
    router.push("/preview-tool/support");
  };

  const handleOpenSmallWindow = () => {
    persistModePreference("small");
    persistSupportContext();
    setSmallWindowOpen(true);
    setModePickerOpen(false);
  };

  const handleChatLauncherClick = () => {
    if (preferredMode === "small") {
      handleOpenSmallWindow();
      return;
    }
    if (preferredMode === "full") {
      handleOpenSupportPage();
      return;
    }
    setModePickerOpen((open) => !open);
  };

  const handleResetPreference = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CHAT_MODE_PREFERENCE_KEY);
    }
    setPreferredMode(null);
    setRememberModeChoice(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CHAT_MODE_PREFERENCE_KEY);
    if (stored === "small" || stored === "full") {
      setPreferredMode(stored);
      setRememberModeChoice(true);
    }
  }, []);

  useEffect(() => {
    if (!modePickerOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(event.target)) {
        setModePickerOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setModePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modePickerOpen]);

  return (
    <>
      <AnimatePresence>
        {smallWindowOpen ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            className={`agi-chat-bg-cycle fixed bottom-24 right-5 z-90 h-[min(78vh,700px)] w-[min(96vw,430px)] overflow-hidden rounded-3xl border bg-[#090f1f] ${WIDGET_BORDER_CYCLE[borderIndex]}`}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(120deg,rgba(12,28,48,0.96),rgba(14,22,38,0.94))] px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <MessageCircle size={16} />
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Adigator Chat Help</p>
                <span className="ml-1 inline-flex items-center gap-1">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/95">
                    <GoogleAdsIcon className="h-3 w-3" />
                  </span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/95">
                    <MetaIcon className="h-3 w-3" />
                  </span>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/95">
                    <TradeDeskIcon className="h-3 w-3" />
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenSupportPage}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Open chat in full screen"
                  title="Open full screen"
                >
                  <Expand size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setSmallWindowOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close small chat window"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <iframe
              title="Adigator support chat small window"
              src="/preview-tool/support?mode=small"
              className="h-[calc(100%-53px)] w-full border-0 bg-[#090f1f]"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div ref={pickerRef} className="fixed bottom-5 right-5 z-80">
        <AnimatePresence>
          {modePickerOpen ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
              className="absolute bottom-18 right-0 w-[min(90vw,280px)] rounded-2xl border border-rose-200/35 bg-[linear-gradient(140deg,rgba(35,10,16,0.98),rgba(17,8,13,0.98))] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            >
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-100/90">Choose Chat Mode</p>
              <p className="mt-1 px-1 text-xs text-rose-50/80">How would you like to open support?</p>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={handleOpenSupportPage}
                  className="flex items-center justify-between rounded-xl border border-rose-200/35 bg-white/8 px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  <span>Full Screen</span>
                  <Expand size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenSmallWindow}
                  className="flex items-center justify-between rounded-xl border border-rose-200/35 bg-white/8 px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  <span>Small Window</span>
                  <Minimize2 size={14} />
                </button>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 px-1 text-xs text-rose-50/80">
                <input
                  type="checkbox"
                  checked={rememberModeChoice}
                  onChange={(event) => setRememberModeChoice(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border border-rose-200/50 bg-transparent"
                />
                Remember my choice
              </label>
              {preferredMode ? (
                <button
                  type="button"
                  onClick={handleResetPreference}
                  className="mt-2 px-1 text-xs font-semibold text-rose-100/80 underline decoration-rose-200/40 underline-offset-2 hover:text-white"
                >
                  Reset saved mode
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleChatLauncherClick}
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduceMotion ? undefined : { y: -3, scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="group relative flex items-center gap-3 overflow-hidden rounded-full border border-rose-300/40 bg-[linear-gradient(120deg,rgba(45,12,18,0.96),rgba(22,8,14,0.94))] px-4 py-3 text-left shadow-[0_18px_48px_rgba(239,68,68,0.32)] transition"
          aria-label="Open Adigator chat mode picker"
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,0.28),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.28),transparent_45%)]" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-rose-200/35 bg-rose-400/15 text-rose-100 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
            <Bot size={18} />
            <motion.span
              animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300"
            />
          </span>
          <span className="relative min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-rose-50">Adigator Chat Help</span>
            <span className="block text-sm font-medium text-white">
              {preferredMode ? (preferredMode === "full" ? "Opening full screen" : "Opening small window") : "Choose window mode"}
            </span>
          </span>
        </motion.button>
      </div>
    </>
  );
}
