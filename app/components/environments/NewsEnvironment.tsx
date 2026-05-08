"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 700);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);

  return (
    <div className="relative flex flex-col items-center my-4">
      <div className="w-full flex items-center justify-between mb-1 px-0.5">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Advertisement</span>
        <span className="text-[9px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div
        className="border border-gray-200 overflow-hidden bg-gray-50 shadow-sm"
        style={{ width: maxW, height: dispH }}
      >
        <img
          src={creativeUrl}
          alt="Ad creative"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    </div>
  );
}

export default function NewsEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Breaking: Major industry shift reshapes market expectations";
  const byline = content.contextBlocks.find((b) => b.type === "byline")?.text ?? "Staff Reporter · May 9, 2026 · 5 min read";
  const label = content.contextBlocks.find((b) => b.type === "label")?.text ?? "Business";
  const bodyBlocks = content.contextBlocks.filter((b) => b.type === "body");
  const trending = content.uiModules.find((m) => m.type === "trending");
  const related = content.uiModules.find((m) => m.type === "sidebar-widget");
  const publisher = content.publisherName ?? "The Digital Post";
  const isMobile = device === "mobile";

  return (
    <div className="bg-white font-serif min-h-screen border border-gray-200 rounded-xl overflow-hidden shadow-xl">
      {/* Masthead */}
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <div className="text-2xl font-black tracking-tight text-gray-900">{publisher}</div>
            <div className="text-[10px] text-gray-400 tracking-widest uppercase font-sans mt-0.5">
              Breaking News · Live Updates · Analysis
            </div>
          </div>
          {!isMobile && (
            <nav className="flex items-center gap-6 text-xs font-sans font-semibold text-gray-600 uppercase tracking-wider">
              {["World", "Business", "Tech", "Science", "Opinion"].map((n) => (
                <span key={n} className={n === label ? "text-red-600 border-b-2 border-red-600 pb-0.5" : "hover:text-black cursor-pointer"}>
                  {n}
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Top leaderboard slot */}
      {slotType === "leaderboard" && (
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex justify-center">
          <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
        </div>
      )}

      <div className={`max-w-6xl mx-auto px-4 py-6 ${isMobile ? "" : "flex gap-8"}`}>
        {/* Main article column */}
        <main className={isMobile ? "w-full" : "flex-1 min-w-0"}>
          {/* Section label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-red-600 text-white text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
              {label}
            </span>
            <span className="text-gray-400 text-xs font-sans">·</span>
            <span className="text-gray-400 text-xs font-sans">Updated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
            {headline}
          </h1>

          {/* Byline */}
          <p className="text-sm font-sans text-gray-500 mb-4 border-b border-gray-100 pb-4">{byline}</p>

          {/* Hero image placeholder */}
          <div className="w-full h-52 bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-4 flex items-center justify-center">
            <span className="text-gray-400 font-sans text-sm">Featured image</span>
          </div>

          {/* Body paragraph 1 */}
          {bodyBlocks[0] && (
            <p className="text-base text-gray-800 leading-relaxed mb-4 font-serif">{bodyBlocks[0].text}</p>
          )}

          {/* Inline ad slot (between paragraphs) */}
          {(slotType === "inline" || slotType === "native-recommendation") && (
            <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
          )}

          {/* Body paragraph 2 */}
          {bodyBlocks[1] && (
            <p className="text-base text-gray-800 leading-relaxed mb-4 font-serif">{bodyBlocks[1].text}</p>
          )}

          <p className="text-base text-gray-800 leading-relaxed mb-4 font-serif">
            Industry analysts note that consumer behavior continues to evolve at an accelerated pace,
            creating new opportunities for brands positioned to act decisively on actionable insights
            rather than reactive trends.
          </p>

          {/* Related at the bottom for mobile */}
          {isMobile && related && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500 mb-3">
                {related.label ?? "You May Also Like"}
              </p>
              <div className="space-y-3">
                {related.items?.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-16 h-12 bg-gray-200 rounded flex-shrink-0" />
                    <div>
                      <p className="text-sm font-sans font-semibold text-gray-800 leading-snug">{item.text}</p>
                      <p className="text-xs font-sans text-gray-400 mt-0.5">{item.secondary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="w-72 flex-shrink-0 space-y-6">
            {/* Sidebar ad slot */}
            {slotType === "sidebar" && (
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            )}

            {/* Trending */}
            {trending && (
              <div>
                <p className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-2">
                  {trending.label ?? "Trending Now"}
                </p>
                <div className="space-y-3">
                  {trending.items?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 cursor-pointer group">
                      <span className="text-2xl font-black text-gray-200 leading-none font-sans w-7 flex-shrink-0 group-hover:text-red-400 transition">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-sans font-semibold text-gray-800 leading-snug group-hover:text-red-600 transition">
                          {item.text}
                        </p>
                        <p className="text-xs font-sans text-gray-400 mt-0.5">{item.secondary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related / sidebar widget */}
            {related && (
              <div>
                <p className="text-xs font-sans font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-2">
                  {related.label ?? "You May Also Like"}
                </p>
                <div className="space-y-3">
                  {related.items?.map((item, i) => (
                    <div key={i} className="flex gap-3 cursor-pointer group">
                      <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0" />
                      <div>
                        <p className="text-xs font-sans font-semibold text-gray-800 leading-snug group-hover:text-blue-600 transition">
                          {item.text}
                        </p>
                        <p className="text-[10px] font-sans text-gray-400 mt-0.5">{item.secondary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
