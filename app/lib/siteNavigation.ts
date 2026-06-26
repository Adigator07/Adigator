export type MarketingNavLink = {
  label: string;
  href: string;
  hint: string;
};

export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { label: "Solutions", href: "/solutions", hint: "See use cases and teams" },
  { label: "About", href: "/about", hint: "Learn about the Adigator system" },
];

export const MARKETING_CTA = {
  label: "Book Demo",
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

export const MARKETING_FOOTER_COLUMNS = [
  {
    title: "Products",
    items: [
      { label: "Campaign Validation", href: "/preview-tool" },
      { label: "Creative Preview", href: "/preview" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Solutions",
    items: [
      { label: "Solutions Overview", href: "/solutions" },
      { label: "Problems We Solve", href: "/solutions#problems" },
      { label: "By Team", href: "/solutions#team" },
      { label: "By Platform", href: "/solutions#platform" },
      { label: "By Workflow", href: "/solutions#workflow" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Preview Tool", href: "/preview-tool?demo=1&step=1" },
      { label: "Live Preview", href: "/preview" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Solutions", href: "/solutions" },
      { label: "Contact", href: "/about" },
    ],
  },
] as const;

export const MARKETING_PARTNER_BADGES = ["SOC2", "GDPR", "ISO"];
