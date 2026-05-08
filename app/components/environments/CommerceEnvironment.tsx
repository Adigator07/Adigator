"use client";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

const PRODUCTS = [
  { name: "Premium Collection Set", price: "$149.99", rating: 4.8, reviews: 2341, badge: "Best Seller" },
  { name: "Limited Edition Bundle", price: "$89.99", rating: 4.6, reviews: 1180, badge: "New" },
  { name: "Professional Series", price: "$219.00", rating: 4.9, reviews: 3102, badge: "Top Rated" },
  { name: "Essential Starter Pack", price: "$59.99", rating: 4.4, reviews: 876, badge: null },
  { name: "Deluxe Upgrade Kit", price: "$189.99", rating: 4.7, reviews: 1654, badge: "Sale" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

function AdUnit({ creativeUrl, creativeSize }: { creativeUrl: string; creativeSize: string }) {
  const [w, h] = creativeSize.split("x").map(Number);
  const maxW = Math.min(w || 300, 700);
  const scale = maxW / (w || 300);
  const dispH = Math.round((h || 250) * scale);
  return (
    <div className="relative flex flex-col items-center my-3">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Sponsored</span>
        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div className="border border-gray-200 overflow-hidden shadow-sm" style={{ width: maxW, height: dispH }}>
        <img src={creativeUrl} alt="Ad" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    </div>
  );
}

export default function CommerceEnvironment({ content, slotType, creativeUrl, creativeSize, device }: Props) {
  const publisher = content.publisherName ?? "ShopSphere";
  const pageTitle = content.pageTitle ?? "Shop All Products";
  const label = content.contextBlocks.find((b) => b.type === "label")?.text ?? "Electronics";
  const isMobile = device === "mobile";

  return (
    <div className="bg-white min-h-screen border border-gray-200 rounded-xl overflow-hidden shadow-xl font-sans">
      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xl font-black text-orange-600 tracking-tight">{publisher}</div>
          {!isMobile && (
            <div className="flex-1 max-w-lg">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400 gap-2">
                <span>🔍</span>
                <span>Search for products, brands...</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 text-gray-600 text-sm font-medium">
            {!isMobile && (
              <>
                <span className="cursor-pointer hover:text-orange-600">Orders</span>
                <span className="cursor-pointer hover:text-orange-600">Account</span>
              </>
            )}
            <div className="relative">
              <span className="text-xl cursor-pointer">🛒</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">3</span>
            </div>
          </div>
        </div>
      </header>

      {/* Category strip */}
      {!isMobile && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs font-semibold text-gray-600 uppercase tracking-wide overflow-x-auto">
            {["All Departments", "Electronics", "Fashion", "Home & Garden", "Sports", "Automotive", "Beauty"].map((c) => (
              <span key={c} className={c === label || c === "All Departments" ? "text-orange-600 cursor-pointer whitespace-nowrap" : "cursor-pointer hover:text-orange-600 whitespace-nowrap"}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard banner */}
      {slotType === "leaderboard" && (
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex justify-center">
          <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 py-6 ${isMobile ? "" : "flex gap-6"}`}>
        {/* Filters sidebar */}
        {!isMobile && (
          <aside className="w-52 shrink-0 space-y-5">
            {slotType === "sidebar" && (
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            )}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2">Department</p>
              {[label, "Accessories", "Bundles", "Refurbished"].map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm text-gray-600 py-1 cursor-pointer hover:text-orange-600">
                  <input type="checkbox" className="accent-orange-500" defaultChecked={d === label} readOnly />
                  {d}
                </label>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2">Price Range</p>
              <div className="space-y-1">
                {["Under $50", "$50–$100", "$100–$200", "Over $200"].map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm text-gray-600 py-0.5 cursor-pointer">
                    <input type="radio" name="price" className="accent-orange-500" readOnly />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 mb-2">Customer Rating</p>
              {[4, 3, 2].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-gray-600 py-0.5 cursor-pointer">
                  <input type="checkbox" className="accent-orange-500" readOnly />
                  <span className="text-yellow-400">{"★".repeat(r)}{"☆".repeat(5-r)}</span>
                  <span>& up</span>
                </label>
              ))}
            </div>
          </aside>
        )}

        {/* Product grid */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-sm text-gray-500">1–24 of 487 results in <span className="text-orange-600 font-medium">{label}</span></p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Sort by:</span>
              <select className="border border-gray-200 rounded px-2 py-1 text-sm bg-white">
                <option>Best Sellers</option>
                <option>Price: Low to High</option>
                <option>Avg. Customer Rating</option>
              </select>
            </div>
          </div>

          <div className={`grid gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-3 lg:grid-cols-4"}`}>
            {PRODUCTS.map((prod, i) => (
              <>
                {/* Inject sponsored product tile after index 1 */}
                {i === 2 && slotType === "product-tile" && (
                  <div key="ad-tile" className="border-2 border-orange-200 rounded-xl overflow-hidden bg-orange-50 flex flex-col">
                    <div className="relative">
                      <img src={creativeUrl} alt="Sponsored" className="w-full object-cover" style={{ height: 160 }} />
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Sponsored
                      </span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">Featured Product Placement</p>
                      <p className="text-xs text-gray-400 mt-1">Ad · {creativeSize}</p>
                    </div>
                  </div>
                )}
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition cursor-pointer group">
                  <div className="relative">
                    <div className="w-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center" style={{ height: 160 }}>
                      <span className="text-4xl opacity-30">📦</span>
                    </div>
                    {prod.badge && (
                      <span className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${prod.badge === "Sale" ? "bg-red-500" : prod.badge === "New" ? "bg-green-500" : "bg-blue-500"}`}>
                        {prod.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-orange-600 transition line-clamp-2">{prod.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Stars rating={prod.rating} />
                      <span className="text-xs text-blue-600 font-medium">{prod.reviews.toLocaleString()}</span>
                    </div>
                    <p className="text-lg font-black text-gray-900 mt-1">{prod.price}</p>
                    <button className="mt-2 w-full py-1.5 bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </>
            ))}
          </div>

          {/* Inline ad below grid */}
          {slotType === "inline" && (
            <div className="mt-6">
              <AdUnit creativeUrl={creativeUrl} creativeSize={creativeSize} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
