"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageSquare, Send, X } from "lucide-react";

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "I am your Campaign Intelligence assistant. Tell me what is blocking you and I will help fix it.",
};

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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const scrollRef = useRef(null);

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

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [open, messages, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/campaign-intelligence-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.reply) {
        const fallback = payload?.error || "I could not process that request. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: String(payload.reply) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue while reaching the assistant. Please retry in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[80] flex items-center gap-3 rounded-full border border-cyan-300/30 bg-[#11192b]/95 px-4 py-3 text-left shadow-[0_10px_35px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:border-cyan-200/60"
          aria-label="Open AI campaign support chat"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
            <Bot size={18} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cyan-300" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/90">AI Support</span>
            <span className="block text-sm font-medium text-white/90">Need help fixing issues?</span>
          </span>
        </button>
      ) : (
        <section className="fixed bottom-5 right-5 z-[80] flex h-[28rem] w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#0c1424]/97 shadow-[0_22px_60px_rgba(2,8,23,0.62)]">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
                <MessageSquare size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Campaign AI Support</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-200/80">Groq assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/65 transition hover:bg-white/10 hover:text-white"
              aria-label="Close AI support chat"
            >
              <X size={16} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "border border-cyan-300/20 bg-cyan-500/10 text-cyan-50"
                    : "ml-auto border border-white/15 bg-white/10 text-white"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="max-w-[90%] rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-50">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 p-3">
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
                rows={2}
                placeholder="Describe the issue you want help with"
                className="min-h-[56px] flex-1 resize-none rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-cyan-300/55"
              />
              <button
                type="button"
                onClick={() => {
                  void sendMessage();
                }}
                disabled={loading || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/20 text-cyan-100 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
