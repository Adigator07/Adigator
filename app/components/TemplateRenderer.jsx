"use client";

import NewspaperTemplate from "./templates/NewspaperTemplate";
import EcommerceTemplate from "./templates/EcommerceTemplate";
import HealthTemplate from "./templates/HealthTemplate";
import TechnologyTemplate from "./templates/TechnologyTemplate";
import BusinessTemplate from "./templates/BusinessTemplate";
import EntertainmentTemplate from "./templates/EntertainmentTemplate";

// Derive a zone from a slot's position/size if the zone field is missing.
// This is a safety net for slots that predate the zone field.
function inferZone(slot) {
  if (slot.zone) return slot.zone;

  const pos = slot.position || "";
  const [w, h] = (slot.size || "0x0").split("x").map(Number);

  if (pos === "top") return "top";
  if (pos === "bottom") return "bottom";
  if (pos === "full") return "full";
  if (pos === "left") return "left";
  if (pos === "right") return "right";

  // Infer from dimensions
  if (w >= 600 && h <= 120) return "top";          // wide + short = banner
  if (h >= 400 && w <= 200) return "left";          // tall + narrow = sidebar
  if (h >= 400 && w >= 250 && w <= 340) return "right"; // half-page / skyscraper
  return "content";                                  // everything else
}

export default function TemplateRenderer({
  allSlots = [],
  activeSlotId,
  slotCreativeMap = {},
  showSlotLabels = false,
  isMobile = false,
  selectedTemplate = "newspaper",
}) {
  // Normalise: attach inferred zone to every slot so templates always see it
  const normalisedSlots = allSlots.map((s) => ({
    ...s,
    zone: inferZone(s),
    // Ensure slot.slot dimensions exist (parse from size if absent)
    slot: s.slot || (() => {
      const [w, h] = (s.size || "300x250").split("x").map(Number);
      return { width: w || 300, height: h || 250 };
    })(),
  }));

  const topSlots     = normalisedSlots.filter((s) => s.zone === "top");
  const leftSlots    = normalisedSlots.filter((s) => s.zone === "left");
  const rightSlots   = normalisedSlots.filter((s) => s.zone === "right");
  const contentSlots = normalisedSlots.filter((s) => s.zone === "content");
  const bottomSlots  = normalisedSlots.filter((s) => s.zone === "bottom");
  const fullSlots    = normalisedSlots.filter((s) => s.zone === "full");

  // If nothing was binned into zones, dump everything into content
  // so the template always has something to render.
  const hasAnything =
    topSlots.length + leftSlots.length + rightSlots.length +
    contentSlots.length + bottomSlots.length + fullSlots.length > 0;

  const commonProps = {
    allSlots: normalisedSlots,          // ← templates can also iterate allSlots directly
    topSlots,
    leftSlots,
    rightSlots,
    contentSlots: hasAnything ? contentSlots : normalisedSlots,
    bottomSlots,
    fullSlots,
    activeSlotId,
    slotCreativeMap,
    showSlotLabels,
    isMobile,
  };

  switch (selectedTemplate) {
    case "ecommerce":
      return <EcommerceTemplate {...commonProps} />;
    case "health":
      return <HealthTemplate {...commonProps} />;
    case "technology":
      return <TechnologyTemplate {...commonProps} />;
    case "business":
      return <BusinessTemplate {...commonProps} />;
    case "entertainment":
      return <EntertainmentTemplate {...commonProps} />;
    case "newspaper":
    default:
      return <NewspaperTemplate {...commonProps} />;
  }
}