"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { AdBadge } from "../../shared/previewUi";
import { dummyGmailEmails } from "../../dummy/googleDummy";

export default function GmailPreview({ headline, description, cta, brandName }) {
  const before = dummyGmailEmails.slice(0, 5);
  const after = dummyGmailEmails.slice(5, 8);

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="bg-white text-gray-900 min-h-[640px] flex">
        <aside className="w-56 border-r border-gray-200 p-4 shrink-0">
          <button type="button" className="w-full rounded-2xl bg-[#c2e7ff] py-3 text-sm font-semibold text-[#001d35] mb-4">✏ Compose</button>
          {["Inbox", "Starred", "Sent", "Drafts", "Promotions"].map((label, i) => (
            <div key={label} className={`px-3 py-2 rounded-full text-sm mb-1 ${i === 0 ? "bg-[#d3e3fd] font-semibold" : "text-gray-700"}`}>{label}</div>
          ))}
        </aside>
        <main className="flex-1">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 rounded-lg bg-[#eaf1fb] px-4 py-2 text-sm text-gray-500">Search mail</div>
            <span className="text-gray-500">⚙</span>
          </div>
          {before.map((email) => (
            <div key={email.subject} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
              <span className="text-gray-400">☐ ☆</span>
              <span className="w-40 shrink-0 font-medium text-sm truncate">{email.sender}</span>
              <span className="flex-1 text-sm truncate"><strong>{email.subject}</strong> — {email.snippet}</span>
              <span className="text-xs text-gray-500 shrink-0">{email.time}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-[#fef7e0]">
            <span className="text-gray-400">☐ ☆</span>
            <AdBadge />
            <span className="w-36 shrink-0 font-medium text-sm truncate">{brandName}</span>
            <span className="flex-1 text-sm truncate"><strong>{headline}</strong> — {description}</span>
            <span className="shrink-0 rounded-full bg-[#1a73e8] px-3 py-1 text-xs font-semibold text-white">{cta}</span>
          </div>
          {after.map((email) => (
            <div key={email.subject} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <span className="text-gray-400">☐ ☆</span>
              <span className="w-40 shrink-0 font-medium text-sm truncate">{email.sender}</span>
              <span className="flex-1 text-sm truncate"><strong>{email.subject}</strong> — {email.snippet}</span>
              <span className="text-xs text-gray-500 shrink-0">{email.time}</span>
            </div>
          ))}
        </main>
      </div>
    </PreviewFrame>
  );
}
