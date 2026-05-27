"use client";

export function GoogleImageBlock({ creative, className = "" }) {
  const src = creative.imageUrl;
  return (
    <div className={`overflow-hidden bg-slate-100 ${className}`}>
      {src ? (
        <img src={src} alt={creative.headline} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 text-xs">
          Image Placeholder
        </div>
      )}
    </div>
  );
}
