export function buildAdCreative({
  sourceCreatives = [],
  selectedSourceId,
  brandName = "Brand",
  keyMessage = "",
  creatives = [],
  imageUrls = [],
}) {
  const source =
    sourceCreatives.find((c) => c.id === selectedSourceId) ||
    sourceCreatives[0] ||
    null;
  const analyzed = creatives[0] || {};
  const signals = analyzed.analyzerOutput?.signals || {};

  const resolvedBrand =
    signals.brand || brandName || analyzed.name || "Brand";
  const slug = String(resolvedBrand)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);

  return {
    headline:
      signals.headline ||
      analyzed.headline ||
      keyMessage ||
      `${resolvedBrand} — Discover More`,
    description:
      signals.primary_message ||
      signals.body ||
      keyMessage ||
      "Your ad description appears here with compelling copy that drives action.",
    cta: signals.cta || analyzed.ctaText || "Learn More",
    imageUrl:
      source?.fullUrl ||
      source?.url ||
      imageUrls[0] ||
      analyzed.url ||
      "",
    logoUrl: signals.logo_url || undefined,
    brandName: resolvedBrand,
    displayUrl: `www.${slug || "brand"}.com › shop`,
  };
}
