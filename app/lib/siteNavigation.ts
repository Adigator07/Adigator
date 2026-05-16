export type MarketingNavLink = {
  label: string;
  href: string;
  hint: string;
};

export const MARKETING_NAV_LINKS: MarketingNavLink[] = [
  { label: "Home", href: "/", hint: "Go to homepage" },
  { label: "Products", href: "/product", hint: "Explore the product platform" },
  { label: "Solutions", href: "/solutions", hint: "See use cases and teams" },
  { label: "About", href: "/about", hint: "Learn about the Adigator system" },
  { label: "Login", href: "/login", hint: "Access your workspace" },
];

export const MARKETING_CTA = {
  label: "Get a Demo",
  href: "/preview-tool",
};

export const MARKETING_FOOTER_COLUMNS = [
  {
    title: "Products",
    items: [
      { label: "Product Platform", href: "/product" },
      { label: "Preview Studio", href: "/preview-tool" },
      { label: "Creative Analysis", href: "/preview" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Solutions",
    items: [
      { label: "Solutions Overview", href: "/solutions" },
      { label: "For Performance Teams", href: "/solutions#team" },
      { label: "By Industry", href: "/solutions#industry" },
      { label: "Use Cases", href: "/solutions#use-case" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Preview Tool", href: "/preview-tool" },
      { label: "Live Preview", href: "/preview" },
      { label: "Login", href: "/login" },
      { label: "Home", href: "/" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Product", href: "/product" },
      { label: "Solutions", href: "/solutions" },
      { label: "Contact", href: "/about" },
    ],
  },
] as const;

export const MARKETING_PARTNER_BADGES = ["SOC2", "GDPR", "ISO"];
