export type MarketingNavLink = {
  label: string;
  href: string;
  hint: string;
};

export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { label: "Solutions", href: "/solutions", hint: "See use cases and teams" },
  { label: "About", href: "/about", hint: "Learn about the Adigator system" },
  { label: "Contact", href: "/contact", hint: "Get in touch with our team" },
];

export const MARKETING_CTA = {
  label: "Try Free",
  href: "/preview-tool?demo=1&step=1",
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
  "The pre launch campaign validation layer for agencies and brands who refuse to waste media spend on preventable errors.";

export const MARKETING_FOOTER_LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/about" },
  { label: "Terms of Service", href: "/about" },
  { label: "Contact Us", href: "/contact" },
] as const;
