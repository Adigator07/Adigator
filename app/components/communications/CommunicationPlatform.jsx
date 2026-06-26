"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Search, Send, Paperclip, X, Check, CheckCheck,
  Clock, Eye, FileText, Image as ImageIcon, Activity,
  Loader2, RefreshCw, Archive,
} from "lucide-react";
import {
  fetchMyProfile,
  fetchConversations,
  fetchMessages,
  sendTextMessage,
  sendFileMessage,
  createConversation,
  lookupUserByEmail,
  fetchActivity,
  logActivityEvent,
  submitCreativeReview,
} from "../../lib/communications/communicationsService";
import { useCommunicationRealtime, usePresence } from "../../hooks/useCommunicationRealtime";
import { formatRelativeTime, formatFileSize, truncate, formatEventLabel, getEventIcon } from "../../lib/communications/formatters";
import { canReviewCreative } from "../../lib/communications/permissions";
import { getCommunicationPageCopy, getRoleLabel } from "../../lib/communications/roleLabels";

const REVIEW_BADGES = {
  pending: { label: "Pending Review", className: "bg-white/10 text-white/60" },
  in_review: { label: "In Review", className: "bg-blue-500/20 text-blue-300 animate-pulse" },
  approved: { label: "Approved", className: "bg-emerald-500/20 text-emerald-300" },
  revision_requested: { label: "Revision Requested", className: "bg-amber-500/20 text-amber-300" },
};

function Avatar({ name, online, size = "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className="relative shrink-0">
      <div className={`${sz} rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white`}>
        {(name || "U")[0]?.toUpperCase()}
      </div>
      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F1117] ${online ? "bg-emerald-400" : "bg-white/30"}`} />
    </div>
  );
}

function ReviewBadge({ status }) {
  const cfg = REVIEW_BADGES[status] || REVIEW_BADGES.pending;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.className}`}>{cfg.label}</span>;
}

