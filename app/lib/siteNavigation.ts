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
  { label: "Solutions", href: "/solutions", hint: "How Adigator IQ solves campaign operations" },
  { label: "About", href: "/about", hint: "Company story, mission, and roadmap" },
  { label: "Google Ads", href: "/google-ads-oauth", hint: "Connect your Google Ads account" },
  { label: "Contact", href: "/contact", hint: "Email or send a message" },
];

/** Public policy URLs Google / reviewers commonly check */
export const MARKETING_TRUST_LINKS: MarketingFooterLink[] = [
  { label: "What Adigator IQ does", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Connect Google Ads", href: "/google-ads-oauth" },
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

export const GOOGLE_ADS_START = {
  label: "Open Google Ads",
  href: "https://ads.google.com/intl/en_in/start/lc/?subid=in-en-gdn-awa-pr-a-pmx!o3~CjwKCAjw7KvTBhA6EiwAWnutYXxpNXcneoz2RSWhuIHA3ovKcIVMkemv38SZf17NKth2kwGVbPnudRoCah0QAvD_BwE~~~21454931486~&gclsrc=aw.ds&gad_source=1&gad_campaignid=21448424331&gclid=CjwKCAjw7KvTBhA6EiwAWnutYXxpNXcneoz2RSWhuIHA3ovKcIVMkemv38SZf17NKth2kwGVbPnudRoCah0QAvD_BwE",
};

export const MARKETING_FOOTER_DESCRIPTION =
  "Campaign validation for agencies and brands who would rather catch mistakes before spend, not after they go live.";

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
  { label: "Connect Google Ads", href: "/google-ads-oauth" },
];

export const MARKETING_FOOTER_LEGAL_LINKS: MarketingFooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
  { label: "Connect Google Ads", href: "/google-ads-oauth" },
];
