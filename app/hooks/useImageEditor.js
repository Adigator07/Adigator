"use client";

import { useState, useCallback, useRef } from "react";

const ALLOWED_SIZES = [
  { label: "300x250", w: 300, h: 250 },
  { label: "728x90", w: 728, h: 90 },
  { label: "160x600", w: 160, h: 600 },
  { label: "300x600", w: 300, h: 600 },
  { label: "320x50", w: 320, h: 50 },
  { label: "970x250", w: 970, h: 250 },
  { label: "300x1050", w: 300, h: 1050 },
];

/**
 * Load an Image element from a data URL or blob URL.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Resize image to exact target dimensions (stretches to fit).
 */
async function resizeImage(sourceUrl, targetW, targetH) {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/png");
}

/**
 * Crop an image from a source rect then scale to target dimensions.
 * cropRect = { x, y, w, h } in source-image pixel coordinates.
 */
async function cropImage(sourceUrl, cropRect, targetW, targetH) {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.w,
    cropRect.h,
    0,
    0,
    targetW,
    targetH
  );
  return canvas.toDataURL("image/png");
}

/**
 * Smart center-crop: find the largest centered region matching the target
 * aspect ratio, then scale to target size.
 */
async function autoFitImage(sourceUrl, targetW, targetH) {
  const img = await loadImage(sourceUrl);
  const srcW = img.width;
  const srcH = img.height;
  const targetAspect = targetW / targetH;
  const srcAspect = srcW / srcH;

  let cropX, cropY, cropW, cropH;

  if (srcAspect > targetAspect) {
    // source is wider — crop sides
    cropH = srcH;
    cropW = srcH * targetAspect;
    cropX = (srcW - cropW) / 2;
    cropY = 0;
  } else {
    // source is taller — crop top/bottom
    cropW = srcW;
    cropH = srcW / targetAspect;
    cropX = 0;
    cropY = (srcH - cropH) / 2;
  }

  return cropImage(sourceUrl, { x: cropX, y: cropY, w: cropW, h: cropH }, targetW, targetH);
}

/**
 * Suggest the best matching allowed size based on aspect ratio similarity.
 * Returns sorted array of { label, w, h, score } where score is 0–100 (100 = perfect match).
 */
function suggestBestSizes(originalW, originalH) {
  const srcAspect = originalW / originalH;

  return ALLOWED_SIZES.map((size) => {
    const targetAspect = size.w / size.h;
    // Score: inverse of aspect ratio difference, normalized to 0-100
    const diff = Math.abs(srcAspect - targetAspect);
    const score = Math.max(0, Math.round((1 - diff / Math.max(srcAspect, targetAspect)) * 100));
    return { ...size, score };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Custom hook for image editing operations with undo support.
 */
export function useImageEditor() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewSize, setPreviewSize] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const undoStackRef = useRef([]);
  const [undoCount, setUndoCount] = useState(0);

  const pushUndo = useCallback((url, size) => {
    undoStackRef.current.push({ url, size });
    setUndoCount(undoStackRef.current.length);
  }, []);

  const handleResize = useCallback(async (sourceUrl, currentSize, targetW, targetH) => {
    setIsProcessing(true);
    try {
      // Save current state for undo
      if (previewUrl) {
        pushUndo(previewUrl, previewSize);
      } else {
        pushUndo(sourceUrl, currentSize);
      }
      const result = await resizeImage(previewUrl || sourceUrl, targetW, targetH);
      setPreviewUrl(result);
      setPreviewSize(`${targetW}x${targetH}`);
    } finally {
      setIsProcessing(false);
    }
  }, [previewUrl, previewSize, pushUndo]);

  const handleCrop = useCallback(async (sourceUrl, currentSize, cropRect, targetW, targetH) => {
    setIsProcessing(true);
    try {
      if (previewUrl) {
        pushUndo(previewUrl, previewSize);
      } else {
        pushUndo(sourceUrl, currentSize);
      }
      const result = await cropImage(previewUrl || sourceUrl, cropRect, targetW, targetH);
      setPreviewUrl(result);
      setPreviewSize(`${targetW}x${targetH}`);
    } finally {
      setIsProcessing(false);
    }
  }, [previewUrl, previewSize, pushUndo]);

  const handleAutoFit = useCallback(async (sourceUrl, currentSize, targetW, targetH) => {
    setIsProcessing(true);
    try {
      if (previewUrl) {
        pushUndo(previewUrl, previewSize);
      } else {
        pushUndo(sourceUrl, currentSize);
      }
      // Always auto-fit from the ORIGINAL source for best quality
      const result = await autoFitImage(sourceUrl, targetW, targetH);
      setPreviewUrl(result);
      setPreviewSize(`${targetW}x${targetH}`);
    } finally {
      setIsProcessing(false);
    }
  }, [previewUrl, previewSize, pushUndo]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop();
    setPreviewUrl(prev.url);
    setPreviewSize(prev.size);
    setUndoCount(undoStackRef.current.length);
  }, []);

  const reset = useCallback(() => {
    setPreviewUrl(null);
    setPreviewSize(null);
    undoStackRef.current = [];
    setUndoCount(0);
    setIsProcessing(false);
  }, []);

  return {
    previewUrl,
    previewSize,
    isProcessing,
    undoCount,
    handleResize,
    handleCrop,
    handleAutoFit,
    handleUndo,
    reset,
    suggestBestSizes,
    ALLOWED_SIZES,
  };
}

export { suggestBestSizes, autoFitImage, ALLOWED_SIZES };
