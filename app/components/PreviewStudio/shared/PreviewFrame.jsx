"use client";

export default function PreviewFrame({ width = 1024, className = "", style = {}, children }) {
  return (
    <div
      className={`preview-studio-frame shrink-0 overflow-hidden bg-white shadow-lg ${className}`}
      style={{ width, maxWidth: "100%", ...style }}
    >
      {children}
    </div>
  );
}
