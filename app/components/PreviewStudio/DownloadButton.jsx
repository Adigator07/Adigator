"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { captureDomToCanvas } from "@/app/lib/domCapture";

export default function DownloadButton({ previewRef, platform, placement, brandName, onDownloadComplete }) {
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    const el = previewRef?.current;
    if (!el || exporting) return;

    setExporting(true);
    const prevOverflow = el.style.overflow;
    const prevHeight = el.style.height;
    const prevMaxHeight = el.style.maxHeight;

    try {
      el.style.overflow = "visible";
      el.style.height = "auto";
      el.style.maxHeight = "none";

      const canvas = await captureDomToCanvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const safeBrand = String(brandName || "Brand")
        .replace(/[^a-zA-Z0-9]+/g, "")
        .slice(0, 24);
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const filename = `${platform}_${placement}_${safeBrand}_${date}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onDownloadComplete?.({ filename, status: "Completed" });
    } catch (err) {
      console.error("Preview export failed:", err);
      onDownloadComplete?.({ filename: "", status: "Failed" });
    } finally {
      el.style.overflow = prevOverflow;
      el.style.height = prevHeight;
      el.style.maxHeight = prevMaxHeight;
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={exporting || !previewRef?.current}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
    >
      <Download size={16} />
      {exporting ? "Exporting…" : "Download PNG"}
    </button>
  );
}