function CreativeCard({ attachment, onReview, canReview }) {
  const isImage = attachment.file_type?.startsWith("image/");
  const review = Array.isArray(attachment.review) ? attachment.review[0] : attachment.review;
  const status = review?.status || "pending";

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-[#1F2435] overflow-hidden max-w-sm">
      <div className="aspect-video bg-black/30 flex items-center justify-center">
        {isImage && attachment.file_url ? (
          <img src={attachment.file_url} alt={attachment.file_name} className="max-h-full max-w-full object-contain" />
        ) : (
          <FileText size={32} className="text-white/30" />
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{attachment.file_name}</p>
            <p className="text-[11px] text-white/40">{formatFileSize(attachment.file_size)}</p>
          </div>
          <ReviewBadge status={status} />
        </div>
        {canReview && (
          <button
            onClick={() => onReview(attachment)}
            className="w-full py-2 rounded-lg bg-[#4F7EF7]/20 border border-[#4F7EF7]/40 text-[#4F7EF7] text-xs font-semibold hover:bg-[#4F7EF7]/30 transition"
          >
            Review Creative
          </button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn, onReviewCreative, canReview }) {
  const time = formatRelativeTime(message.sent_at);
  const isSystem = message.type === "system_event";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-white/40 italic bg-white/5 px-3 py-1 rounded-full">{message.body}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && <Avatar name={message.sender?.full_name} online={message.sender?.is_online} size="sm" />}
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="text-[11px] text-white/40 mb-1 ml-1">{message.sender?.full_name || "User"}</span>
        )}
        <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? "bg-[#4F7EF7] text-white rounded-br-md" : "bg-[#1F2435] border border-white/10 text-white/90 rounded-bl-md"}`}>
          {message.body && <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>}
          {(message.attachments || []).map((att) => (
            att.file_type?.startsWith("image/") && !message.type?.includes("creative") ? (
              <a key={att.id} href={att.file_url || "#"} target="_blank" rel="noreferrer" className="block mt-2">
                <img src={att.file_url} alt={att.file_name} className="rounded-lg max-h-48 object-cover" />
              </a>
            ) : (
              <CreativeCard key={att.id} attachment={att} onReview={onReviewCreative} canReview={canReview && !isOwn} />
            )
          ))}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-white/30">{time}</span>
          {isOwn && (
            <span className="text-white/40">
              {message.metadata?.delivery_status === "read" ? <CheckCheck size={12} className="text-[#4F7EF7]" /> : <Check size={12} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ events, loading }) {
  if (loading) {
    return <div className="p-4 text-sm text-white/40 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading activity...</div>;
  }

  if (!events.length) {
    return <div className="p-6 text-center text-sm text-white/40">No activity yet</div>;
  }

  return (
    <div className="p-4 space-y-0">
      {events.map((event, i) => {
        const userName = event.user?.full_name || "Someone";
        const label = formatEventLabel(event.event_type, userName, event.event_data || {});
        return (
          <div key={event.id} className="flex gap-3 relative pb-4">
            {i < events.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/10" />}
            <div className="w-6 h-6 rounded-full bg-[#1F2435] border border-white/10 flex items-center justify-center text-xs shrink-0 z-10">
              {getEventIcon(event.event_type)}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-white/80 leading-relaxed">{label}</p>
              <p className="text-[10px] text-white/30 mt-0.5" title={new Date(event.occurred_at).toLocaleString()}>
                {formatRelativeTime(event.occurred_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreativeReviewPanel({ attachment, onClose, onSubmit, submitting }) {
  const [status, setStatus] = useState("in_review");
  const [note, setNote] = useState("");

  useEffect(() => {
    logActivityEvent(attachment.conversation_id || attachment.message?.conversation_id, "review_started", {
      file_name: attachment.file_name,
    }, { relatedAttachmentId: attachment.id }).catch(() => {});
  }, [attachment]);

  const isImage = attachment.file_type?.startsWith("image/");

  return (
    <motion.div
      initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
      className="w-[360px] border-l border-white/10 bg-[#181C27] flex flex-col shrink-0"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{attachment.file_name}</p>
          <p className="text-[11px] text-white/40">{formatFileSize(attachment.file_size)}</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl border border-white/10 bg-black/20 aspect-video flex items-center justify-center mb-4">
          {isImage && attachment.file_url ? (
            <img src={attachment.file_url} alt={attachment.file_name} className="max-h-full max-w-full object-contain" />
          ) : attachment.file_type?.startsWith("video/") ? (
            <video src={attachment.file_url} controls className="max-h-full max-w-full" />
          ) : (
            <div className="text-center p-4">
              <FileText size={40} className="mx-auto text-white/20 mb-2" />
              <a href={attachment.file_url} target="_blank" rel="noreferrer" className="text-xs text-[#4F7EF7] hover:underline">Download to review</a>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Review Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "approved", label: "Approve", icon: "✅" },
              { id: "revision_requested", label: "Request Revision", icon: "🔄" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatus(opt.id)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${status === opt.id ? "border-[#4F7EF7] bg-[#4F7EF7]/20 text-[#4F7EF7]" : "border-white/10 text-white/60 hover:border-white/20"}`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={status === "revision_requested" ? "Describe required changes (required)..." : "Optional review note..."}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50 resize-none"
          />
          <button
            onClick={() => onSubmit(attachment.id, status, note)}
            disabled={submitting || (status === "revision_requested" && !note.trim())}
            className="w-full py-2.5 rounded-xl bg-[#4F7EF7] text-white text-sm font-semibold hover:bg-[#4F7EF7]/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Submit Review
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NewConversationModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [title, setTitle] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setRecipientEmail("");
    setRecipient(null);
    setTitle("");
    setProjectRef("");
    setWelcomeMessage("");
    setFiles([]);
    setError("");
  }, [open]);

  const handleLookupRecipient = async () => {
    const email = recipientEmail.trim().toLowerCase();
    if (!email) {
      setError("Enter the recipient's email address");
      return;
    }

    setLookingUp(true);
    setError("");
    try {
      const user = await lookupUserByEmail(email);
      setRecipient(user);
    } catch (err) {
      setRecipient(null);
      setError(err.message || "Could not find that user");
    } finally {
      setLookingUp(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const conv = await createConversation({
        title,
        recipient_email: recipientEmail.trim().toLowerCase(),
        project_ref: projectRef || null,
        welcome_message: welcomeMessage || null,
        type: projectRef ? "project" : "direct",
      });

      if (files.length > 0) {
        await sendFileMessage(conv.id, welcomeMessage ? "" : "Shared files for your review.", files);
      }

      onCreated(conv);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const canContinueStep1 = Boolean(recipient && title.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#181C27] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">New Message</h2>
            <p className="text-xs text-white/40">
              Step {step} of 2: {step === 1 ? "Recipient & details" : "Attach files (optional)"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Recipient email *</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => { setRecipientEmail(e.target.value); setRecipient(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLookupRecipient(); } }}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50"
                  />
                  <button
                    type="button"
                    onClick={handleLookupRecipient}
                    disabled={lookingUp || !recipientEmail.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 disabled:opacity-40 transition"
                  >
                    {lookingUp ? <Loader2 size={16} className="animate-spin" /> : "Find"}
                  </button>
                </div>
                {recipient && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <Avatar name={recipient.full_name} online={recipient.is_online} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{recipient.full_name || recipient.email}</p>
                      <p className="text-[11px] text-white/50 truncate">{recipient.email}</p>
                    </div>
                    <Check size={16} className="text-emerald-400 ml-auto shrink-0" />
                  </div>
                )}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Conversation title *"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50"
              />
              <input
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                placeholder="Project reference (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50"
              />
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="First message (optional)"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50 resize-none"
              />
              <button
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="w-full py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 disabled:opacity-40 transition"
              >
                Next: Attach Files →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block w-full border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-[#4F7EF7]/50 transition">
                <Paperclip size={24} className="mx-auto text-white/30 mb-2" />
                <p className="text-sm text-white/60">Drop files or click to browse</p>
                <p className="text-[11px] text-white/30 mt-1">Images, videos, PDFs. Optional.</p>
                <input type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f) => (
                    <span key={f.name} className="text-xs bg-white/10 px-2 py-1 rounded-lg text-white/70">{f.name}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="p-5 border-t border-white/10 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition">
              Back
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleCreate}
              disabled={loading || !canContinueStep1}
              className="flex-1 py-2.5 rounded-xl bg-[#4F7EF7] text-white text-sm font-semibold hover:bg-[#4F7EF7]/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Send Message
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function CommunicationPlatform() {
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [rightPanel, setRightPanel] = useState("activity");
  const [reviewAttachment, setReviewAttachment] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);

  usePresence();

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const canCreate = Boolean(profile?.id);
  const canReview = canReviewCreative(profile?.role);
  const copy = getCommunicationPageCopy(profile?.role);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const data = await fetchConversations();
      setConversations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const loadMessages = useCallback(async (convId) => {
    setLoadingMsgs(true);
    try {
      const data = await fetchMessages(convId);
      setMessages(data || []);
      const lastMsg = data?.[data.length - 1];
      if (lastMsg) {
        logActivityEvent(convId, "message_opened", {}, { relatedMessageId: lastMsg.id }).catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const loadActivityFeed = useCallback(async (convId) => {
    setLoadingActivity(true);
    try {
      const data = await fetchActivity(convId);
      setActivity(data || []);
    } catch {
      setActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProfile().then(setProfile).catch(() => {});
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    loadActivityFeed(selectedId);
  }, [selectedId, loadMessages, loadActivityFeed]);

  useCommunicationRealtime(selectedId, {
    onMessage: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      loadConversations();
    },
    onActivity: (evt) => {
      setActivity((prev) => {
        if (prev.some((e) => e.id === evt.id)) return prev;
        return [evt, ...prev];
      });
    },
  });

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      (c.title || "").toLowerCase().includes(q)
      || (c.other_participant?.full_name || "").toLowerCase().includes(q)
      || (c.project_ref || "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const handleSend = async () => {
    if (!selectedId || sending) return;
    if (!draft.trim() && pendingFiles.length === 0) return;

    setSending(true);
    try {
      let msg;
      if (pendingFiles.length > 0) {
        msg = await sendFileMessage(selectedId, draft.trim(), pendingFiles);
      } else {
        msg = await sendTextMessage(selectedId, draft.trim());
      }
      setMessages((prev) => [...prev, msg]);
      setDraft("");
      setPendingFiles([]);
      loadConversations();
      loadActivityFeed(selectedId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleReviewSubmit = async (attachmentId, status, note) => {
    setSubmittingReview(true);
    try {
      await submitCreativeReview(attachmentId, status, note);
      setReviewAttachment(null);
      if (selectedId) {
        loadMessages(selectedId);
        loadActivityFeed(selectedId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const milestoneStats = useMemo(() => {
    const fileEvents = activity.filter((e) => ["file_uploaded", "creative_assigned"].includes(e.event_type));
    const msgEvents = activity.filter((e) => e.event_type === "message_sent");
    const reviews = activity.filter((e) => e.event_type === "review_submitted");
    const approved = reviews.filter((e) => e.event_data?.status === "approved").length;
    const pending = reviews.filter((e) => e.event_data?.status !== "approved").length;
    return { files: fileEvents.length, messages: msgEvents.length, approved, pending };
  }, [activity]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">{copy.title}</h1>
            {profile?.role && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#4F7EF7]/20 text-[#4F7EF7] border border-[#4F7EF7]/30">
                {profile.role_label || getRoleLabel(profile.role)}
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm mt-1">{copy.subtitle}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4F7EF7] text-white text-sm font-semibold hover:bg-[#4F7EF7]/90 transition"
          >
            <Plus size={16} /> New Message
          </button>
        )}
      </div>

    <div className="h-[calc(100vh-12rem)] flex rounded-2xl border border-white/10 overflow-hidden bg-[#0F1117]">
      {/* Left: Conversation List */}
      <div className="w-[280px] shrink-0 border-r border-white/10 flex flex-col bg-[#181C27]">
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-[#4F7EF7]" /> Messages
            </h2>
            {canCreate && (
              <button onClick={() => setShowNewModal(true)} className="w-8 h-8 rounded-lg bg-[#4F7EF7]/20 border border-[#4F7EF7]/40 flex items-center justify-center text-[#4F7EF7] hover:bg-[#4F7EF7]/30 transition">
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-xs text-white/40 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={32} className="mx-auto text-white/20 mb-2" />
              <p className="text-sm text-white/50">{copy.emptyTitle}</p>
              {canCreate && (
                <button onClick={() => setShowNewModal(true)} className="mt-3 text-xs text-[#4F7EF7] hover:underline">
                  Start a new message by email
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.other_participant;
              const active = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full flex items-start gap-3 p-4 border-b border-white/5 transition text-left ${active ? "bg-[#4F7EF7]/10 border-l-2 border-l-[#4F7EF7]" : "hover:bg-white/5 border-l-2 border-l-transparent"}`}
                >
                  <Avatar name={other?.full_name} online={other?.is_online} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white truncate">{conv.title}</p>
                      <span className="text-[10px] text-white/30 shrink-0">{formatRelativeTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{other?.full_name || copy.participantLabel}</p>
                    <p className="text-xs text-white/50 truncate mt-0.5">{truncate(conv.last_message_preview || "No messages yet", 35)}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#4F7EF7] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Center: Message Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConv ? (
          <>
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#181C27]">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={selectedConv.other_participant?.full_name} online={selectedConv.other_participant?.is_online} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{selectedConv.title}</p>
                  <p className="text-[11px] text-white/40">
                    {selectedConv.other_participant?.is_online ? "Online" : `Last seen ${formatRelativeTime(selectedConv.other_participant?.last_seen_at)}`}
                    {selectedConv.project_ref && ` · ${selectedConv.project_ref}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setRightPanel("activity"); setReviewAttachment(null); }} className={`p-2 rounded-lg transition ${rightPanel === "activity" ? "bg-[#4F7EF7]/20 text-[#4F7EF7]" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                  <Activity size={16} />
                </button>
                <button onClick={() => loadMessages(selectedId)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto p-5">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full text-white/40 text-sm gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <MessageSquare size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === profile?.id}
                    canReview={canReview}
                    onReviewCreative={(att) => { setReviewAttachment({ ...att, conversation_id: selectedId }); setRightPanel("review"); }}
                  />
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#181C27]">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingFiles.map((f) => (
                    <span key={f.name} className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-lg text-white/70">
                      {f.name}
                      <button onClick={() => setPendingFiles((prev) => prev.filter((x) => x.name !== f.name))}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition shrink-0">
                  <Paperclip size={18} />
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={(e) => setPendingFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4F7EF7]/50 resize-none max-h-32"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!draft.trim() && pendingFiles.length === 0)}
                  className="p-2.5 rounded-xl bg-[#4F7EF7] text-white hover:bg-[#4F7EF7]/90 disabled:opacity-40 transition shrink-0"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/40 px-6 text-center">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-semibold text-white/60 mb-1">{copy.title}</p>
            <p className="text-sm">{copy.emptyHint}</p>
            {canCreate && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#4F7EF7]/20 border border-[#4F7EF7]/40 text-[#4F7EF7] text-sm font-semibold hover:bg-[#4F7EF7]/30 transition"
              >
                New Message
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {(rightPanel === "activity" || reviewAttachment) && selectedConv && (
          reviewAttachment ? (
            <CreativeReviewPanel
              key="review"
              attachment={reviewAttachment}
              onClose={() => { setReviewAttachment(null); setRightPanel("activity"); }}
              onSubmit={handleReviewSubmit}
              submitting={submittingReview}
            />
          ) : (
            <motion.div
              key="activity"
              initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
              className="w-[320px] border-l border-white/10 bg-[#181C27] flex flex-col shrink-0"
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-[#4F7EF7]" /> Activity Timeline
                </h3>
              </div>

              <div className="px-4 py-3 border-b border-white/10 grid grid-cols-2 gap-2">
                {[
                  { label: "Messages", value: milestoneStats.messages },
                  { label: "Files", value: milestoneStats.files },
                  { label: "Approved", value: milestoneStats.approved },
                  { label: "Pending", value: milestoneStats.pending },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                <ActivityTimeline events={activity} loading={loadingActivity} />
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-sm px-4 py-2 rounded-xl shadow-lg z-50">
          {error}
          <button onClick={() => setError("")} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(conv) => { loadConversations(); setSelectedId(conv.id); }}
      />
    </div>
    </div>
  );
}
