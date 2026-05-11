"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const DESTINATIONS = [
  { name: "Santorini, Greece", type: "Island Escape", price: "From $1,240/pp", nights: 7, gradient: "from-blue-400 to-cyan-500", rating: 4.9, reviews: 3421 },
  { name: "Kyoto, Japan", type: "Cultural Immersion", price: "From $1,890/pp", nights: 10, gradient: "from-rose-400 to-pink-500", rating: 4.8, reviews: 2876 },
  { name: "Patagonia, Argentina", type: "Adventure Trek", price: "From $2,340/pp", nights: 14, gradient: "from-emerald-500 to-teal-600", rating: 4.7, reviews: 1243 },
  { name: "Amalfi Coast, Italy", type: "Coastal Luxury", price: "From $1,650/pp", nights: 8, gradient: "from-amber-400 to-orange-500", rating: 4.9, reviews: 4102 },
  { name: "Bali, Indonesia", type: "Tropical Retreat", price: "From $890/pp", nights: 12, gradient: "from-green-400 to-emerald-500", rating: 4.7, reviews: 5234 },
  { name: "Reykjavik, Iceland", type: "Arctic Wonder", price: "From $1,420/pp", nights: 6, gradient: "from-violet-400 to-indigo-500", rating: 4.6, reviews: 987 },
];

const HOTELS = [
  { name: "The Cliffside Resort", location: "Santorini, Greece", stars: 5, price: "$480/night", badge: "Traveler's Choice", img: "from-blue-200 to-cyan-300" },
  { name: "Arashiyama Zen Lodge", location: "Kyoto, Japan", stars: 5, price: "$340/night", badge: "Eco Certified", img: "from-rose-200 to-pink-300" },
  { name: "Patagonia Wild Camp", location: "El Calafate, Argentina", stars: 4, price: "$290/night", badge: "Adventure Pick", img: "from-green-200 to-teal-300" },
];

