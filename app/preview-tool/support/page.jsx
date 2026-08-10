"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Clock3, Send, Sparkles } from "lucide-react";

const CONTEXT_STORAGE_KEY = "adigator_support_context";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi, I am Adigator support. Share your blocker and I will help with clear, step-by-step guidance.",
  createdAt: new Date().toISOString(),
};

const ASSISTANT_AGENTS = [
  {
    name: "Airi",
    title: "Campaign Specialist",
    avatar: "/assets/illustrations/storyset/analysis-amico.svg",
  },
  {
    name: "Kira",
    title: "Creative QA Lead",
    avatar: "/assets/illustrations/storyset/digital-transformation-bro.svg",
  },
  {
    name: "Ren",
    title: "Platform Support Analyst",
    avatar: "/assets/illustrations/storyset/search-amico.svg",
  },
  {
    name: "Mio",
    title: "Launch Readiness Expert",
    avatar: "/assets/illustrations/storyset/team-goals-rafiki.svg",
  },
];

const QUICK_PROMPTS = [
  "My campaign score dropped suddenly. Diagnose root cause with priority fixes.",
  "Give me a step-by-step fix for rejected creatives and format mismatches.",
  "Create a platform-wise preview checklist for Meta, Google, and YouTube.",
  "Build a final launch go/no-go checklist with risk flags and quick actions.",
];

