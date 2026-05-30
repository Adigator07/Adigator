"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import {
  getCreativeBlob,
  previewKey,
  revokeObjectUrl,
} from "@/app/lib/creativeAssetStore";

/**
 * Resolves analyzer creative thumbnails from live blob URLs or IndexedDB assets.
 */
export default function AnalyzerCreativeThumbnail({
  creativeId,
  src,
  alt = "Creative preview",
  className = "w-full h-full object-cover",
  containerClassName = "relative flex-shrink-0 w-14 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100",
  badge,
}) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function resolvePreview() {
      setFailed(false);

      if (creativeId) {
        const previewBlob = await getCreativeBlob(previewKey(creativeId));
        const fullBlob = previewBlob || await getCreativeBlob(creativeId);
        if (fullBlob && !cancelled) {
          objectUrl = URL.createObjectURL(fullBlob);
          setResolvedSrc(objectUrl);
          return;
        }
      }

      if (src && !cancelled) {
        setResolvedSrc(src);
        return;
      }

      if (!cancelled) {
        setResolvedSrc(null);
        setFailed(true);
      }
    }

    resolvePreview();

    return () => {
      cancelled = true;
      if (objectUrl) revokeObjectUrl(objectUrl);
    };
  }, [creativeId, src]);

  const handleError = () => {
    setFailed(true);
    setResolvedSrc(null);
  };

  return (
    <div className={containerClassName}>
      {resolvedSrc && !failed ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className={className}
          onError={handleError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
          <ImageIcon size={16} aria-hidden />
        </div>
      )}
      {badge ? (
        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center text-white py-0.5">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
