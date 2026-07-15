export type MarketingNavLink = {
  label: string;
  href: string;
  hint: string;
};

export type MarketingFooterLink = {
  label: string;
  href: string;
};

export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { label: "Solutions", href: "/solutions", hint: "How Adigator solves campaign operations" },
  { label: "About", href: "/about", hint: "Company story, mission, and roadmap" },
  { label: "Contact", href: "/contact", hint: "Get in touch with our team" },
];

export const MARKETING_CTA = {
  label: "Try Free",
  href: "/preview-tool?demo=1&step=campaign-setup",
};

export const MARKETING_DEMO_VIDEO = {
  label: "Watch Product Tour",
  href: "/demo",
};

export const MARKETING_SIGN_IN = {
  label: "Sign In",
  href: "/login",
};

export const MARKETING_FOOTER_DESCRIPTION =
  "The pre-launch campaign validation layer for agencies and brands who refuse to waste media spend on preventable errors.";

export const MARKETING_FOOTER_PRODUCT_LINKS: MarketingFooterLink[] = [
  { label: "Solutions", href: "/solutions" },
  { label: "About", href: "/about" },
  { label: "Product Tour", href: "/demo" },
  { label: "Try Free", href: "/preview-tool?demo=1&step=campaign-setup" },
];

export const MARKETING_FOOTER_RESOURCE_LINKS: MarketingFooterLink[] = [
  { label: "Validation Methodology", href: "/methodology" },
  { label: "Operational Scenarios", href: "/operational-scenarios" },
  { label: "Campaign Error Library", href: "/campaign-error-library" },
];

export const MARKETING_FOOTER_LEGAL_LINKS: MarketingFooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
];