function buildInitialContext() {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.sessionStorage.getItem(CONTEXT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function formatTimeLabel(value) {
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "now";
  }
}

function parseMessageBlocks(content) {
  const lines = String(content || "").split("\n");
  const blocks = [];
  let paragraph = [];
  let listItems = [];
  let ordered = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", value: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: ordered ? "ol" : "ul", items: [...listItems] });
      listItems = [];
      ordered = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const orderedMatch = line.match(/^\d+[.)]\s+(.*)$/);
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

    if (orderedMatch) {
      flushParagraph();
      if (!listItems.length) ordered = true;
      if (!ordered) {
        flushList();
        ordered = true;
      }
      listItems.push(orderedMatch[1]);
      continue;
    }

    if (bulletMatch) {
      flushParagraph();
      if (!listItems.length) ordered = false;
      if (ordered) {
        flushList();
      }
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function MessageBody({ content }) {
  const blocks = useMemo(() => parseMessageBlocks(content), [content]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={`p-${index}`} className="text-[15px] leading-8 tracking-[0.005em] whitespace-pre-wrap sm:text-[15.5px]">
              {block.value}
            </p>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={`ol-${index}`} className="list-decimal space-y-3 pl-7 text-[15px] leading-8 sm:text-[15.5px]">
              {block.items.map((item, itemIndex) => (
                <li key={`ol-item-${itemIndex}`} className="pl-1.5">{item}</li>
              ))}
            </ol>
          );
        }

        return (
          <ul key={`ul-${index}`} className="list-disc space-y-3 pl-7 text-[15px] leading-8 sm:text-[15.5px]">
            {block.items.map((item, itemIndex) => (
              <li key={`ul-item-${itemIndex}`} className="pl-1.5">{item}</li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

function SupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [context, setContext] = useState({});
  const scrollRef = useRef(null);
  const [agentIndex, setAgentIndex] = useState(0);
  const isSmallWindowMode = searchParams.get("mode") === "small";

  const activeAgent = ASSISTANT_AGENTS[agentIndex % ASSISTANT_AGENTS.length];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgentIndex((prev) => (prev + 1) % ASSISTANT_AGENTS.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setContext(buildInitialContext());
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed, createdAt: new Date().toISOString() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/campaign-intelligence-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
          context,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.reply) {
        const fallback = payload?.error || "I could not process that request. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback, createdAt: new Date().toISOString() }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: String(payload.reply), createdAt: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue while reaching support. Please retry in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuickPrompt = async (prompt) => {
    if (loading) return;
    setInput(prompt);
    const nextMessages = [...messages, { role: "user", content: prompt, createdAt: new Date().toISOString() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/campaign-intelligence-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
          context,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.reply) {
        const fallback = payload?.error || "I could not process that request. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback, createdAt: new Date().toISOString() }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: String(payload.reply), createdAt: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue while reaching support. Please retry in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[linear-gradient(145deg,#090d16,#0c1324_52%,#0b1a2d_100%)] text-white ${isSmallWindowMode ? "h-full min-h-full" : "min-h-screen"}`}>
      <div className="agi-login-grid" aria-hidden />
      <div className="agi-login-scan opacity-70" aria-hidden />
      <div className="agi-login-orb agi-login-orb--a opacity-70" aria-hidden style={{ filter: "blur(74px)" }} />
      <div className="agi-login-orb agi-login-orb--b opacity-65" aria-hidden style={{ filter: "blur(80px)" }} />
      <motion.div
        animate={reduceMotion ? undefined : { opacity: [0.08, 0.2, 0.1, 0.18, 0.08] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_24%,rgba(59,130,246,0.18),transparent_42%),radial-gradient(circle_at_84%_74%,rgba(56,189,248,0.16),transparent_44%),radial-gradient(circle_at_52%_62%,rgba(147,197,253,0.12),transparent_52%)]"
      />
      <div className="pointer-events-none absolute inset-0 opacity-12 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[30px_30px]" />
      {!isSmallWindowMode ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.span
            animate={reduceMotion ? undefined : { scale: [1, 1.018, 1], opacity: [0.7, 0.84, 0.7] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="select-none text-[min(16vw,168px)] font-black tracking-[0.24em] text-sky-100/55 drop-shadow-[0_12px_34px_rgba(14,116,144,0.42)]"
          >
            ADIGATOR
          </motion.span>
        </div>
      ) : null}

      <div className={`relative z-10 flex w-full flex-col px-2 py-2 sm:px-3 sm:py-3 ${isSmallWindowMode ? "h-full" : "h-screen"}`}>
        <header className={`flex items-center justify-between border border-sky-200/28 bg-[rgba(255,255,255,0.05)] px-4 py-3 backdrop-blur-xl ${isSmallWindowMode ? "rounded-2xl" : "rounded-3xl"}`}>
          <div className="flex items-center gap-3">
            {!isSmallWindowMode ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/32 bg-white/8 text-sky-100 transition hover:bg-white/16"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <div className="flex items-center gap-2">
              <img
                src={activeAgent.avatar}
                alt={`${activeAgent.name} avatar`}
                className="h-10 w-10 rounded-xl border border-sky-200/35 bg-white/15 object-cover p-1"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100">Adigator Chat Help</p>
                <p className="text-xs text-sky-50/82">{activeAgent.name} · {activeAgent.title}</p>
              </div>
            </div>
          </div>

          <div className={`items-center gap-2 rounded-full border border-emerald-200/35 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100 ${isSmallWindowMode ? "inline-flex" : "hidden md:inline-flex"}`}>
            <motion.span
              animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], scale: [1, 1.12, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-2 rounded-full bg-emerald-300"
            />
            {isSmallWindowMode ? "Small Window" : "Active Agent"}
          </div>
        </header>

        <div className="mt-3 grid flex-1 grid-cols-1 gap-3 overflow-hidden">
          <div
            ref={scrollRef}
            className="space-y-6 overflow-y-auto rounded-3xl border border-sky-200/24 bg-[rgba(255,255,255,0.05)] p-3 backdrop-blur-xl sm:space-y-7 sm:p-5"
          >
            <div className="rounded-2xl border border-sky-200/30 bg-sky-500/10 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sky-100">
                  <Sparkles size={14} />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">Quick Start</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                  <Clock3 size={12} /> Usually under 2 mins
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      void sendQuickPrompt(prompt);
                    }}
                    className="rounded-full border border-sky-100/35 bg-white/10 px-3 py-1.5 text-xs text-sky-50 transition hover:bg-white/18"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}`}
                initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.24, delay: Math.min(index * 0.02, 0.12) }}
                className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" ? (
                  <img
                    src={ASSISTANT_AGENTS[index % ASSISTANT_AGENTS.length].avatar}
                    alt="Assistant avatar"
                    className="h-10 w-10 rounded-full border border-sky-100/40 bg-white/15 object-cover p-1"
                  />
                ) : null}

                <div
                  className={`max-w-[min(860px,90vw)] rounded-3xl border px-4 py-3 sm:px-5 sm:py-4 ${
                    message.role === "assistant"
                      ? "border-sky-200/45 bg-[linear-gradient(130deg,rgba(13,37,88,0.92),rgba(10,56,99,0.93),rgba(9,77,91,0.94))] text-white"
                      : "border-sky-100/36 bg-[linear-gradient(130deg,rgba(21,45,96,0.93),rgba(16,61,109,0.94))] text-sky-50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-widest">
                    <span className={`${message.role === "assistant" ? "text-sky-100/80" : "text-sky-100/80"}`}>
                      {message.role === "assistant" ? activeAgent.name : "You"}
                    </span>
                    <span className={`${message.role === "assistant" ? "text-sky-100/60" : "text-sky-100/60"}`}>
                      {formatTimeLabel(message.createdAt)}
                    </span>
                  </div>
                  <MessageBody content={message.content} />
                </div>

                {message.role === "user" ? (
                  <img
                    src="/assets/illustrations/storyset/search-amico.svg"
                    alt="User avatar"
                    className="h-10 w-10 rounded-full border border-amber-100/50 bg-white/15 object-cover p-1"
                  />
                ) : null}
              </motion.div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-sky-200/45 bg-sky-900/40 px-4 py-2 text-sm text-sky-50">
                <span className={`h-2 w-2 rounded-full bg-sky-100 ${reduceMotion ? "" : "animate-bounce [animation-delay:-0.2s]"}`} />
                <span className={`h-2 w-2 rounded-full bg-sky-100 ${reduceMotion ? "" : "animate-bounce [animation-delay:-0.1s]"}`} />
                <span className={`h-2 w-2 rounded-full bg-sky-100 ${reduceMotion ? "" : "animate-bounce"}`} />
                <span className="ml-1">{activeAgent.name} is typing...</span>
              </div>
            ) : null}
          </div>
        </div>

        <footer className={`mt-3 border border-sky-200/28 bg-[rgba(255,255,255,0.05)] p-3 backdrop-blur-xl sm:p-4 ${isSmallWindowMode ? "rounded-2xl" : "rounded-3xl"}`}>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              rows={isSmallWindowMode ? 2 : 3}
              placeholder="Type your issue. For better answers, include what happened, where it happened, and what you expected."
              className="min-h-20 flex-1 resize-none rounded-2xl border border-sky-100/35 bg-[#08162e]/85 px-4 py-3 text-[15px] text-white placeholder:text-sky-100/70 outline-none transition focus:border-sky-300/80"
            />
            <button
              type="button"
              onClick={() => {
                void sendMessage();
              }}
              disabled={loading || !input.trim()}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/50 bg-[linear-gradient(135deg,rgba(56,189,248,0.55),rgba(59,130,246,0.4),rgba(34,211,238,0.32))] text-sky-50 shadow-[0_12px_28px_rgba(3,105,161,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111f]" />}>
      <SupportPageContent />
    </Suspense>
  );
}
