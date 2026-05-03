/**
 * universalSlots.js
 * Defines the universal ad slot configurations used by SlidePreview.
 *
 * Each slot MUST have:
 *   id       – unique string
 *   name     – human-readable label
 *   size     – "WxH" string (matches creative.size)
 *   position – legacy position hint
 *   device   – "desktop" | "mobile" | "both"
 *   zone     – "top" | "left" | "right" | "content" | "bottom" | "full"
 *              TemplateRenderer groups slots by this field.
 *   slot     – { width, height } in px — AdSlot reads these for its dimensions.
 */

export const universalSlots = [
  // ── Leaderboard ──────────────────────────────────────────────
  {
    id: "slot-728x90-top",
    name: "Leaderboard Top",
    size: "728x90",
    position: "top",
    device: "desktop",
    zone: "top",
    slot: { width: 728, height: 90 },
  },
  {
    id: "slot-728x90-mid",
    name: "Leaderboard Mid",
    size: "728x90",
    position: "middle",
    device: "desktop",
    zone: "content",
    slot: { width: 728, height: 90 },
  },
  {
    id: "slot-728x90-bottom",
    name: "Leaderboard Bottom",
    size: "728x90",
    position: "bottom",
    device: "desktop",
    zone: "bottom",
    slot: { width: 728, height: 90 },
  },

  // ── Medium Rectangle ─────────────────────────────────────────
  {
    id: "slot-300x250-right",
    name: "Medium Rect Right",
    size: "300x250",
    position: "right",
    device: "both",
    zone: "right",
    slot: { width: 300, height: 250 },
  },
  {
    id: "slot-300x250-left",
    name: "Medium Rect Left",
    size: "300x250",
    position: "left",
    device: "both",
    zone: "left",
    slot: { width: 300, height: 250 },
  },
  {
    id: "slot-300x250-mid",
    name: "Medium Rect Mid",
    size: "300x250",
    position: "middle",
    device: "both",
    zone: "content",
    slot: { width: 300, height: 250 },
  },

  // ── Large Rectangle ──────────────────────────────────────────
  {
    id: "slot-336x280-right",
    name: "Large Rect Right",
    size: "336x280",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 336, height: 280 },
  },
  {
    id: "slot-336x280-left",
    name: "Large Rect Left",
    size: "336x280",
    position: "left",
    device: "desktop",
    zone: "left",
    slot: { width: 336, height: 280 },
  },

  // ── Wide Skyscraper ──────────────────────────────────────────
  {
    id: "slot-160x600-right",
    name: "Wide Skyscraper R",
    size: "160x600",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 160, height: 600 },
  },
  {
    id: "slot-160x600-left",
    name: "Wide Skyscraper L",
    size: "160x600",
    position: "left",
    device: "desktop",
    zone: "left",
    slot: { width: 160, height: 600 },
  },
  {
    id: "slot-120x600-right",
    name: "Skyscraper Right",
    size: "120x600",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 120, height: 600 },
  },

  // ── Half Page ────────────────────────────────────────────────
  {
    id: "slot-300x600-right",
    name: "Half Page Right",
    size: "300x600",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 300, height: 600 },
  },
  {
    id: "slot-300x600-left",
    name: "Half Page Left",
    size: "300x600",
    position: "left",
    device: "desktop",
    zone: "left",
    slot: { width: 300, height: 600 },
  },

  // ── Billboard / Panorama ─────────────────────────────────────
  {
    id: "slot-970x250-top",
    name: "Billboard Top",
    size: "970x250",
    position: "top",
    device: "desktop",
    zone: "top",
    slot: { width: 970, height: 250 },
  },
  {
    id: "slot-970x90-top",
    name: "Super Leaderboard",
    size: "970x90",
    position: "top",
    device: "desktop",
    zone: "top",
    slot: { width: 970, height: 90 },
  },

  // ── Portrait / Large Format ──────────────────────────────────
  {
    id: "slot-300x1050-right",
    name: "Portrait Right",
    size: "300x1050",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 300, height: 1050 },
  },

  // ── Small / Legacy ───────────────────────────────────────────
  {
    id: "slot-250x250-right",
    name: "Square Right",
    size: "250x250",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 250, height: 250 },
  },
  {
    id: "slot-200x200-right",
    name: "Small Square Right",
    size: "200x200",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 200, height: 200 },
  },
  {
    id: "slot-180x150-right",
    name: "Sm Rect Right",
    size: "180x150",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 180, height: 150 },
  },
  {
    id: "slot-468x60-top",
    name: "Full Banner Top",
    size: "468x60",
    position: "top",
    device: "desktop",
    zone: "top",
    slot: { width: 468, height: 60 },
  },
  {
    id: "slot-234x60-top",
    name: "Half Banner Top",
    size: "234x60",
    position: "top",
    device: "desktop",
    zone: "top",
    slot: { width: 234, height: 60 },
  },
  {
    id: "slot-120x240-right",
    name: "Vertical Banner R",
    size: "120x240",
    position: "right",
    device: "desktop",
    zone: "right",
    slot: { width: 120, height: 240 },
  },

  // ── Mobile ───────────────────────────────────────────────────
  {
    id: "slot-320x50-top",
    name: "Mobile Banner Top",
    size: "320x50",
    position: "top",
    device: "mobile",
    zone: "top",
    slot: { width: 320, height: 50 },
  },
  {
    id: "slot-320x50-bottom",
    name: "Mobile Banner Bot",
    size: "320x50",
    position: "bottom",
    device: "mobile",
    zone: "bottom",
    slot: { width: 320, height: 50 },
  },
  {
    id: "slot-320x100-top",
    name: "Mobile Large Top",
    size: "320x100",
    position: "top",
    device: "mobile",
    zone: "top",
    slot: { width: 320, height: 100 },
  },
  {
    id: "slot-320x100-bottom",
    name: "Mobile Large Bot",
    size: "320x100",
    position: "bottom",
    device: "mobile",
    zone: "bottom",
    slot: { width: 320, height: 100 },
  },
  {
    id: "slot-320x480-full",
    name: "Mobile Interstitial",
    size: "320x480",
    position: "full",
    device: "mobile",
    zone: "full",
    slot: { width: 320, height: 480 },
  },
  {
    id: "slot-360x640-full",
    name: "Mobile Full HD",
    size: "360x640",
    position: "full",
    device: "mobile",
    zone: "full",
    slot: { width: 360, height: 640 },
  },
  {
    id: "slot-375x667-full",
    name: "iPhone SE Full",
    size: "375x667",
    position: "full",
    device: "mobile",
    zone: "full",
    slot: { width: 375, height: 667 },
  },
  {
    id: "slot-414x736-full",
    name: "iPhone Plus Full",
    size: "414x736",
    position: "full",
    device: "mobile",
    zone: "full",
    slot: { width: 414, height: 736 },
  },
];