export default function TravelEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "Wanderlust", device);
  const pubName = content.publisherName || "Wanderlust";

  return (
    <article className="min-h-[1400px] bg-white text-slate-900 font-sans">
      {/* Promo bar */}
      <div className="bg-cyan-600 text-white text-[11px] font-semibold text-center py-1.5">
        ✈️ Limited time: Up to 30% off flights & hotels when you book by May 31 · <a href="#" className="underline">Explore deals →</a>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black text-cyan-600">{pubName}</div>
          {!isMobile && (
            <nav className="flex items-center gap-5 text-[12px] font-semibold text-slate-500">
              {["Destinations", "Hotels", "Flights", "Packages", "Experiences", "Travel Guide"].map((n) => (
                <a key={n} href="#" className="hover:text-cyan-600 transition">{n}</a>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-3">
            <button className="text-xs font-bold text-slate-600 hover:text-slate-900 transition">Sign In</button>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition">List Your Property</button>
          </div>
        </div>
      </header>

      {/* Hero search */}
      <section className="bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Where to next?</h1>
          <p className="text-cyan-100 mb-7 text-lg">Discover destinations, hotels, and experiences for every kind of traveler.</p>
          <div className={`bg-white rounded-2xl shadow-xl p-4 ${isMobile ? "space-y-3" : "grid grid-cols-4 gap-3"} max-w-3xl mx-auto`}>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Where</p>
              <input type="text" placeholder="City, country, resort..." className="w-full text-sm text-slate-800 border-0 focus:outline-none bg-transparent" defaultValue="Santorini, Greece" />
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Check-in</p>
              <p className="text-sm text-slate-800">Jun 14, 2026</p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Check-out</p>
              <p className="text-sm text-slate-800">Jun 21, 2026</p>
            </div>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-5 py-3 rounded-xl transition">Search</button>
          </div>
        </div>
      </section>

      {/* Banner ad */}
      <section className="bg-slate-50 border-b border-slate-100 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[9px] uppercase tracking-widest text-slate-400 text-center mb-2">Sponsored Travel Partner</p>
          <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Leaderboard */}
      <section className="bg-slate-100 border-b border-slate-200 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="cover" className="mx-auto" />
        </div>
      </section>

      {/* Main content */}
      <main className={`mx-auto max-w-6xl px-4 py-7 md:px-8 ${isMobile ? "space-y-7" : "grid grid-cols-[1fr_280px] gap-7"}`}>
        <div className="space-y-8">
          {/* Destination cards */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-900">Trending Destinations</h2>
              <a href="#" className="text-sm text-cyan-600 font-semibold hover:text-cyan-500 transition">View all →</a>
            </div>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
              {DESTINATIONS.slice(0, 3).map((d) => (
                <div key={d.name} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group">
                  <div className={`h-40 bg-gradient-to-br ${d.gradient} relative`}>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-700">★ {d.rating}</div>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{d.type} · {d.nights} nights</p>
                    <p className="text-sm font-black text-slate-900">{d.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{d.reviews.toLocaleString()} reviews</p>
                    <p className="text-base font-black text-cyan-600 mt-2">{d.price}</p>
                    <button className="mt-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded-lg transition">View Package</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inline ad */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 text-center">Sponsored</p>
            <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
            {DESTINATIONS.slice(3).map((d) => (
              <div key={d.name} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer">
                <div className={`h-40 bg-gradient-to-br ${d.gradient} relative`}>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-700">★ {d.rating}</div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{d.type} · {d.nights} nights</p>
                  <p className="text-sm font-black text-slate-900">{d.name}</p>
                  <p className="text-base font-black text-cyan-600 mt-2">{d.price}</p>
                  <button className="mt-2 w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded-lg transition">View Package</button>
                </div>
              </div>
            ))}
          </div>

          {/* Featured hotels */}
          <section>
            <h2 className="text-xl font-black text-slate-900 mb-5">Editor's Hotel Picks</h2>
            <div className="space-y-4">
              {HOTELS.map((h) => (
                <div key={h.name} className="flex gap-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer">
                  <div className={`w-28 shrink-0 bg-gradient-to-br ${h.img} md:w-40`} />
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">{h.location}</p>
                        <p className="text-base font-black text-slate-900">{h.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: h.stars }).map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-cyan-600">{h.price}</p>
                        <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{h.badge}</span>
                      </div>
                    </div>
                    <button className="mt-3 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition">Check Availability</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Native feed ad */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl overflow-hidden grid md:grid-cols-2">
            <div className="p-5">
              <p className="text-[9px] uppercase tracking-widest text-cyan-600 font-semibold">Sponsored</p>
              <h3 className="text-xl font-black text-slate-900 mt-2 mb-2">Travel Insurance from $4.99/day</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Medical coverage, trip cancellation, and lost luggage. Book in minutes.</p>
              <button className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">Get a Quote</button>
            </div>
            <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="cover" className="mx-auto" />
          </div>
        </div>

        {/* Sidebar */}
        {!isMobile && (
          <aside className="space-y-5 self-start sticky top-[72px]">
            <div className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl p-5 text-white">
              <h4 className="font-black text-base mb-2">Plan your trip</h4>
              <p className="text-xs text-cyan-100 mb-3">Talk to a destination expert. Free 15-min consultation.</p>
              <button className="w-full bg-white text-cyan-700 text-xs font-black py-2.5 rounded-xl hover:bg-cyan-50 transition">Book Consultation</button>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Visa Requirements</h4>
              {[["Greece", "EU passport — No visa"], ["Japan", "Most passports — Visa free 90 days"], ["Argentina", "No visa required 90 days"]].map(([country, req]) => (
                <div key={country} className="py-1.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{country}</p>
                  <p className="text-[11px] text-slate-500">{req}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Currency Rates</h4>
              {[["EUR", "1.09 USD"], ["JPY", "0.0065 USD"], ["ARS", "0.0011 USD"]].map(([cur, rate]) => (
                <div key={cur} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800">{cur}</span>
                  <span className="text-xs text-slate-500">{rate}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 px-4 py-8 md:px-8 mt-4 font-sans">
        <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-6 text-sm">
          <div><p className="font-black text-white text-lg mb-2">{pubName}</p><p className="text-xs leading-relaxed">Inspiring journeys since 2008. Your trusted travel partner worldwide.</p></div>
          {[["Explore", "Destinations", "Hotels", "Flights", "Packages"], ["Support", "Help Center", "Cancellations", "Travel Alerts", "Insurance"], ["Company", "About", "Press", "Careers", "Affiliates"]].map((col) => (
            <div key={col[0]}><p className="font-bold text-white text-xs uppercase tracking-wider mb-2">{col[0]}</p>{col.slice(1).map((l) => <a key={l} href="#" className="block text-xs py-0.5 hover:text-white transition">{l}</a>)}</div>
          ))}
        </div>
        <div className="border-t border-slate-700 mt-6 pt-4 text-center text-xs text-slate-600">© 2026 {pubName}. All rights reserved.</div>
      </footer>
    </article>
  );
}