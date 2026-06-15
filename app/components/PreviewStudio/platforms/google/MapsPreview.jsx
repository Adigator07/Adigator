"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { AdBadge, BrandAvatar, UserImage } from "../../shared/previewUi";
import { dummyMapsBusinesses } from "../../dummy/googleDummy";

function MapBackground() {
  return (
    <div className="absolute inset-0 bg-[#e8eaed]">
      <svg className="w-full h-full" aria-hidden>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect x="120" y="80" width="80" height="60" fill="#c4c7c5" rx="2" />
        <rect x="280" y="140" width="100" height="70" fill="#bdc1bf" rx="2" />
        <rect x="450" y="60" width="90" height="80" fill="#c4c7c5" rx="2" />
        <rect x="200" y="220" width="120" height="90" fill="#bdc1bf" rx="2" />
        <text x="150" y="200" fill="#5f6368" fontSize="11">Main St</text>
        <text x="350" y="120" fill="#5f6368" fontSize="11">Oak Ave</text>
        <text x="480" y="280" fill="#5f6368" fontSize="11">Park Rd</text>
      </svg>
      <div className="absolute top-[45%] left-[55%] -translate-x-1/2 -translate-y-full">
        <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">📍</div>
      </div>
    </div>
  );
}

export default function MapsPreview({ headline, description, cta, imageUrl, logoUrl, brandName }) {
  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="relative h-[640px] flex">
        <aside className="w-[400px] shrink-0 bg-white border-r border-gray-200 z-10 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600">coffee near me</div>
          </div>
          <div className="p-4 border-b border-gray-200 bg-[#f8f9fa]">
            <div className="flex gap-3">
              {logoUrl || imageUrl ? (
                <BrandAvatar logoUrl={logoUrl || imageUrl} brandName={brandName} size={48} />
              ) : (
                <BrandAvatar brandName={brandName} size={48} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{brandName}</h3>
                  <AdBadge />
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{headline}</p>
                <p className="text-xs text-amber-600 mt-1">★★★★½ 4.5 (2,340 reviews)</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>
                <p className="text-xs text-green-700 mt-1">Open · Closes 10 PM</p>
                <button type="button" className="mt-2 rounded-lg bg-[#1a73e8] px-4 py-1.5 text-xs font-semibold text-white">{cta || "Get Directions"}</button>
              </div>
            </div>
          </div>
          {dummyMapsBusinesses.map((b) => (
            <div key={b.name} className="p-4 border-b border-gray-100">
              <h4 className="font-medium text-sm">{b.name}</h4>
              <p className="text-xs text-amber-600">★ {b.rating} ({b.reviews}) · {b.category}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>
            </div>
          ))}
        </aside>
        <div className="flex-1 relative">
          <MapBackground />
        </div>
      </div>
    </PreviewFrame>
  );
}
