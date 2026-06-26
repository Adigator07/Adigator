"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const LISTINGS = [
  { name: "Trattoria Bella Roma", category: "Italian · $$", rating: 4.8, reviews: 1204, distance: "0.3 mi", open: "Open until 10pm", tags: ["Dine-In", "Takeout", "Reservations"], gradient: "from-red-200 to-orange-200" },
  { name: "The Corner Bookshop", category: "Books & Gifts · $", rating: 4.9, reviews: 876, distance: "0.5 mi", open: "Open until 7pm", tags: ["In-Store", "Special Orders"], gradient: "from-amber-200 to-yellow-200" },
  { name: "Solstice Spa & Wellness", category: "Day Spa · $$$", rating: 4.7, reviews: 543, distance: "0.8 mi", open: "Open until 8pm", tags: ["Appointments", "Gift Cards"], gradient: "from-rose-200 to-pink-200" },
  { name: "Atlas Coffee Roasters", category: "Coffee · $", rating: 4.9, reviews: 2341, distance: "0.1 mi", open: "Open until 6pm", tags: ["Dine-In", "WiFi", "Outdoor Seats"], gradient: "from-amber-300 to-orange-300" },
  { name: "Neon Nights Cocktail Bar", category: "Bar & Lounge · $$", rating: 4.6, reviews: 789, distance: "0.4 mi", open: "Open until 2am", tags: ["Reservations", "Late Night"], gradient: "from-violet-200 to-purple-200" },
  { name: "Greenway Farmers Market", category: "Fresh Produce · $", rating: 4.8, reviews: 1567, distance: "1.2 mi", open: "Sat to Sun 8am to 2pm", tags: ["Organic", "Local"], gradient: "from-green-200 to-emerald-200" },
];

const MAP_PINS = [
  { x: "18%", y: "30%", name: "Atlas Coffee", color: "bg-amber-500" },
  { x: "35%", y: "55%", name: "Trattoria", color: "bg-red-500" },
  { x: "58%", y: "25%", name: "Solstice Spa", color: "bg-rose-500" },
  { x: "72%", y: "62%", name: "Neon Nights", color: "bg-violet-500" },
  { x: "45%", y: "70%", name: "Bookshop", color: "bg-amber-700" },
];

const REVIEWS = [
  { author: "Sarah M.", rating: 5, text: "Best pasta I've had outside of Rome. The ambiance is perfect for a date night. Highly recommend!", place: "Trattoria Bella Roma", time: "2 days ago" },
  { author: "Jake T.", rating: 5, text: "Incredible espresso. The owners know their beans and it shows. My go-to spot every morning.", place: "Atlas Coffee Roasters", time: "3 days ago" },
  { author: "Priya S.", rating: 4, text: "Lovely spa experience. The deep tissue massage was phenomenal. Will definitely be back.", place: "Solstice Spa & Wellness", time: "1 week ago" },
];

