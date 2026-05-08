"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

const FEED_USERS = [
  { handle: "@techinsider", name: "TechInsider", avatar: "🤖", time: "2m", likes: "1.2K", reposts: "342" },
  { handle: "@marketpulse", name: "Market Pulse", avatar: "📈", time: "15m", likes: "867", reposts: "119" },
  { handle: "@designweekly", name: "Design Weekly", avatar: "🎨", time: "43m", likes: "2.4K", reposts: "890" },
  { handle: "@startupbeat", name: "Startup Beat", avatar: "🚀", time: "1h", likes: "534", reposts: "88" },
];

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 560);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="border border-purple-200 bg-purple-50/30 overflow-hidden" style={{ maxWidth: maxW }}>
      <img src={creativeUrl} alt="Sponsored" style={{ width: "100%", height: dispH, objectFit: "cover", display: "block" }} />
    </div>
  );
}

export default function SocialEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const bodyBlocks = content.contextBlocks.filter((b) => b.type === "body");
  const headline = content.contextBlocks.find((b) => b.type === "headline")?.text ?? "Here's what's trending in your industry today";
  const publisher = content.publisherName ?? "FeedFlow";
  const isMobile = device === "mobile";

  return (
    <div className="bg-[#0f1117] min-h-screen font-sans border border-white/10 rounded-xl overflow-hidden shadow-xl text-white">
      {/* Top nav */}
      <header className="border-b border-white/10 bg-[#0f1117]/90 backdrop-blur px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {publisher}
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-sm hover:bg-white/10 transition">🔍</button>
            <button className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-sm hover:bg-white/10 transition">🔔</button>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">Y</div>
          </div>
        </div>
      </header>

      {/* Stories row */}
      {!isMobile && (
        <div className="border-b border-white/10 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3 overflow-x-auto pb-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-[#0f1117] flex items-center justify-center text-lg">+</div>
              </div>
              <span className="text-[10px] text-gray-400">Your story</span>
            </div>
            {FEED_USERS.slice(0, 4).map((u) => (
              <div key={u.handle} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-lg">{u.avatar}</div>
                </div>
                <span className="text-[10px] text-gray-400 max-w-[48px] truncate">{u.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`max-w-2xl mx-auto py-4 px-4 ${isMobile ? "" : "flex gap-6"}`}>
        {/* Feed column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Leaderboard */}
          {slotType === "leaderboard" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-300 font-semibold uppercase tracking-widest">Sponsored</span>
                <span className="text-xs text-gray-500 font-mono">{creativeSize}</span>
              </div>
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}

          {/* Post 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl flex-shrink-0">{FEED_USERS[0].avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white text-sm">{FEED_USERS[0].name}</span>
                  <span className="text-gray-500 text-xs">{FEED_USERS[0].handle}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{FEED_USERS[0].time}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">{headline}</p>
                <div className="flex items-center gap-5 mt-3 text-gray-500 text-xs">
                  <span className="flex items-center gap-1 hover:text-pink-400 cursor-pointer transition">❤️ {FEED_USERS[0].likes}</span>
                  <span className="flex items-center gap-1 hover:text-green-400 cursor-pointer transition">🔁 {FEED_USERS[0].reposts}</span>
                  <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer transition">💬 Reply</span>
                  <span className="flex items-center gap-1 hover:text-purple-400 cursor-pointer transition">📤 Share</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sponsored feed card */}
          {slotType === "feed-card" && (
            <div className="bg-white/5 border-2 border-purple-500/40 rounded-2xl p-4 relative">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">AD</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-bold text-white text-sm">Sponsored</span>
                    <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">Ad</span>
                    <span className="text-gray-500 text-xs font-mono ml-auto">{creativeSize}</span>
                  </div>
                  <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
                  <div className="flex items-center gap-5 mt-3 text-gray-500 text-xs">
                    <span className="flex items-center gap-1 cursor-pointer">❤️ Like</span>
                    <span className="flex items-center gap-1 cursor-pointer">💬 Comment</span>
                    <span className="flex items-center gap-1 cursor-pointer">📤 Share</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xl flex-shrink-0">{FEED_USERS[1].avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white text-sm">{FEED_USERS[1].name}</span>
                  <span className="text-gray-500 text-xs">{FEED_USERS[1].handle}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{FEED_USERS[1].time}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                  {bodyBlocks[0]?.text ?? "Thread: 5 insights from our latest quarterly analysis that every marketer needs to read before Q3 planning begins. 🧵"}
                </p>
                <div className="w-full h-32 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl mt-2 flex items-center justify-center text-gray-500 text-sm">
                  Attached media
                </div>
                <div className="flex items-center gap-5 mt-3 text-gray-500 text-xs">
                  <span className="flex items-center gap-1 hover:text-pink-400 cursor-pointer transition">❤️ {FEED_USERS[1].likes}</span>
                  <span className="flex items-center gap-1 hover:text-green-400 cursor-pointer transition">🔁 {FEED_USERS[1].reposts}</span>
                  <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer transition">💬 Reply</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post 3 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-xl flex-shrink-0">{FEED_USERS[2].avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white text-sm">{FEED_USERS[2].name}</span>
                  <span className="text-gray-500 text-xs">{FEED_USERS[2].handle}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{FEED_USERS[2].time}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                  {bodyBlocks[1]?.text ?? "The data is clear: organizations that invest in systematic creative intelligence see 3–5x better campaign efficiency. Here's the breakdown."}
                </p>
                <div className="flex items-center gap-5 mt-3 text-gray-500 text-xs">
                  <span className="flex items-center gap-1 hover:text-pink-400 cursor-pointer transition">❤️ {FEED_USERS[2].likes}</span>
                  <span className="flex items-center gap-1 hover:text-green-400 cursor-pointer transition">🔁 {FEED_USERS[2].reposts}</span>
                  <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer transition">💬 Reply</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inline ad */}
          {slotType === "inline" && (
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-purple-300 font-semibold uppercase tracking-widest">Promoted</span>
                <span className="text-xs text-gray-500 font-mono">{creativeSize}</span>
              </div>
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}
        </div>

        {/* Right panel (desktop only) */}
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 space-y-4">
            {slotType === "sidebar" && (
              <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-3">
                <span className="text-xs text-purple-300 font-semibold uppercase tracking-widest block mb-2">Sponsored</span>
                <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Who to Follow</p>
              <div className="space-y-3">
                {FEED_USERS.slice(2).map((u) => (
                  <div key={u.handle} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-base">{u.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.handle}</p>
                    </div>
                    <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full font-semibold transition">Follow</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Trending Topics</p>
              <div className="space-y-2">
                {["#AIMarketing", "#CreativeOps", "#AdTech2026", "#CampaignROI"].map((tag) => (
                  <div key={tag} className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg px-1 py-1 transition">
                    <span className="text-sm text-purple-400 font-medium">{tag}</span>
                    <span className="text-xs text-gray-500">{Math.floor(Math.random() * 90 + 10)}K posts</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
