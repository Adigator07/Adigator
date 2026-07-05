"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleQuestion, Sparkles, X } from "lucide-react";

import type { CampaignAssistantQuestion } from "@/app/lib/campaignAssistant/types";

type CampaignAssistantModalProps = {
  open: boolean;
  reasoning?: string;
  questions: CampaignAssistantQuestion[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
};

export default function CampaignAssistantModal({
  open,
  reasoning = "",
  questions,
  submitting = false,
  onClose,
  onSubmit,
}: CampaignAssistantModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setAnswers(Object.fromEntries(questions.map((question) => [question.id, ""])));
  }, [open, questions]);

  const canSubmit = questions.some((question) => answers[question.id]?.trim());

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close assistant"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={submitting ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-violet-400/25 bg-[#101322] shadow-[0_24px_80px_-20px_rgba(124,58,237,0.45)]"
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/15 via-transparent to-cyan-500/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                      Campaign Assistant
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-white">A few details will improve analysis accuracy</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {reasoning || "The analyzer needs a little more campaign context before it can run with high confidence."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <form
              className="max-h-[min(70vh,640px)] overflow-y-auto px-6 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit(answers);
              }}
            >
              <div className="space-y-4">
                {questions.map((question) => (
                  <label key={question.id} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-start gap-2">
                      <MessageCircleQuestion size={15} className="mt-0.5 shrink-0 text-violet-300" />
                      <div>
                        <p className="text-sm font-semibold text-white">{question.prompt}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{question.whyNeeded}</p>
                      </div>
                    </div>
                    <textarea
                      value={answers[question.id] || ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAnswers((current) => ({ ...current, [question.id]: value }));
                      }}
                      rows={3}
                      placeholder={question.placeholder || "Add the detail that best matches your campaign"}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-xs text-slate-500">
                  Your answers are saved with this campaign and won&apos;t be asked again unless inputs change.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                  >
                    Not now
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Saving & analyzing…" : "Continue analysis"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
