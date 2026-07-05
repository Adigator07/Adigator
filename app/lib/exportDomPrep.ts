/** DOM normalization for static PDF/image export (live tree + html2canvas clone). */

const INTERACTIVE_BUTTON_TEXT = /^(view details|hide details|show more|show less|expand|collapse)/i;

export function prepareClonedDomForExport(root: HTMLElement): void {
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const el of nodes) {
    if (el.hasAttribute("data-export-hide")) {
      el.style.setProperty("display", "none", "important");
      continue;
    }

    el.style.setProperty("overflow", "visible", "important");
    el.style.setProperty("overflow-y", "visible", "important");
    el.style.setProperty("overflow-x", "visible", "important");
    el.style.setProperty("max-height", "none", "important");
    el.style.setProperty("height", "auto", "important");

    if (el.tagName === "DETAILS") {
      el.setAttribute("open", "");
    }

    if (el.tagName === "SUMMARY") {
      el.style.setProperty("display", "none", "important");
    }

    if (el.tagName === "BUTTON" && !el.hasAttribute("data-export-keep")) {
      const label = (el.textContent || "").trim();
      if (!label || INTERACTIVE_BUTTON_TEXT.test(label)) {
        el.style.setProperty("display", "none", "important");
      }
    }

    if (el.tagName === "A" && el.getAttribute("href")) {
      el.style.setProperty("pointer-events", "none", "important");
      el.style.setProperty("cursor", "default", "important");
    }
  }
}

export function measureExportDimensions(root: HTMLElement): { width: number; height: number } {
  const width = Math.max(root.scrollWidth, root.offsetWidth, root.clientWidth);
  const height = Math.max(root.scrollHeight, root.offsetHeight, root.clientHeight);
  return { width: Math.ceil(width), height: Math.ceil(height) };
}
