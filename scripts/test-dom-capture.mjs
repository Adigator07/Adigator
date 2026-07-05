/**
 * Smoke test: html2canvas-pro must load without throwing (browser-only API).
 * Run: node scripts/test-dom-capture.mjs
 */
import html2canvas from "html2canvas-pro";

if (typeof html2canvas !== "function") {
  console.error("FAIL: html2canvas-pro default export is not a function");
  process.exit(1);
}

console.log("OK: html2canvas-pro loaded, version package:", "html2canvas-pro");
