/**
 * DOM screenshot capture — uses html2canvas-pro for Tailwind v4 oklab/oklch/color-mix support.
 */

import html2canvas from "html2canvas-pro";
import { measureExportDimensions, prepareClonedDomForExport } from "./exportDomPrep";

export type DomCaptureOptions = {
  scale?: number;
  backgroundColor?: string;
  scrollY?: number;
  windowWidth?: number;
  windowHeight?: number;
  logging?: boolean;
  ignoreElements?: (element: Element) => boolean;
};

/**
 * Capture a DOM node to canvas. html2canvas-pro handles modern CSS color functions
 * (oklab, oklch, color-mix) that break the stock html2canvas package.
 */
export async function captureDomToCanvas(
  element: HTMLElement,
  options: DomCaptureOptions = {},
): Promise<HTMLCanvasElement> {
  const { width, height } = measureExportDimensions(element);

  return html2canvas(element, {
    scale: options.scale ?? 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: options.backgroundColor ?? "#07070f",
    logging: options.logging ?? false,
    scrollX: 0,
    scrollY: options.scrollY ?? 0,
    width,
    height,
    windowWidth: options.windowWidth ?? width,
    windowHeight: options.windowHeight ?? height,
    ignoreElements: options.ignoreElements,
    onclone: (_document, clonedElement) => {
      prepareClonedDomForExport(clonedElement as HTMLElement);
      // Ensure live video nodes never paint into the chrome plate.
      clonedElement.querySelectorAll("video, [data-preview-video='true']").forEach((node) => {
        const el = node as HTMLElement;
        el.style.visibility = "hidden";
        el.style.opacity = "0";
      });
    },
  });
}
