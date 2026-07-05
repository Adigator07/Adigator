"use client";

import { useEffect } from "react";

function isBrowserExtensionSource(source: unknown): boolean {
  const text = source instanceof Error
    ? `${source.message}\n${source.stack || ""}`
    : String(source ?? "");

  return (
    text.includes("chrome-extension://")
    || text.includes("moz-extension://")
    || text.includes("safari-extension://")
  );
}

function isExtensionFilename(filename: string | undefined | null): boolean {
  if (!filename) return false;
  return (
    filename.includes("chrome-extension://")
    || filename.includes("moz-extension://")
    || filename.includes("safari-extension://")
  );
}

/** Prevent wallet/browser extension script failures from breaking the app UI. */
export default function BrowserExtensionErrorGuard() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isBrowserExtensionSource(event.reason)) {
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (
        isBrowserExtensionSource(event.error)
        || isExtensionFilename(event.filename)
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError, true);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return null;
}
