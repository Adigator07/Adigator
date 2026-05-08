"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

const TICKER = [
  { symbol: "AAPL", price: "201.34", change: "+1.24", up: true },
  { symbol: "MSFT", price: "419.87", change: "+0.98", up: true },
  { symbol: "TSLA", price: "178.92", change: "-2.31", up: false },
  { symbol: "NVDA", price: "892.15", change: "+4.67", up: true },
  { symbol: "AMZN", price: "184.52", change: "-0.44", up: false },
  { symbol: "META", price: "507.21", change: "+2.88", up: true },
];

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 700);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Advertisement</span>
        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div className="border border-gray-200 overflow-hidden shadow-sm" style={{ width: maxW, height: dispH }}>
        <img src={creativeUrl} alt="Ad" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

export default function FinanceEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Markets rally as central banks signal rate stability through mid-year";
  const byline = content.contextBlocks.find((b) => b.type === "byline")?.text ?? "Financial Desk · May 9, 2026 · 6 min read";
  const bodyBlocks = content.contextBlocks.filter((b) => b.type === "body");
  const trending = content.uiModules.find((m) => m.type === "trending");
  const related = content.uiModules.find((m) => m.type === "sidebar-widget");
  const publisher = content.publisherName ?? "MarketWatch Pro";
  const isMobile = device === "mobile";

  return (
    <div className="bg-white font-sans min-h-screen border border-gray-200 rounded-xl overflow-hidden shadow-xl">
      {/* Market ticker */}
      <div className="bg-slate-900 text-white px-4 py-1.5 overflow-hidden">
        <div className="flex items-center gap-6 text-xs font-mono overflow-x-auto">
          {TICKER.map((t) => (
            <span key={t.symbol} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="font-bold text-white">{t.symbol}</span>
              <span className="text-gray-300">{t.price}</span>
              <span className={t.up ? "text-green-400" : "text-red-400"}>{t.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Masthead */}
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{publisher}</div>
            <div className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">
              Markets · Economy · Investing · Business
            </div>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-1 text-xs font-semibold text-white">
              <span className="bg-blue-700 px-3 py-1.5 rounded cursor-pointer">Subscribe</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded cursor-pointer ml-2">Sign In</span>
            </div>
          )}
        </div>
      </header>

      {/* Leaderboard */}
      {slotType === "leaderboard" && (
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex justify-center">
          <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
        </div>
      )}

      {/* Top nav */}
      {!isMobile && (
        <nav className="border-b border-gray-200 bg-white px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-semibold text-gray-700 overflow-x-auto">
            {["Markets", "Business", "Economy", "Tech", "Investing", "Real Estate", "Personal Finance"].map((n, i) => (
              <span key={n} className={`py-3 border-b-2 cursor-pointer whitespace-nowrap ${i === 0 ? "border-blue-700 text-blue-700" : "border-transparent hover:text-black"}`}>
                {n}
              </span>
            ))}
          </div>
        </nav>
      )}

      <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "" : "flex gap-8"}`}>
        {/* Main content */}
        <main className={isMobile ? "w-full" : "flex-1 min-w-0"}>
          {/* Label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 border-l-4 border-blue-700 pl-2">Markets</span>
            <span className="text-gray-400 text-xs">· LIVE</span>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-3">{headline}</h1>
          <p className="text-sm text-gray-500 mb-4 border-b border-gray-100 pb-4">{byline}</p>

          {/* Data callouts */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[["S&P 500", "5,127.34", "+0.84%", true], ["DOW", "38,416.21", "+0.52%", true], ["NASDAQ", "16,282.15", "-0.21%", false]].map(([name, val, chg, up]) => (
              <div key={name as string} className="border border-gray-200 rounded-xl px-3 py-2 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{name as string}</p>
                <p className="text-lg font-black text-gray-900 mt-0.5">{val as string}</p>
                <p className={`text-sm font-semibold ${up ? "text-green-600" : "text-red-600"}`}>{chg as string}</p>
              </div>
            ))}
          </div>

          {/* Body 1 */}
          {bodyBlocks[0] && (
            <p className="text-base text-gray-800 leading-relaxed mb-4">{bodyBlocks[0].text}</p>
          )}

          {/* Inline ad */}
          {(slotType === "inline" || slotType === "native-recommendation") && (
            <div className="my-5">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}

          {/* Body 2 */}
          {bodyBlocks[1] && (
            <p className="text-base text-gray-800 leading-relaxed mb-4">{bodyBlocks[1].text}</p>
          )}

          <p className="text-base text-gray-800 leading-relaxed mb-4">
            Institutional investors remain cautiously optimistic, with the latest allocation surveys showing a rotation toward defensive assets and quality growth equities heading into Q3 earnings season.
          </p>

          {/* Related bottom (mobile) */}
          {isMobile && trending && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Related Stories</p>
              <div className="space-y-3">
                {trending.items?.map((item, i) => (
                  <div key={i} className="border-b border-gray-100 pb-2 cursor-pointer">
                    <p className="text-sm font-semibold text-gray-800 hover:text-blue-700 transition">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.secondary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="w-72 flex-shrink-0 space-y-5">
            {slotType === "sidebar" && (
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            )}
            {trending && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-2">
                  {trending.label ?? "Top Stories"}
                </p>
                <div className="space-y-3">
                  {trending.items?.map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-2 cursor-pointer">
                      <p className="text-sm font-semibold text-gray-800 hover:text-blue-700 transition leading-snug">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.secondary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {related && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-2">
                  {related.label ?? "Sponsored Content"}
                </p>
                <div className="space-y-3">
                  {related.items?.map((item, i) => (
                    <div key={i} className="flex gap-3 cursor-pointer group">
                      <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-700 transition leading-snug">{item.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.secondary}</p>
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
