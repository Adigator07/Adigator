"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const PRODUCTS = [
  { name: "Pro Wireless Headphones", price: "$249", original: "$329", rating: 4.8, reviews: 2341, badge: "Best Seller", color: "from-slate-200 to-slate-300" },
  { name: "Ultralight Running Shoes", price: "$129", original: "$179", rating: 4.6, reviews: 897, badge: "New", color: "from-orange-100 to-orange-200" },
  { name: "Ceramic Pour-Over Coffee Set", price: "$89", original: null, rating: 4.9, reviews: 514, badge: "Editor's Pick", color: "from-amber-100 to-amber-200" },
  { name: "Smart Home Hub v3", price: "$199", original: "$249", rating: 4.5, reviews: 1128, badge: "20% Off", color: "from-blue-100 to-blue-200" },
  { name: "Merino Wool Travel Blanket", price: "$74", original: "$99", rating: 4.7, reviews: 342, badge: "Sale", color: "from-green-100 to-green-200" },
  { name: "Portable SSD 2TB", price: "$159", original: null, rating: 4.8, reviews: 1876, badge: "Top Rated", color: "from-purple-100 to-purple-200" },
];

const CATEGORIES = ["Electronics", "Fashion", "Home & Garden", "Sports", "Beauty", "Books", "Toys", "Automotive"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-xs ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}`}>★</span>
      ))}
    </div>
  );
}

export default function CommerceEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "ShopNow", device);

  const storeName = content.publisherName || "ShopNow";

  return (
    <article className="min-h-[1400px] bg-slate-50 text-slate-900 font-sans">
      {/* Top deals bar */}
      <div className="bg-orange-500 text-white text-[11px] font-semibold text-center py-1.5 tracking-wide">
        🛍 Free shipping on orders over $49 · Use code SAVE20 for 20% off · Limited time
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8">
          <div className={`flex items-center gap-4 ${isMobile ? "flex-col" : ""}`}>
            <div className="text-2xl font-black text-orange-500 shrink-0">{storeName}</div>
            {!isMobile && (
              <div className="flex-1 relative">
                <input type="text" placeholder='Search millions of products...' className="w-full border-2 border-orange-400 rounded-full px-5 py-2 text-sm focus:outline-none pr-12 bg-slate-50" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">Search</button>
              </div>
            )}
            <div className="flex items-center gap-4 text-slate-600 text-sm">
              <div className="flex flex-col items-center text-xs"><span className="text-base">👤</span><span>Account</span></div>
              <div className="flex flex-col items-center text-xs"><span className="text-base">❤️</span><span>Wishlist</span></div>
              <div className="relative flex flex-col items-center text-xs"><span className="text-base">🛒</span><span>Cart</span><span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">3</span></div>
            </div>
          </div>
        </div>
        {/* Category nav */}
        <div className="border-t border-slate-100 bg-slate-900">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <ul className="flex gap-1 overflow-x-auto text-[11px] font-semibold text-slate-300 py-2">
              {CATEGORIES.map((c) => (
                <li key={c}><a href="#" className="px-3 py-1 rounded hover:bg-white/10 whitespace-nowrap transition">{c}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Hero banner ad */}
      <section className="bg-white border-b border-slate-100 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[9px] uppercase tracking-widest text-slate-400 text-center mb-2">Sponsored</p>
          <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Leaderboard / Sale banner */}
      <section className="bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Main content */}
      <div className={`mx-auto max-w-6xl px-4 py-6 md:px-8 ${isMobile ? "" : "grid grid-cols-[220px_1fr] gap-6"}`}>

        {/* Filters sidebar */}
        {!isMobile && (
          <aside className="space-y-5 self-start sticky top-[88px]">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3">Filter Results</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Price Range</p>
                  {["Under $25", "$25–$50", "$50–$100", "$100–$250", "$250+"].map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm text-slate-600 py-0.5 cursor-pointer hover:text-slate-900">
                      <input type="checkbox" className="rounded" /> {p}
                    </label>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Rating</p>
                  {["4★ & up", "3★ & up", "2★ & up"].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-slate-600 py-0.5 cursor-pointer hover:text-slate-900">
                      <input type="checkbox" className="rounded" /> {r}
                    </label>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Availability</p>
                  <label className="flex items-center gap-2 text-sm text-slate-600 py-0.5 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked /> In Stock Only
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 py-0.5 cursor-pointer">
                    <input type="checkbox" className="rounded" /> Prime Eligible
                  </label>
                </div>
              </div>
            </div>
            {/* Sidebar ad */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
          </aside>
        )}

        {/* Product grid */}
        <main>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600"><strong>1–{PRODUCTS.length}</strong> of 2,841 results</p>
            <select className="border border-slate-200 rounded-lg text-sm px-3 py-1.5 bg-white text-slate-700 focus:outline-none">
              <option>Sort: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Avg. Customer Review</option>
              <option>Newest Arrivals</option>
            </select>
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
            {PRODUCTS.slice(0, 3).map((p) => (
              <div key={p.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer">
                <div className={`relative h-44 bg-gradient-to-br ${p.color}`}>
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{p.badge}</span>
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{p.name}</h4>
                  <StarRating rating={p.rating} />
                  <p className="text-[11px] text-slate-500 mb-2">{p.reviews.toLocaleString()} reviews</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">{p.price}</span>
                    {p.original && <span className="text-xs text-slate-400 line-through">{p.original}</span>}
                  </div>
                  <button className="mt-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2 rounded-lg transition">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline ad */}
          <div className="my-5">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2 text-center">Sponsored results</p>
            <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
            {PRODUCTS.slice(3).map((p) => (
              <div key={p.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer">
                <div className={`relative h-44 bg-gradient-to-br ${p.color}`}>
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">{p.badge}</span>
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{p.name}</h4>
                  <StarRating rating={p.rating} />
                  <p className="text-[11px] text-slate-500 mb-2">{p.reviews.toLocaleString()} reviews</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-900">{p.price}</span>
                    {p.original && <span className="text-xs text-slate-400 line-through">{p.original}</span>}
                  </div>
                  <button className="mt-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2 rounded-lg transition">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>

          {/* Native feed ad */}
          <div className="mt-6 grid md:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-4">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-2">Sponsored collection</p>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Curated for you</h3>
              <p className="text-sm text-slate-600">Based on your browsing history and top-rated picks this week.</p>
              <button className="mt-4 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-700 transition">View Collection</button>
            </div>
            <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
          </div>
        </main>
      </div>

      <footer className="bg-slate-900 text-slate-400 px-4 py-8 md:px-8 mt-6">
        <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-6 text-sm">
          <div><p className="font-black text-white text-lg mb-2">{storeName}</p><p className="text-xs leading-relaxed">Your one-stop shop for everything you need, delivered to your door.</p></div>
          {[["Help", "Returns", "Shipping Info", "Order Tracking", "Contact Support"], ["Company", "About Us", "Careers", "Press", "Investor Relations"], ["Programs", "Gift Cards", "Affiliate Program", "Sell on {storeName}", "Sustainability"]].map((col) => (
            <div key={col[0]}><p className="font-bold text-white text-xs uppercase tracking-wider mb-2">{col[0]}</p>{col.slice(1).map((l) => <a key={l} href="#" className="block text-xs py-0.5 hover:text-white transition">{l}</a>)}</div>
          ))}
        </div>
        <div className="border-t border-slate-700 mt-6 pt-4 text-center text-xs text-slate-600">© 2026 {storeName}. All rights reserved.</div>
      </footer>
    </article>
  );
}