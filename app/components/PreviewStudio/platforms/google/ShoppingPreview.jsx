"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { UserImage } from "../../shared/previewUi";
import { dummyShoppingProducts, dummyShoppingQuery } from "../../dummy/googleDummy";

function GoogleLogo() {
  return (
    <span className="text-xl font-bold">
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
    </span>
  );
}

function ProductCard({ product, isUser, headline, imageUrl, brandName }) {
  return (
    <div className={`rounded-lg border p-3 ${isUser ? "border-[#1a73e8] bg-blue-50/30" : "border-gray-200 bg-white"}`}>
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
        {isUser ? (
          <UserImage imageUrl={imageUrl} className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </div>
      {isUser ? (
        <>
          <p className="text-sm font-medium line-clamp-2">{headline}</p>
          <p className="text-sm font-bold mt-1">₹2,499</p>
          <p className="text-xs text-gray-600">{brandName}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold text-gray-500 uppercase">Sponsored</span>
        </>
      ) : (
        <>
          <p className="text-sm line-clamp-2">{product.name}</p>
          <p className="text-sm font-bold mt-1">{product.price}</p>
          <p className="text-xs text-gray-600">{product.store}</p>
          <p className="text-xs text-amber-600">★ {product.rating}</p>
        </>
      )}
    </div>
  );
}

export default function ShoppingPreview({ headline, imageUrl, brandName }) {
  const row1 = [
    dummyShoppingProducts[0],
    dummyShoppingProducts[1],
    null,
    dummyShoppingProducts[2],
  ];
  const row2 = dummyShoppingProducts.slice(3, 7);

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="bg-white text-gray-900 p-8">
        <div className="flex items-center gap-6 mb-4">
          <GoogleLogo />
          <div className="flex-1 rounded-full border border-gray-300 px-5 py-2 text-sm">{dummyShoppingQuery}</div>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {["All", "New", "Under ₹5,000", "4★ & above"].map((chip, i) => (
            <span key={chip} className={`rounded-full px-4 py-1.5 text-sm border ${i === 0 ? "bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]" : "border-gray-300 text-gray-700"}`}>{chip}</span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {row1.map((product, i) => (
            <ProductCard
              key={i}
              product={product}
              isUser={product === null}
              headline={headline}
              imageUrl={imageUrl}
              brandName={brandName}
            />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {row2.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}