export default function BookingEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "LocalNow", device);
  const pubName = content.publisherName || "LocalNow";

  return (
    <article className="min-h-[1400px] bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black text-rose-600">{pubName}</div>
          {!isMobile && (
            <div className="flex-1 max-w-xl grid grid-cols-3 gap-2">
              <input type="text" placeholder="Restaurants, spas, shops..." className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
              <input type="text" placeholder="Near Downtown" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition hidden md:block">Sign In</button>
            <button className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition">Search</button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 md:px-8 py-2">
            <ul className="flex gap-2 overflow-x-auto text-xs font-semibold text-slate-600">
              {["All", "Restaurants", "Coffee", "Bars", "Shopping", "Beauty & Spa", "Markets", "Entertainment"].map((c) => (
                <li key={c}><button className={`px-3 py-1.5 rounded-full whitespace-nowrap transition ${c === "All" ? "bg-rose-600 text-white" : "bg-white border border-slate-200 hover:border-rose-400 hover:text-rose-600"}`}>{c}</button></li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Banner ad */}
      <section className="bg-slate-50 border-b border-slate-100 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[9px] uppercase tracking-widest text-slate-400 text-center mb-2">Sponsored · Local Business</p>
          <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Map section */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl">
          {/* Leaderboard inside map banner */}
          <div className="bg-slate-100 px-4 py-3 md:px-8">
            <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
          </div>
          {/* Simulated map */}
          <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
            {/* Street grid */}
            <div className="absolute inset-0 opacity-20">
              {[15, 30, 45, 60, 75, 90].map((x) => <div key={x} className="absolute top-0 bottom-0 w-px bg-slate-400" style={{ left: `${x}%` }} />)}
              {[20, 40, 60, 80].map((y) => <div key={y} className="absolute left-0 right-0 h-px bg-slate-400" style={{ top: `${y}%` }} />)}
            </div>
            {/* Blocks */}
            {["10% 8% 18% 22%", "32% 8% 20% 20%", "55% 8% 22% 18%", "10% 38% 22% 20%", "50% 38% 18% 22%", "72% 28% 18% 22%"].map((coords, i) => {
              const [left, top, width, height] = coords.split(" ");
              return <div key={i} className="absolute rounded-sm bg-slate-300/60" style={{ left, top, width, height }} />;
            })}
            {/* Pins */}
            {MAP_PINS.map((pin) => (
              <div key={pin.name} className="absolute flex flex-col items-center cursor-pointer group" style={{ left: pin.x, top: pin.y, transform: "translate(-50%, -100%)" }}>
                <div className={`w-7 h-7 rounded-full ${pin.color} shadow-md flex items-center justify-center border-2 border-white`}>
                  <span className="text-white text-[10px]">📍</span>
                </div>
                <div className="hidden group-hover:block absolute bottom-full mb-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-lg whitespace-nowrap text-[11px] font-semibold text-slate-800">{pin.name}</div>
              </div>
            ))}
            <div className="absolute bottom-3 right-3 bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-1.5 text-[11px] text-slate-500">Map data © {pubName} 2026</div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className={`mx-auto max-w-6xl px-4 py-6 md:px-8 ${isMobile ? "space-y-5" : "grid grid-cols-[1fr_280px] gap-7"}`}>
        <div className="space-y-6">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Open Near You</h2>
              <p className="text-sm text-slate-500">{LISTINGS.length} places · Sorted by distance</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Sort:</span>
              <select className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none">
                <option>Distance</option>
                <option>Rating</option>
                <option>Most Reviewed</option>
              </select>
            </div>
          </div>

          {/* Listings grid */}
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {LISTINGS.slice(0, 2).map((l) => (
              <div key={l.name} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer">
                <div className={`h-32 bg-gradient-to-br ${l.gradient} relative`}>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-700">★ {l.rating}</div>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {l.tags.map((t) => <span key={t} className="bg-white/80 text-[9px] font-semibold text-slate-700 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-rose-500 font-semibold mb-0.5">{l.category}</p>
                  <h3 className="text-base font-black text-slate-900">{l.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>📍 {l.distance}</span>
                    <span className="text-green-600 font-semibold">{l.open}</span>
                    <span>{l.reviews.toLocaleString()} reviews</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition">Book Now</button>
                    <button className="border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-50 transition">Directions</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inline ad */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-rose-400 mb-2 text-center">Sponsored · Local Offer</p>
            <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            {LISTINGS.slice(2, 4).map((l) => (
              <div key={l.name} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer">
                <div className={`h-32 bg-gradient-to-br ${l.gradient} relative`}>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-700">★ {l.rating}</div>
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-rose-500 font-semibold mb-0.5">{l.category}</p>
                  <h3 className="text-base font-black text-slate-900">{l.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>📍 {l.distance}</span>
                    <span className="text-green-600 font-semibold">{l.open}</span>
                  </div>
                  <button className="mt-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition">Book Now</button>
                </div>
              </div>
            ))}
          </div>

          {/* Community Reviews */}
          <section>
            <h3 className="text-lg font-black text-slate-900 mb-4">Recent Reviews</h3>
            <div className="space-y-4">
              {REVIEWS.map((r) => (
                <div key={r.author} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-xs font-black text-white">{r.author[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{r.author}</p>
                        <p className="text-[11px] text-rose-500">{r.place}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex">{Array.from({ length: r.rating }).map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}</div>
                      <span className="text-[10px] text-slate-400">{r.time}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </section>

          {/* Native feed ad */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl overflow-hidden grid md:grid-cols-2">
            <div className="p-5">
              <p className="text-[9px] uppercase tracking-widest text-rose-500 font-semibold">Sponsored · Local Partner</p>
              <h3 className="text-xl font-black text-slate-900 mt-2 mb-2">Reserve your table tonight</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Exclusive deals at the best local restaurants. Book in seconds, no service fees.</p>
              <button className="mt-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">Find Availability</button>
            </div>
            <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
          </div>
        </div>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="space-y-5 self-start sticky top-[100px]">
            <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-5 text-white">
              <h4 className="font-black text-base mb-2">Claim your business</h4>
              <p className="text-xs text-rose-100 mb-3">Free listing. Reach thousands of local customers.</p>
              <button className="w-full bg-white text-rose-700 text-xs font-black py-2.5 rounded-xl hover:bg-rose-50 transition">Get Listed Free</button>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Popular Categories</h4>
              {[["🍕", "Restaurants", "234"], ["☕", "Coffee Shops", "87"], ["💆", "Beauty & Spa", "56"], ["🛒", "Shopping", "143"], ["🍺", "Bars & Nightlife", "78"]].map(([icon, cat, count]) => (
                <div key={cat} className="flex items-center gap-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 transition">
                  <span>{icon}</span>
                  <span className="flex-1 text-sm text-slate-700">{cat}</span>
                  <span className="text-[11px] text-slate-400">{count}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Today's Hours</h4>
              <p className="text-xs text-slate-500 mb-2">Most places open until 9pm to 11pm tonight</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-xs text-green-600 font-semibold">142 places currently open</p>
              </div>
            </div>
          </aside>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 px-4 py-8 md:px-8 mt-4 font-sans">
        <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-6 text-sm">
          <div><p className="font-black text-white text-lg mb-2">{pubName}</p><p className="text-xs leading-relaxed">The best local discovery platform since 2015.</p></div>
          {[["Discover", "Restaurants", "Coffee Shops", "Shopping", "Entertainment"], ["For Business", "Claim Listing", "Advertise", "Analytics", "Partnerships"], ["Help", "Support", "Privacy", "Terms", "Cookies"]].map((col) => (
            <div key={col[0]}><p className="font-bold text-white text-xs uppercase tracking-wider mb-2">{col[0]}</p>{col.slice(1).map((l) => <a key={l} href="#" className="block text-xs py-0.5 hover:text-white transition">{l}</a>)}</div>
          ))}
        </div>
        <div className="border-t border-slate-700 mt-6 pt-4 text-center text-xs text-slate-600">© 2026 {pubName}. All rights reserved.</div>
      </footer>
    </article>
  );
}
