/**
 * High-resolution DOM → PDF capture utilities (WYSIWYG export).
 */

import { captureDomToCanvas } from "./domCapture";

/** ~300 DPI when base layout is 1280 CSS px at 96 DPI (1280 * 2.5 ≈ 3200px). */
export const WYSIWYG_CAPTURE_SCALE = 2.5;
export const WYSIWYG_EXPORT_WIDTH_PX = 1280;

export type CaptureOptions = {
  scale?: number;
  backgroundColor?: string;
  signal?: AbortSignal;
};

export async function waitForPaint(frames = 3): Promise<void> {
  for (let i = 0; i < frames; i += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

/** Yield to the browser so long export captures do not freeze the UI. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 120 });
    } else if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 16);
    }
  });
}

export async function waitForImages(root: HTMLElement, timeoutMs = 12000): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  const pending = images.filter((img) => !img.complete);
  if (!pending.length) return;

  await Promise.race([
    Promise.all(
      pending.map(
        (img) => new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
      ),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export async function waitForExportReady(
  root: HTMLElement,
  timeoutMs = 45000,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (root.querySelector('[data-export-ready="true"]')) {
      await waitForPaint(4);
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 120));
  }
  throw new Error("Timed out waiting for preview export readiness.");
}

type ExportStyleSnapshot = {
  el: HTMLElement;
  hidden?: boolean;
  display?: string;
  overflow?: string;
  overflowY?: string;
  overflowX?: string;
  maxHeight?: string;
  height?: string;
};

/** Unclip scroll/max-height containers and hide interactive-only controls before capture. */
export function prepareDomForStaticExport(root: HTMLElement): ExportStyleSnapshot[] {
  const snapshots: ExportStyleSnapshot[] = [];
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const el of nodes) {
    if (el.hasAttribute("data-export-hide")) {
      snapshots.push({ el, hidden: true, display: el.style.display });
      el.style.display = "none";
      continue;
    }

    const computed = window.getComputedStyle(el);
    const maxHeight = computed.maxHeight;
    const parsedMaxHeight = maxHeight === "none" ? Infinity : parseFloat(maxHeight);
    const overflowY = computed.overflowY;
    const overflow = computed.overflow;
    const clipsVertically =
      (Number.isFinite(parsedMaxHeight) && parsedMaxHeight > 0 && el.scrollHeight > el.clientHeight + 2)
      || overflowY === "auto"
      || overflowY === "scroll"
      || (overflow === "hidden" && el.scrollHeight > el.clientHeight + 2);

    if (!clipsVertically) continue;

    snapshots.push({
      el,
      overflow: el.style.overflow,
      overflowY: el.style.overflowY,
      overflowX: el.style.overflowX,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
    });
    el.style.overflow = "visible";
    el.style.overflowY = "visible";
    el.style.overflowX = "visible";
    el.style.maxHeight = "none";
    el.style.height = "auto";
  }

  return snapshots;
}

export function restoreDomAfterStaticExport(snapshots: ExportStyleSnapshot[]): void {
  for (const snap of snapshots) {
    if (snap.hidden) {
      snap.el.style.display = snap.display ?? "";
      continue;
    }
    snap.el.style.overflow = snap.overflow ?? "";
    snap.el.style.overflowY = snap.overflowY ?? "";
    snap.el.style.overflowX = snap.overflowX ?? "";
    snap.el.style.maxHeight = snap.maxHeight ?? "";
    snap.el.style.height = snap.height ?? "";
  }
}

export async function captureElement(
  element: HTMLElement,
  options: CaptureOptions = {},
): Promise<HTMLCanvasElement> {
  if (options.signal?.aborted) {
    throw new DOMException("Capture aborted", "AbortError");
  }

  const prevOverflow = element.style.overflow;
  const prevHeight = element.style.height;
  const prevMaxHeight = element.style.maxHeight;
  const prevWidth = element.style.width;

  element.style.overflow = "visible";
  element.style.height = "auto";
  element.style.maxHeight = "none";
  if (!element.style.width) {
    element.style.width = `${WYSIWYG_EXPORT_WIDTH_PX}px`;
  }

  await waitForImages(element);
  await waitForPaint(6);

  const exportPrep = prepareDomForStaticExport(element);
  await waitForPaint(4);

  const captureWidth = Math.max(element.scrollWidth, element.offsetWidth);
  const captureHeight = Math.max(element.scrollHeight, element.offsetHeight);

  try {
    const canvas = await captureDomToCanvas(element, {
      scale: options.scale ?? WYSIWYG_CAPTURE_SCALE,
      backgroundColor: options.backgroundColor ?? "#07070f",
      scrollY: 0,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
    });
    return canvas;
  } finally {
    restoreDomAfterStaticExport(exportPrep);
    element.style.overflow = prevOverflow;
    element.style.height = prevHeight;
    element.style.maxHeight = prevMaxHeight;
    element.style.width = prevWidth;
  }
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode canvas"))),
      "image/png",
      1,
    );
  });
}

export async function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL("image/png", 1);
}

/** Append a tall canvas to jsPDF, splitting across A4 portrait pages without cropping width. */
export async function appendCanvasToPdf(
  doc: import("jspdf").jsPDF,
  canvas: HTMLCanvasElement,
  isFirstPage: boolean,
): Promise<void> {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const dataUrl = await canvasToDataUrl(canvas);

  let offsetY = 0;
  let first = isFirstPage;

  while (offsetY < imgH) {
    if (!first) doc.addPage();
    first = false;
    doc.addImage(dataUrl, "PNG", 0, -offsetY, imgW, imgH, undefined, "FAST");
    offsetY += pageH;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function canvasesToPdf(
  canvases: HTMLCanvasElement[],
  meta: { title?: string; subject?: string } = {},
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ format: "a4", unit: "pt", compress: false });
  if (meta.title) doc.setProperties({ title: meta.title, subject: meta.subject || meta.title });

  let isFirst = true;
  for (const canvas of canvases) {
    await appendCanvasToPdf(doc, canvas, isFirst);
    isFirst = false;
  }

  return doc.output("blob");
}
