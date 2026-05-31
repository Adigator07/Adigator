/** Realistic placeholder display ads for unfilled slots in Google preview environments. */

const DUMMY_ADS = [
  {
    headline: "Save 30% This Week",
    subline: "Limited-time offer",
    cta: "Shop Now",
    brand: "StyleCo",
    bg: "linear-gradient(135deg, #1a73e8 0%, #174ea6 100%)",
    text: "#ffffff",
  },
  {
    headline: "Free Shipping Today",
    subline: "On orders over $50",
    cta: "Browse Deals",
    brand: "MarketHub",
    bg: "linear-gradient(135deg, #34a853 0%, #188038 100%)",
    text: "#ffffff",
  },
  {
    headline: "New Collection",
    subline: "Spring styles are here",
    cta: "Explore",
    brand: "UrbanWear",
    bg: "linear-gradient(135deg, #9333ea 0%, #6b21a8 100%)",
    text: "#ffffff",
  },
  {
    headline: "Book Your Getaway",
    subline: "Flights from $99",
    cta: "Search Trips",
    brand: "SkyRoute",
    bg: "linear-gradient(135deg, #ea4335 0%, #c5221f 100%)",
    text: "#ffffff",
  },
  {
    headline: "Smart Home Deals",
    subline: "Upgrade your setup",
    cta: "View Offers",
    brand: "TechNest",
    bg: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
    text: "#ffffff",
  },
];

function pickDummyAd(width, height, index = 0) {
  const ratio = width / height;
  const pool = DUMMY_ADS;
  const ad = pool[(width + height + index) % pool.length];
  return { ...ad, ratio };
}

export function DummyDisplayAd({ width, height, index = 0, className = "" }) {
  const ad = pickDummyAd(width, height, index);
  const isLeaderboard = width / height > 4;
  const isSkyscraper = height / width > 2.5;

  return (
    <div
      className={`relative overflow-hidden border border-[#dadce0] shadow-sm ${className}`}
      style={{ width, height, maxWidth: "100%", background: ad.bg, color: ad.text }}
    >
      <div className={`flex h-full w-full ${isSkyscraper ? "flex-col justify-between" : "items-center"} ${isLeaderboard ? "px-4" : "p-2.5"}`}>
        <div className={isLeaderboard ? "flex items-center gap-3 min-w-0 flex-1" : isSkyscraper ? "space-y-2" : "min-w-0 flex-1"}>
          {!isLeaderboard ? (
            <p className="text-[9px] uppercase tracking-wide opacity-80">{ad.brand}</p>
          ) : null}
          <p className={`font-semibold leading-tight ${isLeaderboard ? "text-sm truncate" : isSkyscraper ? "text-xs" : "text-[11px] line-clamp-2"}`}>
            {ad.headline}
          </p>
          {!isLeaderboard && !isSkyscraper ? (
            <p className="text-[9px] opacity-85 mt-0.5 line-clamp-1">{ad.subline}</p>
          ) : null}
        </div>
        <span className={`inline-flex shrink-0 rounded bg-white/20 px-2 py-0.5 font-semibold ${isLeaderboard ? "text-[10px]" : "text-[9px]"}`}>
          {ad.cta}
        </span>
      </div>
      <span className="absolute top-1 right-1 rounded bg-black/20 px-1 text-[8px] opacity-80">Ad</span>
    </div>
  );
}
