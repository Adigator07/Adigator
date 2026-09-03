export const PRODUCTION_DOMAIN = "adigatoriq.com";
export const PRODUCTION_ORIGIN = `https://${PRODUCTION_DOMAIN}`;

/** User-facing product name (headings, login, marketing, exports). */
export const BRAND_NAME = "Adigator IQ";

export const SITE_EMAILS = {
  hello: `hello@${PRODUCTION_DOMAIN}`,
  privacy: `privacy@${PRODUCTION_DOMAIN}`,
  legal: `legal@${PRODUCTION_DOMAIN}`,
} as const;
