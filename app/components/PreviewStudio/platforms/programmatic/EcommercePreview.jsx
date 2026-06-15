"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, UserImage } from "../../shared/previewUi";
import { ecommerceDummyAds, ecommerceProducts } from "../../dummy/programmaticDummy";

export default function EcommercePreview({ headline, description, cta, imageUrl, brandName }) {
  const products = ecommerceProducts;
  const gridItems = [
    products[0], products[1], { sponsored: true }, products[2],
    products[3], products[4], products[5], products[6],
  ];

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600">ShopZone</h1>
          <div className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500">Search headphones...</div>
          <span>🛒 Cart (2)</span>
        </header>
        <p className="px-8 py-3 text-sm text-gray-600">Electronics › Headphones</p>
        <div className="flex px-8 gap-8">
          <aside className="w-48 shrink-0 text-sm space-y-2">
            <p className="font-bold">Filters</p>
            {["Brand", "Price", "Rating", "Features"].map((f) => (
              <p key={f} className="text-gray-600">{f}</p>
            ))}
            <div className="mt-4">
              <DummyBannerAd ad={ecommerceDummyAds[1]} width={160} height={600} className="!w-[160px] !h-[600px]" />
            </div>
          </aside>
          <div className="flex-1 grid grid-cols-4 gap-4 pb-8">
            {gridItems.map((item, i) => (
              <div key={i} className={`bg-white rounded-lg border p-3 ${item.sponsored ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}>
                <div className="aspect-square rounded bg-gray-100 mb-2 overflow-hidden">
                  {item.sponsored ? (
                    <UserImage imageUrl={imageUrl} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                </div>
                {item.sponsored ? (
                  <>
                    <p className="text-sm font-medium line-clamp-2">{headline}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>
                    <span className="text-[10px] font-semibold text-blue-600 uppercase">Sponsored</span>
                    <button type="button" className="mt-1 w-full rounded bg-blue-600 py-1 text-xs text-white font-semibold">{cta}</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm line-clamp-2">{item.name}</p>
                    <p className="font-bold text-sm mt-1">{item.price}</p>
                    <p className="text-xs text-gray-500">{item.store}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <footer className="border-t border-gray-200 px-8 py-4 text-xs text-gray-500 flex gap-4">
          {["Electronics", "Fashion", "Home", "Sports"].map((c) => <span key={c}>{c}</span>)}
        </footer>
      </div>
    </PreviewFrame>
  );
}
