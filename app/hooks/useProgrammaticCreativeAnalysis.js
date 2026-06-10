"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCreativeAnalysisDimensions } from "@/app/lib/creativeFitAnalysis";
import {
  detectProgrammaticElementsFromImageData,
  mergeElementDetections,
  normalizeProgrammaticApiElements,
} from "@/app/lib/programmaticCreativePlacementAnalysis";

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load creative image"));
    img.src = url;
  });
}

export function useProgrammaticCreativeAnalysis(selectedSource) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [elements, setElements] = useState([]);
  const [detectionSource, setDetectionSource] = useState("none");
  const requestIdRef = useRef(0);

  const analyze = useCallback(async (source) => {
    const url = source?.fullUrl || source?.url;
    if (!url) {
      setStatus("idle");
      setElements([]);
      setImageUrl(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("loading");
    setError(null);
    setImageUrl(url);

    try {
      const img = await loadImage(url);
      if (requestIdRef.current !== requestId) return;

      const { width, height } = getCreativeAnalysisDimensions(source, img);
      setImageSize({ width, height });

      const canvas = document.createElement("canvas");
      const maxDim = 720;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const scaleX = width / canvas.width;
      const scaleY = height / canvas.height;

      const heuristicElements = detectProgrammaticElementsFromImageData(
        imageData,
        canvas.width,
        canvas.height,
      ).map((el) => ({
        ...el,
        x: el.x * scaleX,
        y: el.y * scaleY,
        width: el.width * scaleX,
        height: el.height * scaleY,
      }));

      let merged = heuristicElements;
      let sourceLabel = "heuristic";

      try {
        const response = await fetch("/api/programmatic-creative-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
        });
        const payload = await response.json();
        if (requestIdRef.current !== requestId) return;

        if (payload?.ok && Array.isArray(payload.elements) && payload.elements.length) {
          const visionElements = normalizeProgrammaticApiElements(payload.elements, width, height);
          merged = mergeElementDetections(visionElements, heuristicElements);
          sourceLabel = payload.source === "vision" ? "vision+heuristic" : "heuristic";
        }
      } catch {
        // Vision optional
      }

      if (requestIdRef.current !== requestId) return;
      setElements(merged);
      setDetectionSource(sourceLabel);
      setStatus("ready");
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Analysis failed");
      setElements([]);
    }
  }, []);

  useEffect(() => {
    analyze(selectedSource);
  }, [selectedSource, analyze]);

  return {
    status,
    error,
    imageUrl,
    imageSize,
    elements,
    detectionSource,
    retry: () => analyze(selectedSource),
  };
}
