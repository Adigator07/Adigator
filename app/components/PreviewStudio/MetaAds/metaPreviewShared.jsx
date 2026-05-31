"use client";

export function MetaImageBlock({ creative, className = "", ratioClass = "" }) {
  const src = creative.imageUrl;
  return (
    <div className={`overflow-hidden bg-slate-200 ${ratioClass} ${className}`}>
      {src ? (
        <img src={src} alt={creative.headline} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-slate-600 text-xs">
          Image Placeholder
        </div>
      )}
    </div>
  );
}

export function MetaAvatar({ label = "B" }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700">
        {label.slice(0, 1).toUpperCase()}
      </div>
    </div>
  );
}
