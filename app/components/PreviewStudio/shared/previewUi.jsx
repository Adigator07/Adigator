"use client";

export function UserImage({ imageUrl, alt = "Ad creative", className = "", fit = "cover" }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        crossOrigin="anonymous"
        className={`block ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 text-xs ${className}`}
    >
      Your Creative
    </div>
  );
}

export function BrandAvatar({ logoUrl, brandName, className = "", size = 32 }) {
  const initial = (brandName || "B").charAt(0).toUpperCase();
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={brandName}
        crossOrigin="anonymous"
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-blue-600 text-white flex items-center justify-center font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

export function SponsoredBadge({ label = "Sponsored", className = "" }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide text-gray-500 ${className}`}>
      {label}
    </span>
  );
}

export function AdBadge({ className = "" }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 ${className}`}
    >
      Ad
    </span>
  );
}

export function DummyImagePlaceholder({ width, height, color = "#cbd5e1", label = "", className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <rect width={width} height={height} fill={color} />
      <rect x={width * 0.1} y={height * 0.1} width={width * 0.8} height={height * 0.8} fill={color} opacity="0.7" rx="4" />
      {label ? (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="12">
          {label}
        </text>
      ) : null}
    </svg>
  );
}

export function DummyBannerAd({ ad, width = 300, height = 250, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden border border-gray-200 ${className}`}
      style={{ width, height, background: ad?.bg || "linear-gradient(135deg,#64748b,#475569)" }}
    >
      <div className="flex h-full flex-col justify-between p-3 text-white">
        <div>
          <p className="text-[9px] uppercase opacity-80">{ad?.brand || "Brand"}</p>
          <p className="text-sm font-semibold leading-tight mt-1">{ad?.headline}</p>
          {ad?.subline ? <p className="text-[10px] opacity-85 mt-0.5">{ad.subline}</p> : null}
        </div>
        <span className="inline-flex self-start rounded bg-white/25 px-2 py-0.5 text-[10px] font-semibold">
          {ad?.cta || "Shop Now"}
        </span>
      </div>
      <span className="absolute top-1 right-1 rounded bg-black/25 px-1 text-[8px] text-white">Ad</span>
    </div>
  );
}
